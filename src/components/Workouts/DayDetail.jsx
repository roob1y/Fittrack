import React, { useEffect, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAM } from '../../data/program';
import CelebrationScreen from './CelebrationScreen';
import WorkoutSummaryScreen from './WorkoutSummaryScreen';
import RestTimer, { getRestDuration } from './RestTimer';
import { hapticsImpact } from '../../hooks/useHaptics';
import { getCurrentWeek } from '../../utils/week';
import ExerciseDetailSheet from './ExerciseDetailSheet';
import { scheduleLocalNotification, cancelLocalNotification } from '../../plugins/localNotifications';

const THIRTY_MINS = 30 * 60 * 1000;

// Available plate sizes in kg — largest first for greedy algorithm
const PLATES = [20, 15, 10, 7.5, 5, 2.5, 1.25];

/**
 * Given a total weight and bar weight, returns an array of plates per side.
 * Returns null if the weight is not achievable.
 */
function calculatePlates(totalWeight, barWeight) {
  const totalPlateWeight = totalWeight - barWeight;
  if (totalPlateWeight < 0) return null;
  if (totalPlateWeight === 0) return [];

  const perSide = totalPlateWeight / 2;
  // Check it's divisible into two equal sides cleanly
  if (Math.abs(perSide * 2 - totalPlateWeight) > 0.01) return null;

  let remaining = Math.round(perSide * 100) / 100;
  const result = [];

  for (const plate of PLATES) {
    while (remaining >= plate - 0.001) {
      result.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  }

  if (remaining > 0.01) return null; // not achievable
  return result;
}

function PlateDisplay({ plates }) {
  if (!plates) return null;
  if (plates.length === 0) {
    return <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Bar only</div>;
  }

  // Group plates: e.g. [20, 20, 5] → "20 × 2 + 5 × 1"
  const grouped = [];
  for (const plate of plates) {
    const last = grouped[grouped.length - 1];
    if (last && last.weight === plate) {
      last.count++;
    } else {
      grouped.push({ weight: plate, count: 1 });
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px' }}>PER SIDE</span>
      {grouped.map(({ weight, count }, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ fontSize: '10px', color: 'var(--muted)' }}>+</span>}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '2px 7px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent)',
              whiteSpace: 'nowrap',
            }}
          >
            {weight}kg{count > 1 ? ` ×${count}` : ''}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

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

function getPrevWeekWeight(setData, weekNum, dayId, ei, si) {
  if (weekNum < 1) return null;
  const prevKey = `week${weekNum - 1}_${dayId}_${ei}_${si}`;
  return setData[prevKey]?.weight || null;
}

function ExerciseCard({ ex, ei, dayId, weekNum, onSetTicked }) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const setData = useStore((s) => s.setData);
  const saveSetData = useStore((s) => s.saveSetData);
  const savePB = useStore((s) => s.savePB);
  const savePBAchieved = useStore((s) => s.savePBAchieved);
  const equipment = useStore((s) => s.equipment);
  const pbsAchieved = useStore((s) => s.pbsAchieved);
  const exerciseNotes = useStore((s) => s.exerciseNotes);
  const saveExerciseNote = useStore((s) => s.saveExerciseNote);

  const resolvedEx = resolveExercise(ex);
  const repsArr = buildRepsArray(resolvedEx);
  const barWeight = getBarWeight(resolvedEx);
  const hasPB = !!pbsAchieved[resolvedEx.name];

  function hasEquipment(required) {
    if (!required || required.length === 0) return true;
    return required.every((e) => equipment?.includes(e));
  }

  function resolveExercise(ex) {
    if (hasEquipment(ex.equipment)) return { ...ex, status: 'available' };
    if (ex.alternative && hasEquipment(ex.alternative.equipment)) {
      return { ...ex, name: ex.alternative.name, status: 'alternative' };
    }
    return { ...ex, status: 'unavailable' };
  }

  function getBarWeight(ex) {
    if (ex.equipment?.includes('Barbell (7ft)')) return 10;
    if (ex.equipment?.includes('Barbell (5ft)')) return 7.5;
    return null;
  }

  function buildRepsArray(ex) {
    const parts = ex.reps.split('/');
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
    const key = `week${weekNum}_${dayId}_${ei}_${si}`;
    const current = setData[key]?.done;
    saveSetData(key, 'done', !current);

    if (!current) {
      await hapticsImpact();
      const fresh = useStore.getState().setData[key];
      const weight = parseFloat(fresh?.weight) || parseFloat(resolvedEx.defaultWeight) || 0;
      const reps = parseInt(fresh?.reps) || parseInt(rep); // rep = repsArr[si], the placeholder for this set

      if (weight && reps) {
        const e1rm = weight * (1 + reps / 30);
        if (!useStore.getState().pbs[resolvedEx.name]) {
          savePB(resolvedEx.name, e1rm);
        } else if (checkPB(resolvedEx.name, weight, reps)) {
          savePBAchieved(resolvedEx.name);
          showToast(`🏆 New PB! ${resolvedEx.name} ${weight}kg × ${reps}`);
        }
      }
      const currentSetWeight = useStore.getState().setData[`week${weekNum}_${dayId}_${ei}_${si}`]?.weight;
      onSetTicked(
        resolvedEx.name,
        `week${weekNum}_${dayId}_${ei}_${si + 1}`,
        currentSetWeight || getPrevWeekWeight(setData, weekNum, dayId, ei, si + 1) || resolvedEx.defaultWeight || '',
        ei,
        si,
      );
    } else {
      // Unticked — recalculate best e1RM across remaining ticked sets
      const allSetData = useStore.getState().setData;
      let bestE1rm = 0;
      for (let s = 0; s < resolvedEx.sets; s++) {
        if (s === si) continue; // skip the set being unticked
        const k = `week${weekNum}_${dayId}_${ei}_${s}`;
        const d = allSetData[k];
        if (!d?.done || !d?.weight || !d?.reps) continue;
        const e1rm = parseFloat(d.weight) * (1 + parseInt(d.reps) / 30);
        if (e1rm > bestE1rm) bestE1rm = e1rm;
      }
      savePB(resolvedEx.name, bestE1rm > 0 ? bestE1rm : null);
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
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          {barWeight && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
              🏋️ Includes {barWeight}kg bar weight
            </div>
          )}
          <div className="col-header">
            <span>SET</span>
            <span>REPS</span>
            <span>KG</span>
            <span></span>
          </div>
          {repsArr.map((rep, si) => {
            const key = `week${weekNum}_${dayId}_${ei}_${si}`;
            const saved = setData[key] || {};
            const enteredWeight = parseFloat(saved.weight);
            const validWeight = isFinite(enteredWeight) && enteredWeight > 0;
            const totalWeight = barWeight && validWeight ? enteredWeight : null;
            const plates = barWeight && validWeight ? calculatePlates(enteredWeight, barWeight) : null;
            const prevWeight =
              si > 0 ? parseFloat(setData[`week${weekNum}_${dayId}_${ei}_${si - 1}`]?.weight) || null : null;
            const isLastFilledSet = repsArr
              .slice(si + 1)
              .every((_, offset) => !parseFloat(setData[`week${weekNum}_${dayId}_${ei}_${si + 1 + offset}`]?.weight));
            const weightChanged = prevWeight && Math.abs(prevWeight - enteredWeight) > 0.01;
            const showPlates = barWeight && validWeight && (isLastFilledSet || weightChanged);
            return (
              <div key={si}>
                <div className="set-row">
                  <div className="set-label">S{si + 1}</div>
                  <input
                    className={`set-input${rep === 'Failure' ? ' failure-set' : ''}`}
                    type="number"
                    inputMode="numeric"
                    placeholder={rep}
                    value={saved.reps || ''}
                    onChange={(e) => saveSetData(key, 'reps', e.target.value)}
                  />
                  <input
                    className="set-input"
                    type="number"
                    inputMode="decimal"
                    placeholder={getPrevWeekWeight(setData, weekNum, dayId, ei, si) || resolvedEx.defaultWeight || 'kg'}
                    value={saved.weight || ''}
                    onChange={(e) => saveSetData(key, 'weight', e.target.value)}
                  />
                  <button className={`check-btn${saved.done ? ' done' : ''}`} onClick={() => toggleSet(si, rep)}>
                    ✓
                  </button>
                </div>
                {/* Plate calculator — only shown for barbell exercises with a weight entered */}
                {showPlates && (
                  <div style={{ paddingLeft: '48px', paddingBottom: '8px', display: 'flex', justifyContent: 'right' }}>
                    {plates ? (
                      <PlateDisplay plates={plates} />
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>
                        Not achievable with your plates
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Exercise note */}
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
              color: exerciseNotes[`week${weekNum}_${dayId}_${ei}`] ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📝 {exerciseNotes[`week${weekNum}_${dayId}_${ei}`] ? 'NOTE ·' : 'ADD NOTE'}
          </button>
          {noteOpen && (
            <div style={{ marginTop: '8px' }}>
              {weekNum > 1 && exerciseNotes[`week${weekNum - 1}_${dayId}_${ei}`] && (
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
                  {exerciseNotes[`week${weekNum - 1}_${dayId}_${ei}`]}
                </div>
              )}
              <textarea
                value={exerciseNotes[`week${weekNum}_${dayId}_${ei}`] || ''}
                onChange={(e) => saveExerciseNote(`week${weekNum}_${dayId}_${ei}`, e.target.value)}
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
  const programmeStartDate = useStore((s) => s.programmeStartDate);
  const completedDays = useStore((s) => s.completedDays);
  const skippedDays = useStore((s) => s.skippedDays);
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
  const notes = useStore((s) => s.notes);
  const setProgrammeStartDate = useStore((s) => s.setProgrammeStartDate);

  const [celebrating, setCelebrating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [celebMins, setCelebMins] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [prevNoteOpen, setPrevNoteOpen] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [sessionDisplay, setSessionDisplay] = useState('0:00');

  const workoutNotifIdRef = useRef(null);
  const sessionStartRef = useRef(Date.now());

  const weekNum = getCurrentWeek(programmeStartDate);
  const day = PROGRAM.find((d) => d.id === dayId);
  const key = `week${weekNum}_${dayId}`;
  const isDone = !!completedDays[key];
  const isSkipped = skippedDays?.[key];

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

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = String(elapsed % 60).padStart(2, '0');
      setSessionDisplay(hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}:${secs}` : `${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleSetTicked(exerciseName, nextKey, prevWeight, ei, si) {
    setLastSetLoggedAt(Date.now());
    const lastExIdx = day.exercises.length - 1;
    const isLastSet = ei === lastExIdx && si === day.exercises[lastExIdx].sets - 1;
    if (!isLastSet) {
      const duration = getRestDuration(exerciseName, restDurationOverride);

      // Work out next set info for the footer
      const currentEx = day.exercises[ei];
      const isLastSetOfExercise = si === currentEx.sets - 1;
      let nextSetInfo;
      if (isLastSetOfExercise) {
        // Final set of this exercise — show next exercise name
        const nextEx = day.exercises[ei + 1];
        nextSetInfo = nextEx ? { type: 'exercise', name: nextEx.name } : null;
      } else {
        // More sets in this exercise — show set number and reps
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
        setIdx: si,
      });
    }
  }

  function handleComplete() {
    if (!programmeStartDate) setProgrammeStartDate(todayStr());
    if (isDone) {
      removeCompletedDay(key);
      onBack();
      return;
    }
    const mins = Math.round((Date.now() - sessionStartRef.current) / 60000);
    saveCompletedDay(key);
    saveWorkoutDate(key, todayStr());
    saveSessionTime(key, mins);
    setCelebMins(mins);
    setCelebrating(true);
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
      onBack();
      return;
    }
    const reason = prompt('Reason for skipping?\n\n1. Rest day\n2. Illness\n3. No time\n4. Other');
    if (!reason) return;
    const reasons = ['Rest day', 'Illness', 'No time', 'Other'];
    const reasonText = reasons[parseInt(reason) - 1] || 'Other';
    saveSkippedDay(key, reasonText);
    saveWorkoutDate(key, todayStr());
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
            onBack();
          }}
        />
      )}
      {/* Undo workout modal */}
      {showUndoModal && (
        <div
          onClick={() => setShowUndoModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '22px',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}
            >
              UNDO WORKOUT?
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
              This will remove today's completed workout. Your set data will remain.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowUndoModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  removeCompletedDay(key);
                  setShowUndoModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--red)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: '#fff',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                UNDO
              </button>
            </div>
          </div>
        </div>
      )}
      {restTimer && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 110 }} onTouchMove={(e) => e.preventDefault()} />{' '}
          <RestTimer
            exerciseName={restTimer.exerciseName}
            duration={restTimer.duration}
            nextSetKey={restTimer.nextSetKey}
            nextSetWeight={restTimer.nextSetWeight}
            isLastSet={restTimer.isLastSet}
            nextSetInfo={restTimer.nextSetInfo}
            onComplete={(weight) => {
              if (weight && restTimer.nextSetKey) {
                // Apply confirmed weight to all remaining sets of this exercise
                const ex = day.exercises[restTimer.exerciseIdx];
                const startSi = restTimer.setIdx + 1;
                for (let s = startSi; s < ex.sets; s++) {
                  const k = `week${weekNum}_${dayId}_${restTimer.exerciseIdx}_${s}`;
                  saveSetData(k, 'weight', weight);
                }
              }
              setRestTimer(null);
            }}
            onSkip={(weight) => {
              if (weight && restTimer.nextSetKey) saveSetData(restTimer.nextSetKey, 'weight', weight);
              setRestTimer(null);
            }}
          />
        </>
      )}
      <div className="day-header">
        <h2>{day.focus.toUpperCase()}</h2>
        <p>
          {day.label} · {day.exercises.length} exercises
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
      {/* Previous week notes */}
      {weekNum > 1 && notes[`week${weekNum - 1}_${dayId}`] && (
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
              {notes[`week${weekNum - 1}_${dayId}`]}
            </div>
          )}
        </div>
      )}
      {day.exercises.map((ex, ei) => (
        <ExerciseCard key={ei} ex={ex} ei={ei} dayId={dayId} weekNum={weekNum} onSetTicked={handleSetTicked} />
      ))}
      <button className="save-day-btn" onClick={handleComplete}>
        {isDone ? 'UNDO COMPLETE' : 'MARK DAY COMPLETE'}
      </button>
      {isDone && (
        <button
          onClick={() => setShowUndoModal(true)}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '12px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--muted)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '16px',
            letterSpacing: '1px',
            cursor: 'pointer',
          }}
        >
          UNDO WORKOUT
        </button>
      )}
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
