import React, { useState, useRef } from 'react';
import useStore from '../../store/useStore';
import { PROGRAM, WARMUPS } from '../../data/program';

function TimedCard({ warmup, wi }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(warmup.duration);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);
  const weightUnit = useStore((s) => s.weightUnit);

  function start() {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(warmup.duration);
  }

  return (
    <div className="exercise-card" style={{ opacity: done ? 0.55 : 1 }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ marginBottom: '10px' }}>
          <div className="exercise-name">{warmup.name}</div>
          <div className="exercise-meta" style={{ marginTop: '4px', lineHeight: 1.5 }}>
            {warmup.description}
          </div>
          {warmup.weightNote && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              🏋️ {warmup.weightNote} ({weightUnit})
            </div>
          )}
        </div>
        {!running && !done && (
          <button
            onClick={start}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>▶</span> Start {warmup.duration}s timer
          </button>
        )}
        {running && (
          <div style={{ marginTop: '10px' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}
            >
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '40px',
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                {seconds}
              </div>
              <button
                onClick={stop}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Stop
              </button>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
              <div
                style={{
                  height: '100%',
                  background: 'var(--accent)',
                  borderRadius: '2px',
                  width: `${(seconds / warmup.duration) * 100}%`,
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>
        )}
        {done && (
          <div
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', color: 'var(--accent)', lineHeight: 1 }}
          >
            ✓
          </div>
        )}
      </div>
    </div>
  );
}

function RepsCard({ warmup }) {
  const [done, setDone] = useState(false);
  const weightUnit = useStore((s) => s.weightUnit);

  return (
    <div className="exercise-card" style={{ opacity: done ? 0.55 : 1 }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div className="exercise-name">{warmup.name}</div>
            <div className="exercise-meta" style={{ marginTop: '4px', lineHeight: 1.5 }}>
              {warmup.description}
            </div>
            {warmup.weightNote && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                🏋️ {warmup.weightNote} ({weightUnit})
              </div>
            )}
            <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              {warmup.reps} reps
            </div>
          </div>
          <button
            onClick={() => setDone((d) => !d)}
            style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: done ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: done ? 'var(--accent)' : 'var(--surface)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: done ? '#0d0d0f' : 'var(--muted)',
              transition: 'all 0.15s',
              marginTop: '2px',
            }}
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WarmupView({ dayId, onStartWorkout }) {
  const equipment = useStore((s) => s.equipment);
  const day = PROGRAM.find((d) => d.id === dayId);
  const warmups = WARMUPS[dayId] || [];

  function hasEquipment(required) {
    if (!required || required.length === 0) return true;
    return required.every((e) => equipment?.includes(e));
  }

  const available = warmups.filter((w) => hasEquipment(w.equipment));

  return (
    <div>
      <div className="day-header">
        <h2>WARM UP</h2>
        <p>
          {day.focus} · {available.length} movements
        </p>
      </div>
      {available.map((warmup, wi) =>
        warmup.type === 'timed' ? (
          <TimedCard key={wi} warmup={warmup} wi={wi} />
        ) : (
          <RepsCard key={wi} warmup={warmup} wi={wi} />
        ),
      )}
      <button className="save-day-btn" onClick={onStartWorkout}>
        START WORKOUT
      </button>
    </div>
  );
}
