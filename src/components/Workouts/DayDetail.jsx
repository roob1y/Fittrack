import React, { useEffect, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import CelebrationScreen from './CelebrationScreen';
import WorkoutSummaryScreen from './WorkoutSummaryScreen';
import RestTimer, { getRestDuration } from './RestTimer';
import { hapticsImpact } from '../../hooks/useHaptics';
import ExerciseDetailSheet from './ExerciseDetailSheet';
import { scheduleLocalNotification, cancelLocalNotification } from '../../plugins/localNotifications';
import { setKey, exerciseNoteKey, dayKey, holdKey, exerciseKeyPart } from '../../utils/setKeys';
import { dayTiles, pickOption, slotChoiceKey, loggedSetCount } from '../../utils/slots';
import { lastLoggedValue, lastUsedBestWeight } from '../../utils/history';
import { captureSessionWindow } from '../../utils/healthSync';
import { isAssisted, bodyweightAt, effectiveFromAssist } from '../../utils/loads';
import { sessionsFor } from '../../utils/progressStats';
import { nextTarget, tidy } from '../../utils/increments';
import { EMPTY } from '../../store/shape';

const THIRTY_MINS = 30 * 60 * 1000;
// How far behind MARK DAY COMPLETE the last logged set may sit before the session
// is timed to the set instead of to the button. His rests run to 150s, so ten
// minutes of nothing means the lifting has stopped.
const LAST_SET_GRACE = 10 * 60 * 1000;

const todayISO = () => new Date().toISOString().slice(0, 10);

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
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
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
    const history = sessionsFor(days, log, dayId, ex).filter((s) => !(s.dayId === dayId && s.week >= weekNum));
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
  }, [setData, workoutDates, dayId, ex, weekNum, resolvedEx, assisted, bw?.kg, held]);

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
          lastLoggedValue(days, log, dayId, ex, si + 1, 'assist', weekNum) ||
          resolvedEx.defaultAssist ||
          ''
        : currentSetValue ||
          lastLoggedValue(days, log, dayId, ex, si + 1, 'weight', weekNum) ||
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

  return (
    <div className="exercise-card">
      {detailOpen && <ExerciseDetailSheet ex={resolvedEx} onClose={() => setDetailOpen(false)} />}{' '}
      <div className="exercise-header" onClick={() => setOpen((o) => !o)}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--muted)',
                flexShrink: 0,
              }}
            >
              {ei + 1}
            </div>
            <div
              className="exercise-name"
              style={{ color: resolvedEx.status === 'unavailable' ? 'var(--muted)' : 'var(--text)' }}
            >
              {resolvedEx.name}
              {resolvedEx.superset ? ` + ${resolvedEx.superset.name}` : ''}
              {resolvedEx.status === 'alternative' && (
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400, marginLeft: '6px' }}>
                  (sub for {ex.name})
                </span>
              )}
              {hasPB && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0d0d0f',
                    background: '#ffd700',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    marginLeft: '8px',
                    verticalAlign: 'middle',
                  }}
                >
                  🏆 PB
                </span>
              )}
            </div>
          </div>
          <div className="exercise-meta">
            {resolvedEx.status === 'unavailable'
              ? '⚠ No alternative available for your equipment'
              : `${resolvedEx.sets} sets · ${resolvedEx.reps}${resolvedEx.superset ? ' → ' + resolvedEx.superset.reps : ''}${resolvedEx.note ? ' · ' + resolvedEx.note : ''}`}
            {resolvedEx.status === 'alternative' && <span style={{ color: 'var(--accent)' }}> · Substituted</span>}
            {resolvedEx.status === 'swapped' && <span style={{ color: 'var(--accent)' }}> · Swapped</span>}
            {resolvedEx.status !== 'unavailable' &&
              (() => {
                const lastW = lastUsedBestWeight(days, log, dayId, ex, weekNum);
                if (!lastW) return null;
                return (
                  <span style={{ marginLeft: '6px', color: 'var(--accent)', fontWeight: 600, opacity: 0.8 }}>
                    · {lastW}kg last used
                  </span>
                );
              })()}
            {slotAltSets > 0 && (
              <span style={{ display: 'block', marginTop: '3px', color: 'var(--accent)', fontWeight: 600 }}>
                ⇄ {slotAlt.name} also has {slotAltSets} set{slotAltSets === 1 ? '' : 's'} logged today
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {slotAlt && onSlotSwap ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSlotSwap(slotAlt);
              }}
              title={'Switch to ' + slotAlt.name}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid ' + (slotAltSets > 0 ? 'var(--accent)' : 'var(--border)'),
                background: slotAltSets > 0 ? 'rgba(200,241,53,0.15)' : 'var(--surface)',
                color: slotAltSets > 0 ? 'var(--accent)' : 'var(--muted)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ⇄
            </button>
          ) : (
            isBarbbellDumbbellPair(ex) &&
            onSwap && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSwap(ei);
                }}
                title={swapped ? 'Switch back to ' + ex.name : 'Switch to ' + ex.alternative?.name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid ' + (swapped ? 'var(--accent)' : 'var(--border)'),
                  background: swapped ? 'rgba(200,241,53,0.15)' : 'var(--surface)',
                  color: swapped ? 'var(--accent)' : 'var(--muted)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                ⇄
              </button>
            )
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailOpen(true);
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--muted)',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: 'Georgia, serif',
            }}
          >
            i
          </button>
          <div
            className={`exercise-toggle${open ? ' open' : ''}`}
            style={{ opacity: resolvedEx.status === 'unavailable' ? 0.3 : 1 }}
          >
            +
          </div>
        </div>
      </div>
      {open && (
        <div className="sets-table open">
          {suggestion && !readOnly && (
            <div
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--accent)',
                borderRadius: '10px',
                padding: '10px 12px',
                margin: '0 0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.5px' }}>
                  SUGGESTED INCREASE
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '2px' }}>
                  {suggestion.label}
                  {suggestion.effective ? ` · ${suggestion.effective} kg effective` : ''}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  {suggestion.note}
                </div>
              </div>
              <button
                onClick={applySuggestion}
                style={{
                  background: 'var(--accent)',
                  color: '#0d0d0f',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                USE
              </button>
            </div>
          )}
          <div className="col-header">
            <span>SET</span>
            <span>REPS</span>
            <span>KG</span>
            <span></span>
          </div>
          {repsArr.map((rep, si) => {
            const key = setKey(weekNum, dayId, ex, si);
            const saved = setData[key] || {};

            return (
              <div key={si}>
                <div className="set-row">
                  <div className="set-label">S{si + 1}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <input
                      className={`set-input${rep === 'Failure' ? ' failure-set' : ''}`}
                      type="number"
                      inputMode="numeric"
                      placeholder={rep}
                      value={saved.reps || ''}
                      onChange={(e) => !readOnly && saveSetData(key, 'reps', e.target.value)}
                      readOnly={readOnly}
                      style={{ opacity: readOnly ? 0.6 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}
                    />
                    {isRepsSuspect(saved.reps) && (
                      <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '3px', textAlign: 'center' }}>
                        Check reps
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <input
                      className="set-input"
                      type="number"
                      inputMode="decimal"
                      placeholder={
                        assisted
                          ? lastLoggedValue(days, log, dayId, ex, si, 'assist', weekNum) ||
                            resolvedEx.defaultAssist ||
                            'assist'
                          : lastLoggedValue(days, log, dayId, ex, si, 'weight', weekNum) ||
                            resolvedEx.defaultWeight ||
                            'kg'
                      }
                      value={(assisted ? saved.assist : saved.weight) || ''}
                      onChange={(e) =>
                        !readOnly &&
                        (assisted ? saveAssist(key, e.target.value) : saveSetData(key, 'weight', e.target.value))
                      }
                      readOnly={readOnly}
                      style={{ opacity: readOnly ? 0.6 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}
                    />
                    {assisted && saved.assist ? (
                      <div style={{ fontSize: '10px', marginTop: '3px', textAlign: 'center', lineHeight: 1.3 }}>
                        {saved.weight ? (
                          <span style={{ color: bw?.stale ? 'var(--red)' : 'var(--muted)' }}>
                            = {saved.weight}kg
                            {bw?.stale ? ' · weigh-in is old' : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--red)' }}>log a bodyweight</span>
                        )}
                      </div>
                    ) : (
                      isWeightSuspect(saved.weight, resolvedEx) && (
                        <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '3px', textAlign: 'center' }}>
                          Check weight
                        </div>
                      )
                    )}
                  </div>
                  <button
                    className={`check-btn${saved.done ? ' done' : ''}`}
                    onClick={() => !readOnly && toggleSet(si, rep)}
                    style={{ opacity: readOnly ? 0.6 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', padding: '10px 12px 4px' }}>
          <button
            onClick={() => setNoteOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              cursor: 'pointer',
              fontSize: '12px',
              color: exerciseNotes[exerciseNoteKey(weekNum, dayId, ex)] ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📝 {exerciseNotes[exerciseNoteKey(weekNum, dayId, ex)] ? 'NOTE ·' : 'ADD NOTE'}
          </button>
          {!readOnly && (
            <button
              onClick={() => toggleHeldExercise(holdKey(dayId, ex))}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                cursor: 'pointer',
                fontSize: '12px',
                color: held ? 'var(--accent2)' : 'var(--muted)',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              {held ? `⏸ HELD SINCE ${held.since?.slice(5) ?? ''} · RESUME` : '⏸ HOLD THIS WEIGHT'}
            </button>
          )}
          {held && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5, marginTop: '4px' }}>
              Weight suggestions are paused for this exercise. Nothing else changes — reps and loads are still logged
              and still graphed.
            </div>
          )}
          {noteOpen && (
            <div style={{ marginTop: '8px' }}>
              {weekNum > 1 && exerciseNotes[exerciseNoteKey(weekNum - 1, dayId, ex)] && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '8px 10px',
                    marginBottom: '8px',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px', fontSize: '11px' }}>
                    LAST WEEK
                  </div>
                  {exerciseNotes[exerciseNoteKey(weekNum - 1, dayId, ex)]}
                </div>
              )}
              <textarea
                value={exerciseNotes[exerciseNoteKey(weekNum, dayId, ex)] || ''}
                onChange={(e) => saveExerciseNote(exerciseNoteKey(weekNum, dayId, ex), e.target.value)}
                placeholder="Add a note for this exercise..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  padding: '10px',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.5,
                }}
              />
            </div>
          )}
        </div>
      )}
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
  const quoteTone = useStore((s) => s.quoteTone);
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
  const [celebrating, setCelebrating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [swappedExercises, setSwappedExercises] = useState({});

  function handleSwap(ei) {
    setSwappedExercises((prev) => ({ ...prev, [ei]: !prev[ei] }));
  }
  const [celebMins, setCelebMins] = useState(0);
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
    saveCompletedDay(key);
    saveWorkoutDate(key, existingDate ?? todayStr());
    saveSessionTime(key, mins);
    // Say so rather than quietly recording a different number than the one that was
    // on screen a second ago.
    if (trimmed && existingMins == null) showToast(`${mins} min — timed to your last set, not the button`);
    // Record the session window for the Health Connect sweep — first completion
    // only, so re-completing a day cannot overwrite the real window with a stub.
    // Fire-and-forget: heart rate arriving or not must never hold up the summary.
    if (!existingDate) captureSessionWindow(key, start, end);
    setCelebMins(mins);
    setCelebrating(true);
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
    <div>
      {celebrating && (
        <CelebrationScreen
          mins={celebMins}
          dayFocus={day.focus}
          tone={quoteTone}
          onDismiss={() => {
            setCelebrating(false);
            setShowSummary(true);
          }}
        />
      )}
      {showSummary && (
        <WorkoutSummaryScreen
          dayId={dayId}
          weekNum={weekNum}
          mins={celebMins}
          noteKey={key}
          onDismiss={() => {
            setShowSummary(false);
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
              setRestTimer(null);
            }}
            onSkip={(value) => {
              if (value && restTimer.nextSetKey) writeCarriedValue(restTimer.nextSetKey, value);
              setRestTimer(null);
            }}
          />
        </>
      )}
      <div className="day-header">
        <h2>{day.focus.toUpperCase()}</h2>
        <p>
          {day.label} · {tiles.length} exercises
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {day.equipment.map((e) => (
              <span key={e} className="equip-tag">
                {e}
              </span>
            ))}
          </div>
          {!isDone && (
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '20px',
                color: 'var(--muted)',
                letterSpacing: '1px',
                flexShrink: 0,
                marginLeft: '12px',
              }}
            >
              {sessionDisplay}
            </div>
          )}
        </div>
      </div>

      {weekNum > 1 && notes[dayKey(weekNum - 1, dayId)] && (
        <div
          onClick={() => setPrevNoteOpen((o) => !o)}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            marginBottom: '12px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
              LAST WEEK'S NOTES
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '16px' }}>{prevNoteOpen ? '▲' : '▼'}</div>
          </div>
          {prevNoteOpen && (
            <div style={{ fontSize: '14px', color: 'var(--text)', marginTop: '10px', lineHeight: 1.5 }}>
              {notes[dayKey(weekNum - 1, dayId)]}
            </div>
          )}
        </div>
      )}

      {tiles.map((tile, ei) => {
        const ex = activeExs[ei];
        return (
          <ExerciseCard
            key={tile.slot ?? exerciseKeyPart(tile.options[0])}
            ex={ex}
            ei={ei}
            dayId={dayId}
            weekNum={weekNum}
            onSetTicked={handleSetTicked}
            swapped={!!swappedExercises[ei]}
            onSwap={handleSwap}
            slotOptions={tile.options}
            onSlotSwap={(option) => handleSlotSwap(tile, option)}
            readOnly={isDone && !editing}
          />
        );
      })}

      {isDone && (
        <button
          className="save-day-btn"
          onClick={() => setEditing((e) => !e)}
          style={{
            background: editing ? 'var(--accent)' : 'none',
            border: '1px solid var(--accent)',
            color: editing ? '#0d0d0f' : 'var(--accent)',
            marginBottom: '10px',
          }}
        >
          {editing ? 'FINISH EDITING' : 'EDIT THIS SESSION'}
        </button>
      )}

      <button className="save-day-btn" onClick={handleComplete}>
        {isDone ? 'UNDO COMPLETE' : 'MARK DAY COMPLETE'}
      </button>
      {!isDone && (
        <button
          className={`skip-day-btn${isSkipped ? ' skipped' : ''}`}
          onClick={handleSkip}
          style={{ marginBottom: '20px' }}
        >
          {isSkipped ? `UNSKIP DAY (${isSkipped})` : 'SKIP DAY'}
        </button>
      )}
    </div>
  );
}
