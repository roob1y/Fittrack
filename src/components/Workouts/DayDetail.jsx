import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import { PROGRAM } from '../../data/program';
import CelebrationScreen from './CelebrationScreen';
import RestTimer, { getRestDuration } from './RestTimer';
import { hapticsImpact } from '../../hooks/useHaptics';

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

function ExerciseCard({ ex, ei, dayId, onSetTicked }) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const weekNum = useStore((s) => s.weekNum);
  const setData = useStore((s) => s.setData);
  const saveSetData = useStore((s) => s.saveSetData);
  const savePB = useStore((s) => s.savePB);
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

  function checkPB(exName, reps, weight) {
    if (!weight || !reps) return false;
    const repNum = parseInt(reps);
    if (!repNum) return false;
    const key = `${exName}_${repNum}`;
    const current = pbs[key];
    if (!current || weight > current) {
      savePB(key, weight);
      return true;
    }
    return false;
  }

  async function toggleSet(si) {
    const key = `week${weekNum}_${dayId}_${ei}_${si}`;
    const current = setData[key]?.done;
    saveSetData(key, 'done', !current);

    if (!current) {
      // Haptic feedback on tick
      await hapticsImpact();

      const weight = parseFloat(setData[key]?.weight);
      const reps = parseInt(setData[key]?.reps);
      if (checkPB(resolvedEx.name, reps, weight)) {
        showToast(`🏆 New PB! ${resolvedEx.name} ${weight}kg x ${reps}`);
      }

      // Trigger rest timer
      onSetTicked(resolvedEx.name);
    }
  }

  const resolvedEx = resolveExercise(ex);
  const repsArr = buildRepsArray(resolvedEx);
  const barWeight = getBarWeight(resolvedEx);
  const hasPB = Object.keys(pbs).some((k) => k.startsWith(resolvedEx.name + '_'));

  return (
    <div className="exercise-card">
      <div className="exercise-header" onClick={() => setOpen((o) => !o)}>
        <div>
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
            return (
              <div key={si} className="set-row">
                <div className="set-label">S{si + 1}</div>
                <input
                  className="set-input"
                  type="number"
                  inputMode="numeric"
                  placeholder={rep}
                  value={saved.reps || ''}
                  onChange={(e) => saveSetData(key, 'reps', e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <input
                    className="set-input"
                    type="number"
                    inputMode="decimal"
                    placeholder={resolvedEx.defaultWeight || 'kg'}
                    value={saved.weight || ''}
                    onChange={(e) => saveSetData(key, 'weight', e.target.value)}
                  />
                  {saved.weight && barWeight && (
                    <div style={{ fontSize: '10px', color: 'var(--accent)', textAlign: 'center' }}>
                      = {parseFloat(saved.weight) + barWeight}kg total
                    </div>
                  )}
                </div>
                <button className={`check-btn${saved.done ? ' done' : ''}`} onClick={() => toggleSet(si)}>
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DayDetail({ dayId, onBack }) {
  const weekNum = useStore((s) => s.weekNum);
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

  const [celebrating, setCelebrating] = useState(false);
  const [celebMins, setCelebMins] = useState(0);

  // Rest timer state
  const [restTimer, setRestTimer] = useState(null); // { exerciseName, duration } | null

  const [sessionStart] = useState(Date.now());
  const day = PROGRAM.find((d) => d.id === dayId);
  const key = `week${weekNum}_${dayId}`;
  const isDone = !!completedDays[key];
  const isSkipped = skippedDays?.[key];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // Called by ExerciseCard when a set is ticked done
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
    const mins = Math.round((Date.now() - sessionStart) / 60000);
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
            onBack();
          }}
        />
      )}

      {/* Rest timer bottom sheet */}
      {restTimer && (
        <RestTimer
          exerciseName={restTimer.exerciseName}
          duration={restTimer.duration}
          onComplete={() => setRestTimer(null)}
          onSkip={() => setRestTimer(null)}
        />
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
        <ExerciseCard key={ei} ex={ex} ei={ei} dayId={dayId} onSetTicked={handleSetTicked} />
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
