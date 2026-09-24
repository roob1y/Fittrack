import React, { useEffect, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import RecapScreen from './RecapScreen';
import RankUpScreen from '../Ranks/RankUpScreen';
import { rankBoard, rankUps as diffRanks } from '../../utils/ranks';
import RestTimer, { getRestDuration } from './RestTimer';
import { hapticsImpact } from '../../hooks/useHaptics';
import ExerciseDetailSheet from './ExerciseDetailSheet';
import { scheduleLocalNotification, cancelLocalNotification } from '../../plugins/localNotifications';
import { setKey, exerciseNoteKey, dayKey, holdKey, exerciseKeyPart, swapKey } from '../../utils/setKeys';
import { dayTiles, pickOption, slotChoiceKey, loggedSetCount } from '../../utils/slots';
import { lastLoggedValue, lastUsedBestWeight } from '../../utils/history';
import { captureSessionWindow } from '../../utils/healthSync';
import { isAssisted, bodyweightAt, effectiveFromAssist } from '../../utils/loads';
import { sessionsFor } from '../../utils/progressStats';
import { nextTarget, tidy, incrementFor } from '../../utils/increments';
import Icon from '../ui/Icon';
import { EMPTY } from '../../store/shape';

const THIRTY_MINS = 30 * 60 * 1000;
// How far behind MARK DAY COMPLETE the last logged set may sit before the session
// is timed to the set instead of to the button. His rests run to 150s, so ten
// minutes of nothing means the lifting has stopped.
const LAST_SET_GRACE = 10 * 60 * 1000;

const todayISO = () => new Date().toISOString().slice(0, 10);
const truncate = (str, n) => (str && str.length > n ? str.slice(0, n - 1) + '…' : str);
// Strip pills need to fit: drop the bracketed qualifier and the "Optional Finisher —" prefix.
const shortName = (name) =>
  String(name)
    .replace(/^Optional Finisher\s*[—-]\s*/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/^(Dumbbell|Barbell|Cable|Machine|Seated|Assisted)\s+/i, '')
    .trim();

function useToast() {
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }
  return showToast;
}

// Pre-fill and "last used" lookups now live in utils/history.js, which reads every
// day carrying the exercise's history group rather than this day alone. The three
// helpers that used to sit here scanned `week - 1` downwards on one dayId, which is
// why 16 kg of crunches logged on Push never reached the Pull tile.

function ExerciseCard({ ex, ei, dayId, weekNum, onSetTicked, swapped, onSwap, readOnly, slotOptions, onSlotSwap }) {
  const showToast = useToast();
  const [detailOpen, setDetailOpen] = useState(false);
  // Which set is being worked on: null = the first one not yet logged.
  const [pickedSi, setPickedSi] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);

  const setData = useStore((s) => s.programmeData[s.activeProgrammeId]?.setData ?? EMPTY);
  const saveSetData = useStore((s) => s.saveSetData);
  const savePB = useStore((s) => s.savePB);
  const savePBAchieved = useStore((s) => s.savePBAchieved);
  const clearPBAchieved = useStore((s) => s.clearPBAchieved);
  const recomputePB = useStore((s) => s.recomputePB);
  const equipment = useStore((s) => s.equipment);
  const pbsAchieved = useStore((s) => s.pbsAchieved);
  const exerciseNotes = useStore((s) => s.programmeData[s.activeProgrammeId]?.exerciseNotes ?? EMPTY);
  const saveExerciseNote = useStore((s) => s.saveExerciseNote);
  const weightLog = useStore((s) => s.weightLog);
  const heldExercises = useStore((s) => s.programmeData[s.activeProgrammeId]?.heldExercises ?? EMPTY);
  const toggleHeldExercise = useStore((s) => s.toggleHeldExercise);
  const held = heldExercises[holdKey(dayId, ex)];
  const workoutDates = useStore((s) => s.programmeData[s.activeProgrammeId]?.workoutDates ?? EMPTY);
  const programmeId = useStore((s) => s.activeProgrammeId);

  // Pre-fills read the whole HISTORY GROUP, not just this day — the weighted
  // crunch finisher is on Push and on Pull, and going up to 16 kg on one has to
  // show on the other. `days` is what lets the lookup find the sibling entry.
  const days = PROGRAMMES[programmeId]?.days;
  const log = { setData, workoutDates };

  const resolvedEx = resolveExercise(ex);
  const assisted = isAssisted(resolvedEx);

  // Which exercise these sets are really being done on. Null means the programmed
  // one; a name means the alternative — via a manual ⇄ swap or an equipment
  // substitution. Every set with anything in it carries it as `via`, so the
  // scoring and overload code can tell a Smith machine session from a barbell one
  // later. Only while the session is live: a finished day is not re-stamped from
  // whatever the equipment list says today.
  const performedVia = resolvedEx.status === 'swapped' || resolvedEx.status === 'alternative' ? resolvedEx.name : null;
  useEffect(() => {
    if (readOnly) return;
    for (let si = 0; si < ex.sets; si++) {
      const k = setKey(weekNum, dayId, ex, si);
      const d = setData[k];
      if (!d || !(d.done || d.weight || d.reps || d.assist)) continue;
      if ((d.via ?? null) !== performedVia) saveSetData(k, 'via', performedVia);
    }
  }, [performedVia, setData, readOnly, ex, weekNum, dayId, saveSetData]);
  // Bodyweight as of this session, for turning an assist into an effective load.
  const bw = assisted ? bodyweightAt(weightLog, workoutDates[dayKey(weekNum, dayId)] ?? todayISO()) : null;

  // A shared slot is ONE thing to do on either of two machines (the leg presses).
  // `slotOptions` carries both; this is the one currently hidden behind the ⇄.
  // Its logged sets matter: swapping does not move data, so if he entered three
  // sets on the plate-loaded machine and then swapped, those sets are still his
  // and the tile has to say so rather than quietly hiding them.
  const slotAlt =
    slotOptions && slotOptions.length > 1 ? slotOptions.find((o) => exerciseKeyPart(o) !== exerciseKeyPart(ex)) : null;
  const slotAltSets = slotAlt ? loggedSetCount(setData, weekNum, dayId, slotAlt) : 0;

  // On an assisted exercise the input holds the ASSIST. `weight` is written
  // alongside it as bodyweight minus assist, so PB detection, the strength graph,
  // tonnage and the exports all keep reading the number they already expect.
  function saveAssist(setKeyStr, raw) {
    saveSetData(setKeyStr, 'assist', raw);
    const eff = effectiveFromAssist(bw?.kg, raw);
    saveSetData(setKeyStr, 'weight', eff === null ? '' : String(eff));
  }
  // The weight suggestion, in the place it is actually needed.
  //
  // Built from sessions BEFORE this one — if it read the session in progress it
  // would move under you as you logged sets. It is a suggestion, never a silent
  // write: the number only enters the log when the button is pressed, because a
  // pre-filled weight you did not lift is worse than no weight at all.
  const suggestion = React.useMemo(() => {
    const history = sessionsFor(days, log, dayId, ex).filter(
      (s) => !(s.dayId === dayId && s.week >= weekNum) && (s.via ?? null) === performedVia,
    );
    if (!history.length) return null;
    if (held) return null;
    const target = nextTarget(resolvedEx, history[history.length - 1]);
    if (!target || target.verdict !== 'add' || target.nextLoad == null) return null;
    if (assisted) {
      // More weight on an assisted machine means LESS counterweight.
      const assist = bw?.kg != null ? tidy(Math.max(0, bw.kg - target.nextLoad)) : null;
      if (assist == null) return null;
      return { ...target, apply: String(assist), label: `${assist} kg assist`, effective: target.nextLoad };
    }
    return { ...target, apply: String(target.nextLoad), label: `${target.nextLoad} kg` };
  }, [setData, workoutDates, dayId, ex, weekNum, resolvedEx, assisted, bw?.kg, held, performedVia]);

  function applySuggestion() {
    if (!suggestion) return;
    for (let si = 0; si < resolvedEx.sets; si++) {
      const k = setKey(weekNum, dayId, ex, si);
      if (assisted) saveAssist(k, suggestion.apply);
      else saveSetData(k, 'weight', suggestion.apply);
    }
    showToast(`Set to ${suggestion.label}`);
  }

  const repsArr = buildRepsArray(resolvedEx);
  const hasPB = !!pbsAchieved[`week${weekNum}_${dayId}_${resolvedEx.name}`];

  function getWeightWarningThreshold(ex) {
    if (ex.equipment?.some((e) => e.includes('Barbell'))) return 250;
    if (ex.equipment?.some((e) => e.includes('Dumbbell'))) return 80;
    return 150;
  }

  function isWeightSuspect(value, ex) {
    const num = parseFloat(value);
    if (!isFinite(num) || num === 0 || value === '') return false;
    if (num < 0) return true;
    return num > getWeightWarningThreshold(ex);
  }

  function isRepsSuspect(value) {
    const num = parseInt(value);
    if (!isFinite(num) || num === 0 || value === '') return false;
    if (num < 0) return true;
    return num > 50;
  }

  function hasEquipment(required) {
    if (!required || required.length === 0) return true;
    return required.every((e) => equipment?.includes(e));
  }

  // Which exercises offer the ⇄ swap.
  //
  // Deliberately narrow. Widening this to "any alternative whose equipment he has"
  // was tried and reverted: it would have put a swap button on a dozen tiles at
  // once and re-surfaced Cable Lateral Raises, which he has asked not to see.
  // A substitution that deserves its own history — the Smith bench, the two leg
  // presses, the two RDLs, the two shoulder presses — is a `slot` in program.js
  // instead, which persists the choice and keeps the numbers apart.
  function isBarbbellDumbbellPair(ex) {
    if (!ex.alternative) return false;
    const hasBarbell = ex.equipment?.some((e) => e.includes('Barbell'));
    const altHasDumbbell = ex.alternative.equipment?.some((e) => e.includes('Dumbbell'));
    const hasDumbbell = ex.equipment?.some((e) => e.includes('Dumbbell'));
    const altHasBarbell = ex.alternative.equipment?.some((e) => e.includes('Barbell'));
    return (hasBarbell && altHasDumbbell) || (hasDumbbell && altHasBarbell);
  }

  function resolveExercise(ex) {
    // Manual session swap takes priority
    if (swapped && ex.alternative) {
      return {
        ...ex,
        ...ex.alternative,
        sets: ex.sets,
        reps: ex.reps,
        defaultWeight: ex.alternative.defaultWeight || '',
        status: 'swapped',
      };
    }
    if (hasEquipment(ex.equipment)) return { ...ex, status: 'available' };
    if (ex.alternative && hasEquipment(ex.alternative.equipment)) {
      // Carry the alternative's own equipment and default weight, not just its name.
      // A machine stack figure and a per-hand dumbbell figure are not interchangeable,
      // so fall back to blank rather than inheriting the primary exercise's weight.
      return {
        ...ex,
        ...ex.alternative,
        sets: ex.sets,
        reps: ex.reps,
        defaultWeight: ex.alternative.defaultWeight ?? '',
        status: 'alternative',
      };
    }
    return { ...ex, status: 'unavailable' };
  }

  function buildRepsArray(ex) {
    const parts = ex.reps.split('/').sort((a, b) => parseInt(b) - parseInt(a));
    if (parts.length >= ex.sets) return parts.slice(0, ex.sets);
    const arr = [];
    for (let i = 0; i < ex.sets; i++) arr.push(parts[i] || parts[parts.length - 1]);
    return arr;
  }

  function checkPB(exName, weight, reps) {
    if (!weight || !reps) return false;
    const e1rm = weight * (1 + reps / 30);
    const current = useStore.getState().pbs[exName];
    if (!current) return false;
    if (e1rm > current) {
      savePB(exName, e1rm);
      return true;
    }
    return false;
  }

  async function toggleSet(si, rep) {
    const key = setKey(weekNum, dayId, ex, si);
    const current = setData[key]?.done;
    saveSetData(key, 'done', !current);

    if (!current) {
      await hapticsImpact();

      // ── Fix: read from programmeData slice, not flat setData ──
      const activeId = useStore.getState().activeProgrammeId;
      const fresh = useStore.getState().programmeData[activeId]?.setData[key];
      const weight = parseFloat(fresh?.weight) || parseFloat(resolvedEx.defaultWeight) || 0;
      const reps = parseInt(fresh?.reps) || parseInt(rep);

      if (weight && reps) {
        const e1rm = weight * (1 + reps / 30);
        if (!useStore.getState().pbs[resolvedEx.name]) {
          savePB(resolvedEx.name, e1rm);
        } else if (checkPB(resolvedEx.name, weight, reps)) {
          savePBAchieved(`week${weekNum}_${dayId}_${resolvedEx.name}`);
          showToast(`🏆 New PB! ${resolvedEx.name} ${weight}kg × ${reps}`);
        }
      }

      // ── Fix: read weight from programmeData slice ──
      // On an assisted exercise the input holds the ASSIST, so that is what the rest
      // timer must carry forward. Passing the derived load put 47.2 into the box he
      // reads as the machine setting, and the timer then wrote it straight to
      // `weight` without touching `assist` — the two fields drifting apart.
      const freshSet = useStore.getState().programmeData[activeId]?.setData[key];
      const currentSetValue = assisted ? freshSet?.assist : freshSet?.weight;
      const carried = assisted
        ? currentSetValue ||
          lastLoggedValue(days, log, dayId, ex, si + 1, 'assist', weekNum, performedVia) ||
          resolvedEx.defaultAssist ||
          ''
        : currentSetValue ||
          lastLoggedValue(days, log, dayId, ex, si + 1, 'weight', weekNum, performedVia) ||
          resolvedEx.defaultWeight ||
          '';
      onSetTicked(
        resolvedEx.name,
        setKey(weekNum, dayId, ex, si + 1),
        carried,
        ei,
        si,
        resolvedEx.equipment?.length === 0,
        // Rest comes off the RESOLVED exercise: a machine substitute may need a
        // different rest from the free-weight movement it stands in for.
        { compound: resolvedEx.compound, restSeconds: resolvedEx.restSeconds, assisted, bodyweightKg: bw?.kg ?? null },
      );
    } else {
      // ── Fix: read from programmeData slice ──
      const allSetData = useStore.getState().programmeData[useStore.getState().activeProgrammeId]?.setData ?? {};
      let bestE1rm = 0;
      for (let s = 0; s < resolvedEx.sets; s++) {
        if (s === si) continue;
        const k = setKey(weekNum, dayId, ex, s);
        const d = allSetData[k];
        if (!d?.done || !d?.weight || !d?.reps) continue;
        const e1rm = parseFloat(d.weight) * (1 + parseInt(d.reps) / 30);
        if (e1rm > bestE1rm) bestE1rm = e1rm;
      }
      savePB(resolvedEx.name, bestE1rm > 0 ? bestE1rm : null);
      // Drop the trophy too — recomputing the value while leaving the badge means
      // an untick you did to correct a mistake still shows as a PB.
      clearPBAchieved(`week${weekNum}_${dayId}_${resolvedEx.name}`);
      recomputePB(resolvedEx.name);
    }
  }

  // ── Render: one focused exercise ──────────────────────────────────────────
  // The session shows ONE exercise at a time (the strip above it switches). Done
  // sets collapse to a line, the working set gets steppers and a big Log button,
  // pending sets are dashed. Tapping any set makes it the working one, which is
  // how a wrong entry gets corrected.
  const step = incrementFor(resolvedEx) || 2.5;
  const setStates = repsArr.map((rep, si) => ({ rep, si, saved: setData[setKey(weekNum, dayId, ex, si)] || {} }));
  const firstUndone = setStates.find((s) => !s.saved.done)?.si ?? null;
  const activeSi = readOnly ? null : (pickedSi ?? firstUndone);
  const doneCount = setStates.filter((s) => s.saved.done).length;
  const lastSessionLine = (() => {
    const prev = sessionsFor(days, log, dayId, ex)
      .filter((s) => !(s.dayId === dayId && s.week >= weekNum) && (s.via ?? null) === performedVia)
      .pop();
    if (!prev) return null;
    const parts = prev.sets.map((s) => (s.weight ? `${s.reps}@${s.weight}` : `${s.reps}`));
    return { date: prev.date, text: parts.join(' · ') };
  })();
  const repBottom = (rep) => parseInt(String(rep).split('-')[0], 10) || '';

  function shownReps(si, rep, saved) {
    if (saved.reps) return String(saved.reps);
    return String(lastLoggedValue(days, log, dayId, ex, si, 'reps', weekNum, performedVia) || repBottom(rep) || '');
  }
  function shownLoad(si, saved) {
    if (assisted) {
      return String(
        saved.assist ||
          lastLoggedValue(days, log, dayId, ex, si, 'assist', weekNum, performedVia) ||
          resolvedEx.defaultAssist ||
          '',
      );
    }
    return String(
      saved.weight ||
        lastLoggedValue(days, log, dayId, ex, si, 'weight', weekNum, performedVia) ||
        resolvedEx.defaultWeight ||
        '',
    );
  }
  function nudge(si, field, delta, current) {
    const k = setKey(weekNum, dayId, ex, si);
    const base = parseFloat(current) || 0;
    const next = Math.max(0, tidy(base + delta));
    if (field === 'reps') saveSetData(k, 'reps', String(Math.round(next)));
    else if (assisted) saveAssist(k, String(next));
    else saveSetData(k, 'weight', String(next));
  }
  // Log = commit what is shown (pre-fills included, so the log is never blank), then tick.
  function logSet(si, rep, saved) {
    const k = setKey(weekNum, dayId, ex, si);
    const r = shownReps(si, rep, saved);
    const l = shownLoad(si, saved);
    if (!saved.reps && r) saveSetData(k, 'reps', r);
    if (assisted) {
      if (!saved.assist && l) saveAssist(k, l);
    } else if (!saved.weight && l) saveSetData(k, 'weight', l);
    setPickedSi(null);
    toggleSet(si, rep);
  }

  const swapBtn =
    slotAlt && onSlotSwap ? (
      <button
        className={`icon-btn${slotAltSets > 0 ? ' active' : ''}`}
        style={{ width: 36, height: 36, borderRadius: 10 }}
        onClick={() => onSlotSwap(slotAlt)}
        aria-label={'Switch to ' + slotAlt.name}
      >
        <Icon name="swap" size={16} />
      </button>
    ) : (
      isBarbbellDumbbellPair(ex) &&
      onSwap && (
        <button
          className={`icon-btn${swapped ? ' active' : ''}`}
          style={{ width: 36, height: 36, borderRadius: 10 }}
          onClick={() => onSwap(ei)}
          aria-label={swapped ? 'Switch back to ' + ex.name : 'Switch to ' + ex.alternative?.name}
        >
          <Icon name="swap" size={16} />
        </button>
      )
    );

  return (
    <div className="card card-lg stack stack-12" style={{ padding: 18 }}>
      {detailOpen && <ExerciseDetailSheet ex={resolvedEx} onClose={() => setDetailOpen(false)} />}

      <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div className="grow stack stack-4">
          <div
            className="display display-md"
            style={{ color: resolvedEx.status === 'unavailable' ? 'var(--muted)' : undefined }}
          >
            {resolvedEx.name}
            {resolvedEx.superset ? ` + ${resolvedEx.superset.name}` : ''}
          </div>
          <div className="meta" style={{ fontWeight: 500 }}>
            {resolvedEx.status === 'unavailable'
              ? 'No alternative available for your equipment'
              : `${resolvedEx.sets} × ${String(resolvedEx.reps).split('/')[0]}${resolvedEx.superset ? ' → ' + resolvedEx.superset.reps : ''}${resolvedEx.note ? ' · ' + resolvedEx.note : ''}`}
            {resolvedEx.status === 'alternative' && (
              <span style={{ color: 'var(--accent)' }}> · substituted for {ex.name}</span>
            )}
            {resolvedEx.status === 'swapped' && (
              <span style={{ color: 'var(--accent)' }}> · swapped from {ex.name}</span>
            )}
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {hasPB && (
              <span className="pill accent" style={{ padding: '3px 8px', fontSize: 11 }}>
                <Icon name="trophy" size={12} strokeWidth={2.5} /> PB
              </span>
            )}
            {held && (
              <span className="pill" style={{ padding: '3px 8px', fontSize: 11, color: 'var(--accent2)' }}>
                <Icon name="pause" size={12} /> held since {held.since?.slice(5) ?? ''}
              </span>
            )}
            {slotAltSets > 0 && (
              <span className="pill accent-soft" style={{ padding: '3px 8px', fontSize: 11 }}>
                {slotAlt.name} has {slotAltSets} set{slotAltSets === 1 ? '' : 's'} logged today
              </span>
            )}
          </div>
        </div>
        <div className="row" style={{ gap: 6, flexShrink: 0 }}>
          {swapBtn}
          <button
            className="icon-btn"
            style={{ width: 36, height: 36, borderRadius: 10 }}
            onClick={() => setDetailOpen(true)}
            aria-label="Exercise info"
          >
            <Icon name="info" size={16} />
          </button>
        </div>
      </div>

      {resolvedEx.status !== 'unavailable' && (
        <div className="grid-2">
          <div className="tile-inset stack stack-4">
            <span className="eyebrow" style={{ fontSize: 10 }}>
              Target
            </span>
            <span className="num" style={{ fontSize: 18 }}>
              {(() => {
                const lastW = lastUsedBestWeight(days, log, dayId, ex, weekNum, performedVia);
                return lastW
                  ? `${lastW} kg`
                  : resolvedEx.defaultWeight
                    ? `${resolvedEx.defaultWeight} kg`
                    : 'bodyweight';
              })()}
            </span>
          </div>
          <div className="tile-inset stack stack-4">
            <span className="eyebrow" style={{ fontSize: 10 }}>
              {lastSessionLine
                ? `Last time · ${lastSessionLine.date.slice(8, 10)}/${lastSessionLine.date.slice(5, 7)}`
                : 'Last time'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
              {lastSessionLine ? lastSessionLine.text : 'first session'}
            </span>
          </div>
        </div>
      )}

      {suggestion && !readOnly && (
        <div
          className="row"
          style={{ gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--accent)' }}
        >
          <div className="grow stack stack-4">
            <span className="eyebrow accent" style={{ fontSize: 10 }}>
              Suggested increase
            </span>
            <span style={{ fontSize: 13 }}>
              {suggestion.label}
              {suggestion.effective ? ` · ${suggestion.effective} kg effective` : ''}
            </span>
            <span className="meta" style={{ fontSize: 11, lineHeight: 1.4 }}>
              {suggestion.note}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" style={{ fontSize: 12 }} onClick={applySuggestion}>
            Use
          </button>
        </div>
      )}

      {resolvedEx.status !== 'unavailable' && (
        <div className="stack stack-8">
          {setStates.map(({ rep, si, saved }) => {
            const isActive = activeSi === si;
            const key = setKey(weekNum, dayId, ex, si);
            if (isActive) {
              const r = shownReps(si, rep, saved);
              const l = shownLoad(si, saved);
              return (
                <div
                  key={si}
                  className="stack stack-10"
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    background: 'var(--bg)',
                    border: '1px solid var(--accent)',
                  }}
                >
                  <div className="row-between">
                    <span className="eyebrow accent" style={{ fontSize: 11 }}>
                      Set {si + 1} · {saved.done ? 'logged' : 'working'}
                    </span>
                    <span className="meta">{rep === 'Failure' ? 'to failure' : `${rep} reps`}</span>
                  </div>
                  <div className="grid-2" style={{ gap: 10 }}>
                    <div className="stack stack-4">
                      <label className="eyebrow" style={{ fontSize: 10 }} htmlFor={`reps-${key}`}>
                        Reps
                      </label>
                      <div className={`stepper${isRepsSuspect(saved.reps) ? ' suspect' : ''}`}>
                        <button onClick={() => nudge(si, 'reps', -1, r)} aria-label="Fewer reps">
                          −
                        </button>
                        <input
                          id={`reps-${key}`}
                          type="number"
                          inputMode="numeric"
                          value={saved.reps || ''}
                          placeholder={r}
                          onChange={(e) => saveSetData(key, 'reps', e.target.value)}
                        />
                        <button onClick={() => nudge(si, 'reps', 1, r)} aria-label="More reps">
                          +
                        </button>
                      </div>
                    </div>
                    <div className="stack stack-4">
                      <label className="eyebrow" style={{ fontSize: 10 }} htmlFor={`load-${key}`}>
                        {assisted ? 'Assist kg' : 'Kg'}
                      </label>
                      <div className={`stepper${isWeightSuspect(saved.weight, resolvedEx) ? ' suspect' : ''}`}>
                        <button onClick={() => nudge(si, 'load', -step, l)} aria-label="Less weight">
                          −
                        </button>
                        <input
                          id={`load-${key}`}
                          type="number"
                          inputMode="decimal"
                          value={(assisted ? saved.assist : saved.weight) || ''}
                          placeholder={l}
                          onChange={(e) =>
                            assisted ? saveAssist(key, e.target.value) : saveSetData(key, 'weight', e.target.value)
                          }
                        />
                        <button onClick={() => nudge(si, 'load', step, l)} aria-label="More weight">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  {assisted && saved.assist && (
                    <span className="meta" style={{ fontSize: 11 }}>
                      {saved.weight ? (
                        <span style={{ color: bw?.stale ? 'var(--down)' : undefined }}>
                          = {saved.weight} kg effective{bw?.stale ? ' · weigh-in is old' : ''}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--down)' }}>log a bodyweight</span>
                      )}
                    </span>
                  )}
                  {(isRepsSuspect(saved.reps) || isWeightSuspect(saved.weight, resolvedEx)) && (
                    <span className="meta" style={{ color: 'var(--down)', fontSize: 11 }}>
                      Check that number
                    </span>
                  )}
                  {saved.done ? (
                    <button className="btn btn-ghost btn-block" onClick={() => toggleSet(si, rep)}>
                      <Icon name="x" size={14} /> Unlog set {si + 1}
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-block" onClick={() => logSet(si, rep, saved)}>
                      Log set {si + 1}
                      <Icon name="check" size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>
              );
            }
            if (saved.done) {
              return (
                <button
                  key={si}
                  className="row"
                  onClick={() => !readOnly && setPickedSi(si)}
                  style={{
                    gap: 12,
                    minHeight: 52,
                    padding: '0 12px',
                    borderRadius: 12,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span className="check-dot done">
                    <Icon name="check" size={12} strokeWidth={3.5} />
                  </span>
                  <span className="meta" style={{ fontWeight: 700, width: 44 }}>
                    SET {si + 1}
                  </span>
                  <span className="grow num" style={{ fontSize: 18 }}>
                    {saved.reps || '—'}{' '}
                    <span className="meta" style={{ fontWeight: 500 }}>
                      reps
                    </span>
                    {(assisted ? saved.assist : saved.weight) ? (
                      <>
                        &nbsp;·&nbsp;{assisted ? saved.assist : saved.weight}{' '}
                        <span className="meta" style={{ fontWeight: 500 }}>
                          {assisted ? 'assist' : 'kg'}
                        </span>
                      </>
                    ) : null}
                  </span>
                  {saved.via && (
                    <span className="meta" style={{ fontSize: 10 }}>
                      {saved.via}
                    </span>
                  )}
                </button>
              );
            }
            return (
              <button
                key={si}
                className="row"
                onClick={() => !readOnly && setPickedSi(si)}
                style={{
                  gap: 12,
                  minHeight: 48,
                  padding: '0 12px',
                  borderRadius: 12,
                  background: 'var(--surface)',
                  border: '1px dashed var(--border)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span className="check-dot" />
                <span className="meta" style={{ fontWeight: 700, width: 44 }}>
                  SET {si + 1}
                </span>
                <span className="grow meta" style={{ fontSize: 13 }}>
                  {rep === 'Failure' ? 'to failure' : `${rep} reps`}
                  {shownLoad(si, saved) ? ` · ${shownLoad(si, saved)} ${assisted ? 'assist' : 'kg'}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="row" style={{ gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <button
          className={`btn btn-ghost btn-sm grow${exerciseNotes[exerciseNoteKey(weekNum, dayId, ex)] ? ' btn-outline-accent' : ''}`}
          onClick={() => setNoteOpen((o) => !o)}
        >
          <Icon name="note" size={14} /> {exerciseNotes[exerciseNoteKey(weekNum, dayId, ex)] ? 'Note' : 'Add note'}
        </button>
        {!readOnly && (
          <button
            className={`btn btn-ghost btn-sm grow${held ? ' btn-outline-accent' : ''}`}
            onClick={() => toggleHeldExercise(holdKey(dayId, ex))}
          >
            <Icon name="pause" size={14} /> {held ? 'Resume increases' : 'Hold weight'}
          </button>
        )}
      </div>
      {held && (
        <span className="meta" style={{ fontSize: 11, lineHeight: 1.5 }}>
          Weight suggestions are paused for this exercise. Reps and loads are still logged and graphed.
        </span>
      )}
      {noteOpen && (
        <div className="stack stack-8">
          {weekNum > 1 && exerciseNotes[exerciseNoteKey(weekNum - 1, dayId, ex)] && (
            <div className="tile-inset meta" style={{ lineHeight: 1.5 }}>
              <span className="eyebrow" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>
                Last week
              </span>
              {exerciseNotes[exerciseNoteKey(weekNum - 1, dayId, ex)]}
            </div>
          )}
          <textarea
            className="input"
            value={exerciseNotes[exerciseNoteKey(weekNum, dayId, ex)] || ''}
            onChange={(e) => saveExerciseNote(exerciseNoteKey(weekNum, dayId, ex), e.target.value)}
            placeholder="Add a note for this exercise…"
            rows={3}
          />
        </div>
      )}
      <div style={{ display: 'none' }}>{doneCount}</div>
    </div>
  );
}

export default function DayDetail({ dayId, onBack }) {
  const completedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.completedDays ?? EMPTY);
  const weekNum = useStore((s) => s.currentWeek);
  const skippedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.skippedDays ?? EMPTY);
  const notes = useStore((s) => s.programmeData[s.activeProgrammeId]?.notes ?? EMPTY);
  const workoutDates = useStore((s) => s.programmeData[s.activeProgrammeId]?.workoutDates ?? EMPTY);
  const sessionTimes = useStore((s) => s.programmeData[s.activeProgrammeId]?.sessionTimes ?? EMPTY);
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const saveCompletedDay = useStore((s) => s.saveCompletedDay);
  const removeCompletedDay = useStore((s) => s.removeCompletedDay);
  const saveSkippedDay = useStore((s) => s.saveSkippedDay);
  const removeSkippedDay = useStore((s) => s.removeSkippedDay);
  const saveWorkoutDate = useStore((s) => s.saveWorkoutDate);
  const saveSessionTime = useStore((s) => s.saveSessionTime);
  const setLastSetLoggedAt = useStore((s) => s.setLastSetLoggedAt);
  const restDurationOverride = useStore((s) => s.restDurationOverride);
  const saveSetData = useStore((s) => s.saveSetData);
  const lastSetLoggedAt = useStore((s) => s.lastSetLoggedAt);
  const setData = useStore((s) => s.programmeData[s.activeProgrammeId]?.setData ?? EMPTY);
  const slotChoices = useStore((s) => s.programmeData[s.activeProgrammeId]?.slotChoices ?? EMPTY);
  const setSlotChoice = useStore((s) => s.setSlotChoice);
  const equipment = useStore((s) => s.equipment);

  // ── Session persistence — survives back navigation ──
  const activeSessionStart = useStore((s) => s.activeSessionStart);
  const setActiveSessionStart = useStore((s) => s.setActiveSessionStart);
  const clearActiveSessionStart = useStore((s) => s.clearActiveSessionStart);

  const showToast = useToast();
  const [showRecap, setShowRecap] = useState(false);
  const [pendingRankUps, setPendingRankUps] = useState([]);
  const [rankUpIdx, setRankUpIdx] = useState(0);
  // The recap for a session finished earlier — opened from the bottom bar to share it.
  const [showPastRecap, setShowPastRecap] = useState(false);
  // Manual swaps live in the store, per session, so they survive leaving the
  // screen and are still known when the session is scored later.
  const sessionSwaps = useStore((s) => s.programmeData[s.activeProgrammeId]?.sessionSwaps ?? EMPTY);
  const toggleSessionSwap = useStore((s) => s.toggleSessionSwap);

  function handleSwap(ei) {
    const target = activeExs[ei];
    if (target) toggleSessionSwap(swapKey(weekNum, dayId, target));
  }
  const [restTimer, setRestTimer] = useState(null);
  const [prevNoteOpen, setPrevNoteOpen] = useState(false);
  // A completed day is read-only so a stray tap cannot rewrite finished data, but it
  // still has to be CORRECTABLE — a weight typed wrong, or a load changed mid-session
  // that the pre-fill kept at the old value. Before this, the only way in was UNDO
  // COMPLETE, which silently overwrote the workout date and session time on the way
  // back out. Editing in place touches neither.
  const [editing, setEditing] = useState(false);
  const [sessionDisplay, setSessionDisplay] = useState('0:00');

  const workoutNotifIdRef = useRef(null);

  const day = PROGRAMMES[activeProgrammeId]?.days.find((d) => d.id === dayId);

  // The day list renders one tile per SLOT, not per programme entry. The two leg
  // presses are one movement done on whichever machine is free; showing both as
  // separate cards made Legs read as seven things to do when it is six. They stay
  // separate exercises underneath — that is what keeps their histories apart —
  // and `activeExs` is what the day actually asks for: one exercise per tile.
  const tiles = React.useMemo(() => dayTiles(day), [day]);
  const activeExs = React.useMemo(
    () => tiles.map((t) => pickOption(t, { weekNum, dayId, setData, slotChoices, equipment })),
    [tiles, weekNum, dayId, setData, slotChoices, equipment],
  );

  // Which exercise the card shows. Starts on the first one with a set still to
  // log; the strip and "Skip exercise" move it; finishing an exercise's last set
  // advances it once the rest timer closes.
  const setsTotal = activeExs.reduce((a, ex) => a + (ex.sets ?? 0), 0);
  const setsDone = activeExs.reduce((a, ex) => {
    let n = 0;
    for (let si = 0; si < ex.sets; si++) if (setData[setKey(weekNum, dayId, ex, si)]?.done) n++;
    return a + n;
  }, 0);
  const exerciseDone = (ex) => {
    for (let si = 0; si < ex.sets; si++) if (!setData[setKey(weekNum, dayId, ex, si)]?.done) return false;
    return ex.sets > 0;
  };
  const [focusIdx, setFocusIdx] = useState(() => {
    const i = activeExs.findIndex((ex) => !exerciseDone(ex));
    return i < 0 ? 0 : i;
  });
  const stripRef = useRef(null);
  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-strip-index="${focusIdx}"]`);
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    document.body.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [focusIdx]);

  function handleSlotSwap(tile, option) {
    if (!tile.slot) return;
    setSlotChoice(slotChoiceKey(weekNum, dayId, tile.slot), exerciseKeyPart(option));
  }

  const key = dayKey(weekNum, dayId);
  const isDone = !!completedDays[key];
  const isSkipped = skippedDays?.[key];

  // ── On mount: start session timer only if not already running ──
  useEffect(() => {
    if (!activeSessionStart) {
      setActiveSessionStart(Date.now());
    }
  }, []);

  // ── Session display timer ──
  useEffect(() => {
    const interval = setInterval(() => {
      const start = activeSessionStart ?? Date.now();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = String(elapsed % 60).padStart(2, '0');
      setSessionDisplay(hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}:${secs}` : `${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessionStart]);

  useEffect(() => {
    if (!lastSetLoggedAt) return;
    if (workoutNotifIdRef.current !== null) {
      cancelLocalNotification(workoutNotifIdRef.current);
      workoutNotifIdRef.current = null;
    }
    if (document.visibilityState !== 'hidden') return;
    const schedule = async () => {
      const elapsed = Date.now() - lastSetLoggedAt;
      const delay = Math.max(1, THIRTY_MINS - elapsed);
      const id = (Date.now() + 1) % 2147483647;
      workoutNotifIdRef.current = id;
      await scheduleLocalNotification({
        id,
        title: 'Still working out? 🏋️',
        body: 'Your FitTrack session is still running.',
        delaySeconds: Math.floor(delay / 1000),
      });
    };
    schedule();
  }, [lastSetLoggedAt]);

  useEffect(() => {
    async function handleVisibility() {
      if (!lastSetLoggedAt) return;
      if (document.visibilityState === 'hidden') {
        if (workoutNotifIdRef.current !== null) {
          await cancelLocalNotification(workoutNotifIdRef.current);
          workoutNotifIdRef.current = null;
        }
        const elapsed = Date.now() - lastSetLoggedAt;
        const delay = Math.max(1, THIRTY_MINS - elapsed);
        const id = (Date.now() + 2) % 2147483647;
        workoutNotifIdRef.current = id;
        await scheduleLocalNotification({
          id,
          title: 'Still working out? 🏋️',
          body: 'Your FitTrack session is still running.',
          delaySeconds: Math.floor(delay / 1000),
        });
      } else if (document.visibilityState === 'visible' && workoutNotifIdRef.current !== null) {
        await cancelLocalNotification(workoutNotifIdRef.current);
        workoutNotifIdRef.current = null;
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [lastSetLoggedAt]);

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleSetTicked(exerciseName, nextKey, prevWeight, ei, si, isBodyweight = false, rest = {}) {
    setLastSetLoggedAt(Date.now());
    const { compound, restSeconds, assisted, bodyweightKg } = rest;
    const lastExIdx = activeExs.length - 1;
    const isLastSet = ei === lastExIdx && si === activeExs[lastExIdx].sets - 1;
    if (!isLastSet) {
      const duration = getRestDuration(exerciseName, restDurationOverride, compound, restSeconds);
      const currentEx = activeExs[ei];
      const isLastSetOfExercise = si === currentEx.sets - 1;
      let nextSetInfo;
      if (isLastSetOfExercise) {
        const nextEx = activeExs[ei + 1];
        nextSetInfo = nextEx ? { type: 'exercise', name: nextEx.name } : null;
      } else {
        const repsArr = currentEx.reps.split('/');
        const nextRepTarget = repsArr[si + 1] || repsArr[repsArr.length - 1];
        nextSetInfo = { type: 'set', setNum: si + 2, reps: nextRepTarget, totalSets: currentEx.sets };
      }
      setRestTimer({
        exerciseName,
        duration,
        nextSetKey: nextKey,
        nextSetWeight: prevWeight,
        isLastSet: isLastSetOfExercise,
        nextSetInfo,
        exerciseIdx: ei,
        // The exercise object, not just its index: a slot swap during the rest
        // would otherwise redirect the carried weight onto the other machine.
        exercise: currentEx,
        setIdx: si,
        isBodyweight,
        isCompound: !!compound,
        assisted: !!assisted,
        bodyweightKg,
      });
    }
  }

  // What the rest timer types goes back where it came from. On an assisted exercise
  // that box holds the ASSIST, so it must be stored as `assist` with `weight` derived
  // — writing it straight to `weight` left the two fields describing different lifts.
  function advanceFocus(fromIdx) {
    const next = activeExs.findIndex((ex, i) => i > (fromIdx ?? focusIdx) && !exerciseDone(ex));
    if (next >= 0) setFocusIdx(next);
  }

  function writeCarriedValue(setKeyStr, value) {
    if (restTimer?.assisted) {
      saveSetData(setKeyStr, 'assist', value);
      const eff = effectiveFromAssist(restTimer.bodyweightKg, value);
      saveSetData(setKeyStr, 'weight', eff === null ? '' : String(eff));
      return;
    }
    saveSetData(setKeyStr, 'weight', value);
  }

  function handleComplete() {
    if (isDone) {
      removeCompletedDay(key);
      clearActiveSessionStart();
      onBack(true);
      return;
    }
    const start = activeSessionStart ?? Date.now();
    const now = Date.now();
    // The clock runs until the button is pressed, and he does not always press it
    // when the lifting stops: 31 Aug recorded 103 minutes and 7 Sep 118, both with
    // a treadmill and the walk home still on it — "I forgot to complete it". A
    // duration that counts everything after the last set is not a session length,
    // and SessionLoadScreen compares those numbers between sessions.
    //
    // So the session ends at the last logged set whenever the button is well
    // behind it. The HR window follows the same end, which also keeps the cardio
    // out of a lifting session's average.
    const lastSet = lastSetLoggedAt && lastSetLoggedAt > start ? lastSetLoggedAt : null;
    const trimmed = lastSet != null && now - lastSet > LAST_SET_GRACE;
    const end = trimmed ? lastSet : now;
    // Re-completing a day that already has a date and a duration must not overwrite
    // them. Undo-then-redo used to stamp today's date on a session from days ago and
    // replace a 71-minute workout with however long the screen had been open.
    const existingDate = workoutDates?.[key];
    const existingMins = sessionTimes?.[key];
    const mins = existingMins != null ? existingMins : Math.round((end - start) / 60000);
    // Rank board BEFORE this session counts (its date removed so sessionsFor skips
    // it), then again after — the difference is the rank-up screens.
    const st0 = useStore.getState();
    const days0 = PROGRAMMES[st0.activeProgrammeId]?.days ?? [];
    const bw0 = bodyweightAt(st0.weightLog, todayStr())?.kg ?? null;
    const slice0 = st0.programmeData[st0.activeProgrammeId];
    const before = rankBoard(days0, { ...slice0, workoutDates: { ...slice0?.workoutDates, [key]: undefined } }, bw0);
    saveCompletedDay(key);
    saveWorkoutDate(key, existingDate ?? todayStr());
    saveSessionTime(key, mins);
    const st1 = useStore.getState();
    const after = rankBoard(days0, st1.programmeData[st1.activeProgrammeId], bw0);
    const ups = diffRanks(before, after).filter((u) => u.kind === 'muscle' || u.kind === 'overall');
    setPendingRankUps(ups);
    setRankUpIdx(0);
    // Say so rather than quietly recording a different number than the one that was
    // on screen a second ago.
    if (trimmed && existingMins == null) showToast(`${mins} min — timed to your last set, not the button`);
    // Record the session window for the Health Connect sweep — first completion
    // only, so re-completing a day cannot overwrite the real window with a stub.
    // Fire-and-forget: heart rate arriving or not must never hold up the summary.
    if (!existingDate) captureSessionWindow(key, start, end);
    setShowRecap(true);
    clearActiveSessionStart();
    if (workoutNotifIdRef.current !== null) {
      cancelLocalNotification(workoutNotifIdRef.current);
      workoutNotifIdRef.current = null;
    }
    setLastSetLoggedAt(null);
  }

  function handleSkip() {
    if (isDone) return;
    if (isSkipped) {
      removeSkippedDay(key);
      clearActiveSessionStart();
      onBack(true);
      return;
    }
    const reason = prompt('Reason for skipping?\n\n1. Rest day\n2. Illness\n3. No time\n4. Other');
    if (!reason) return;
    const reasons = ['Rest day', 'Illness', 'No time', 'Other'];
    const reasonText = reasons[parseInt(reason) - 1] || 'Other';
    saveSkippedDay(key, reasonText);
    saveWorkoutDate(key, todayStr());
    clearActiveSessionStart();
    onBack();
  }

  return (
    <div className="session">
      {showRecap && pendingRankUps[rankUpIdx] && (
        <RankUpScreen
          up={pendingRankUps[rankUpIdx]}
          index={rankUpIdx}
          total={pendingRankUps.length}
          onContinue={() => setRankUpIdx((i) => i + 1)}
        />
      )}
      {showPastRecap && <RecapScreen dayId={dayId} weekNum={weekNum} past onDismiss={() => setShowPastRecap(false)} />}
      {showRecap && !pendingRankUps[rankUpIdx] && (
        <RecapScreen
          dayId={dayId}
          weekNum={weekNum}
          rankUps={pendingRankUps}
          onDismiss={() => {
            setShowRecap(false);
            onBack(true);
          }}
        />
      )}

      {restTimer && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 110 }} onTouchMove={(e) => e.preventDefault()} />
          <RestTimer
            exerciseName={restTimer.exerciseName}
            duration={restTimer.duration}
            nextSetKey={restTimer.nextSetKey}
            nextSetWeight={restTimer.nextSetWeight}
            isLastSet={restTimer.isLastSet}
            nextSetInfo={restTimer.nextSetInfo}
            isBodyweight={restTimer.isBodyweight}
            isCompound={restTimer.isCompound}
            onComplete={(value) => {
              if (value && restTimer.nextSetKey) {
                const ex = restTimer.exercise ?? activeExs[restTimer.exerciseIdx];
                for (let s = restTimer.setIdx + 1; s < ex.sets; s++) {
                  writeCarriedValue(setKey(weekNum, dayId, ex, s), value);
                }
              }
              if (restTimer.isLastSet) advanceFocus(restTimer.exerciseIdx);
              setRestTimer(null);
            }}
            onSkip={(value) => {
              if (value && restTimer.nextSetKey) writeCarriedValue(restTimer.nextSetKey, value);
              if (restTimer.isLastSet) advanceFocus(restTimer.exerciseIdx);
              setRestTimer(null);
            }}
          />
        </>
      )}
      {/* ── Sticky header: day, position in the session, timer ── */}
      <div className="session-header">
        <button className="icon-btn" onClick={() => onBack()} aria-label="Back to today">
          <Icon name="arrowLeft" size={18} />
        </button>
        <div className="stack" style={{ alignItems: 'center', gap: 2 }}>
          <span className="display" style={{ fontSize: 18, fontVariationSettings: "'wdth' 75" }}>
            {day.focus}
          </span>
          <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
            Exercise {Math.min(focusIdx + 1, activeExs.length)} of {activeExs.length} · Set{' '}
            {Math.min(setsDone + 1, setsTotal)} of {setsTotal}
          </span>
        </div>
        <span
          className="num"
          style={{ fontSize: 20, minWidth: 64, textAlign: 'right', color: isDone ? 'var(--muted)' : undefined }}
        >
          {isDone ? (sessionTimes[key] != null ? `${sessionTimes[key]}m` : '') : sessionDisplay}
        </span>
      </div>

      {/* ── Exercise strip ── */}
      <div className="strip" ref={stripRef}>
        {activeExs.map((ex, i) => {
          const done = exerciseDone(ex);
          const cls = i === focusIdx ? 'strip-pill current' : done ? 'strip-pill done' : 'strip-pill';
          return (
            <button key={exerciseKeyPart(ex)} className={cls} onClick={() => setFocusIdx(i)} data-strip-index={i}>
              {done && <Icon name="check" size={12} strokeWidth={3.5} />}
              {shortName(ex.name)}
            </button>
          );
        })}
      </div>

      {weekNum > 1 && notes[dayKey(weekNum - 1, dayId)] && (
        <button
          className="card row"
          onClick={() => setPrevNoteOpen((o) => !o)}
          style={{ gap: 12, padding: '12px 16px', textAlign: 'left', width: '100%' }}
        >
          <div className="grow">
            <div className="eyebrow" style={{ fontSize: 10 }}>
              Last week's note
            </div>
            <div className="meta-2" style={{ marginTop: 2, lineHeight: 1.4 }}>
              {prevNoteOpen ? notes[dayKey(weekNum - 1, dayId)] : truncate(notes[dayKey(weekNum - 1, dayId)], 90)}
            </div>
          </div>
          <Icon name={prevNoteOpen ? 'chevronDown' : 'chevronRight'} size={16} style={{ color: 'var(--muted)' }} />
        </button>
      )}

      {tiles[focusIdx] && (
        <ExerciseCard
          key={tiles[focusIdx].slot ?? exerciseKeyPart(tiles[focusIdx].options[0])}
          ex={activeExs[focusIdx]}
          ei={focusIdx}
          dayId={dayId}
          weekNum={weekNum}
          onSetTicked={handleSetTicked}
          swapped={!!sessionSwaps[swapKey(weekNum, dayId, activeExs[focusIdx])]}
          onSwap={handleSwap}
          slotOptions={tiles[focusIdx].options}
          onSlotSwap={(option) => handleSlotSwap(tiles[focusIdx], option)}
          readOnly={isDone && !editing}
        />
      )}

      {activeExs[focusIdx + 1] && (
        <button
          className="card row"
          onClick={() => setFocusIdx(focusIdx + 1)}
          style={{ gap: 12, padding: '14px 16px', textAlign: 'left', width: '100%' }}
        >
          <div className="grow">
            <div className="eyebrow" style={{ fontSize: 10 }}>
              Up next
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>
              {activeExs[focusIdx + 1].name} · {activeExs[focusIdx + 1].sets} ×{' '}
              {String(activeExs[focusIdx + 1].reps).split('/')[0]}
            </div>
          </div>
          <Icon name="chevronRight" size={16} style={{ color: 'var(--muted)' }} />
        </button>
      )}

      {/* ── Bottom bar ── */}
      <div className="session-bar">
        {isDone ? (
          <>
            <button
              className={`btn grow${editing ? ' btn-primary' : ' btn-outline-accent'}`}
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? 'Finish editing' : 'Edit session'}
            </button>
            <button className="btn btn-ghost grow" onClick={handleComplete}>
              Undo complete
            </button>
            {!editing && (
              <button
                className="icon-btn"
                style={{ width: 48, height: 48, color: 'var(--accent)', borderColor: 'var(--accent)' }}
                onClick={() => setShowPastRecap(true)}
                aria-label="Recap and share this session"
              >
                <Icon name="share" size={18} />
              </button>
            )}
          </>
        ) : (
          <>
            {activeExs[focusIdx + 1] ? (
              <button className="btn btn-ghost grow" onClick={() => setFocusIdx(focusIdx + 1)}>
                Skip exercise
              </button>
            ) : (
              <button className={`btn btn-ghost grow${isSkipped ? ' btn-outline-accent' : ''}`} onClick={handleSkip}>
                {isSkipped ? 'Unskip day' : 'Skip day'}
              </button>
            )}
            <button className="btn btn-primary" style={{ flexGrow: 2, fontSize: 16 }} onClick={handleComplete}>
              Finish session
            </button>
          </>
        )}
      </div>
    </div>
  );
}
