import React, { useEffect, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAM } from '../../data/program';
import CelebrationScreen from './CelebrationScreen';
import WorkoutSummaryScreen from './WorkoutSummaryScreen';
import RestTimer, { getRestDuration } from './RestTimer';
import { hapticsImpact } from '../../hooks/useHaptics';
import { getCurrentWeek } from '../../utils/week';

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

function ExerciseCard({ ex, ei, dayId, weekNum, onSetTicked }) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const setData = useStore((s) => s.setData);
  const saveSetData = useStore((s) => s.saveSetData);
  const savePB = useStore((s) => s.savePB);
  const savePBAchieved = useStore((s) => s.savePBAchieved);
  const pbs = useStore((s) => s.pbs);
  const equipment = useStore((s) => s.equipment);

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

  async function toggleSet(si) {
    const key = `week${weekNum}_${dayId}_${ei}_${si}`;
    const current = setData[key]?.done;
    saveSetData(key, 'done', !current);

    if (!current) {
      await hapticsImpact();
      const fresh = useStore.getState().setData[key];
      const weight = parseFloat(fresh?.weight);
      const reps = parseInt(fresh?.reps);
      if (weight && reps) {
        const e1rm = weight * (1 + reps / 30);
        if (!useStore.getState().pbs[resolvedEx.name]) {
          savePB(resolvedEx.name, e1rm);
        } else if (checkPB(resolvedEx.name, weight, reps)) {
          savePBAchieved(resolvedEx.name);
          showToast(`🏆 New PB! ${resolvedEx.name} ${weight}kg × ${reps}`);
        }
      }
      onSetTicked(resolvedEx.name);
    } else {
      // Unticked — recalculate best e1RM across remaining ticked sets
      const allSetData = useStore.getState().setData;
      let bestE1rm = 0;
      for (let s = 0; s < resolvedEx.sets; s++) {
        if (s === si) continue; // this set is being unticked
        const k = `week${weekNum}_${dayId}_${ei}_${s}`;
        const d = allSetData[k];
        if (!d?.done) continue;
        if (bestE1rm > 0) savePB(resolvedEx.name, bestE1rm);
      }
      savePB(resolvedEx.name, bestE1rm > 0 ? bestE1rm : null);
    }
  }

  const resolvedEx = resolveExercise(ex);
  const repsArr = buildRepsArray(resolvedEx);
  const barWeight = getBarWeight(resolvedEx);
  const pbsAchieved = useStore((s) => s.pbsAchieved);
  const hasPB = !!pbsAchieved[resolvedEx.name];
  return (
    <div className="exercise-card">
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
        <div
          className={`exercise-toggle${open ? ' open' : ''}`}
          style={{ opacity: resolvedEx.status === 'unavailable' ? 0.3 : 1 }}
        >
          +
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
            const totalWeight = barWeight && enteredWeight ? enteredWeight : null;
            const plates = barWeight && enteredWeight ? calculatePlates(enteredWeight, barWeight) : null;
            const prevWeight = si > 0 ? parseFloat(setData[`week${weekNum}_${dayId}_${ei}_${si - 1}`]?.weight) : null;
            const isLastFilledSet = repsArr
              .slice(si + 1)
              .every((_, offset) => !parseFloat(setData[`week${weekNum}_${dayId}_${ei}_${si + 1 + offset}`]?.weight));
            const weightChanged = prevWeight && Math.abs(prevWeight - enteredWeight) > 0.01;
            const showPlates = barWeight && enteredWeight > 0 && (isLastFilledSet || weightChanged);

            return (
              <div key={si}>
                <div className="set-row">
                  <div className="set-label">S{si + 1}</div>
                  <input
                    className="set-input"
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
                    placeholder={resolvedEx.defaultWeight || 'kg'}
                    value={saved.weight || ''}
                    onChange={(e) => saveSetData(key, 'weight', e.target.value)}
                  />
                  <button className={`check-btn${saved.done ? ' done' : ''}`} onClick={() => toggleSet(si)}>
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
    </div>
  );
}

export default function DayDetail({ dayId, onBack }) {
  const programmeStartDate = useStore((s) => s.programmeStartDate);
  const completedDays = useStore((s) => s.completedDays);
  const skippedDays = useStore((s) => s.skippedDays);
  const notes = useStore((s) => s.notes);
  const saveNote = useStore((s) => s.saveNote);
  const saveCompletedDay = useStore((s) => s.saveCompletedDay);
  const removeCompletedDay = useStore((s) => s.removeCompletedDay);
  const saveSkippedDay = useStore((s) => s.saveSkippedDay);
  const removeSkippedDay = useStore((s) => s.removeSkippedDay);
  const saveWorkoutDate = useStore((s) => s.saveWorkoutDate);
  const saveSessionTime = useStore((s) => s.saveSessionTime);
  const quoteTone = useStore((s) => s.quoteTone);

  const weekNum = getCurrentWeek(programmeStartDate);

  const [celebrating, setCelebrating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [celebMins, setCelebMins] = useState(0);
  const [restTimer, setRestTimer] = useState(null);

  const sessionStartRef = useRef(Date.now());
  const day = PROGRAM.find((d) => d.id === dayId);
  const key = `week${weekNum}_${dayId}`;
  const isDone = !!completedDays[key];
  const isSkipped = skippedDays?.[key];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleSetTicked(exerciseName) {
    const duration = getRestDuration(exerciseName);
    setRestTimer({ exerciseName, duration });
  }

  function handleComplete() {
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
  }

  function handleSkip() {
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
          onDismiss={() => {
            setShowSummary(false);
            onBack();
          }}
        />
      )}

      {restTimer && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 110 }} onTouchMove={(e) => e.preventDefault()} />{' '}
          <RestTimer
            exerciseName={restTimer.exerciseName}
            duration={restTimer.duration}
            onComplete={() => setRestTimer(null)}
            onSkip={() => setRestTimer(null)}
          />
        </>
      )}

      <div className="day-header">
        <h2>{day.focus.toUpperCase()}</h2>
        <p>
          {day.label} · {day.exercises.length} exercises
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {day.equipment.map((e) => (
            <span key={e} className="equip-tag">
              {e}
            </span>
          ))}
        </div>
      </div>

      {day.exercises.map((ex, ei) => (
        <ExerciseCard key={ei} ex={ex} ei={ei} dayId={dayId} weekNum={weekNum} onSetTicked={handleSetTicked} />
      ))}

      <textarea
        placeholder="How did you feel? Any notes on today's session..."
        value={notes[key] || ''}
        onChange={(e) => saveNote(key, e.target.value)}
        style={{
          width: '100%',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          padding: '14px',
          marginBottom: '12px',
          resize: 'none',
          height: '100px',
          marginTop: '8px',
        }}
      />

      <button className="save-day-btn" onClick={handleComplete}>
        {isDone ? 'UNDO COMPLETE' : 'MARK DAY COMPLETE'}
      </button>
      <button
        className={`skip-day-btn${isSkipped ? ' skipped' : ''}`}
        onClick={handleSkip}
        style={{ marginBottom: '20px' }}
      >
        {isSkipped ? `UNSKIP DAY (${isSkipped})` : 'SKIP DAY'}
      </button>
    </div>
  );
}
