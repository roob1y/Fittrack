import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAM } from '../../data/program';

export default function WorkoutSummaryScreen({ dayId, weekNum, mins, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const setData = useStore((s) => s.setData);
  const pbs = useStore((s) => s.pbs);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  const day = PROGRAM.find((d) => d.id === dayId);
  if (!day) return null;

  // Calculate sets completed vs total
  let totalSets = 0;
  let completedSets = 0;
  day.exercises.forEach((ex, ei) => {
    for (let si = 0; si < ex.sets; si++) {
      totalSets++;
      const key = `week${weekNum}_${dayId}_${ei}_${si}`;
      if (setData[key]?.done) completedSets++;
    }
  });

  // Find PBs hit this session — pbs are stored as exName_reps: weight
  // We detect session PBs by checking which exercises were logged this session
  const sessionPBs = [];
  day.exercises.forEach((ex, ei) => {
    for (let si = 0; si < ex.sets; si++) {
      const key = `week${weekNum}_${dayId}_${ei}_${si}`;
      const saved = setData[key];
      if (!saved?.done || !saved?.weight || !saved?.reps) continue;
      const pbKey = `${ex.name}_${parseInt(saved.reps)}`;
      const pbWeight = pbs[pbKey];
      if (pbWeight && parseFloat(saved.weight) >= pbWeight) {
        // Avoid duplicates
        if (!sessionPBs.find((p) => p.exercise === ex.name)) {
          sessionPBs.push({
            exercise: ex.name,
            weight: parseFloat(saved.weight),
            reps: parseInt(saved.reps),
          });
        }
      }
    }
  });

  const setsPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 24px',
        overflowY: 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--accent)',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Session complete
        </div>
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '40px',
            letterSpacing: '2px',
            color: 'var(--text)',
            lineHeight: 1,
          }}
        >
          {day.focus.toUpperCase()}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {/* Time */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 16px',
            gridColumn: mins > 0 ? 'auto' : '1 / -1',
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '48px',
              color: mins <= 60 ? 'var(--accent)' : 'var(--red)',
              lineHeight: 1,
            }}
          >
            {mins > 0 ? mins : '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginTop: '4px' }}>
            MINS
          </div>
          {mins > 60 && (
            <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>Over 60 min target</div>
          )}
          {mins > 0 && mins <= 60 && (
            <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px' }}>Within target</div>
          )}
        </div>

        {/* Sets */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 16px',
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '48px',
              color: 'var(--accent)',
              lineHeight: 1,
            }}
          >
            {completedSets}/{totalSets}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginTop: '4px' }}>
            SETS DONE
          </div>
          {/* Progress bar */}
          <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginTop: '10px' }}>
            <div
              style={{
                height: '100%',
                width: `${setsPercent}%`,
                background: setsPercent === 100 ? 'var(--accent)' : 'var(--accent2)',
                borderRadius: '2px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* PBs */}
      {sessionPBs.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#ffd700',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            🏆 Personal bests this session
          </div>
          {sessionPBs.map((pb, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: i < sessionPBs.length - 1 ? '10px' : 0,
                marginBottom: i < sessionPBs.length - 1 ? '10px' : 0,
                borderBottom: i < sessionPBs.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{pb.exercise}</div>
              <div style={{ fontSize: '13px', color: '#ffd700', fontWeight: 600 }}>
                {pb.weight}kg × {pb.reps}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dismiss hint */}
      <div
        style={{
          marginTop: 'auto',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--muted)',
          paddingTop: '24px',
        }}
      >
        Tap anywhere to continue
      </div>
    </div>
  );
}
