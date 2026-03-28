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

  // Sets completed vs total
  let totalSets = 0;
  let completedSets = 0;
  day.exercises.forEach((ex, ei) => {
    for (let si = 0; si < ex.sets; si++) {
      totalSets++;
      const key = `week${weekNum}_${dayId}_${ei}_${si}`;
      if (setData[key]?.done) completedSets++;
    }
  });

  // PBs hit this session
  const sessionPBs = [];
  day.exercises.forEach((ex, ei) => {
    for (let si = 0; si < ex.sets; si++) {
      const key = `week${weekNum}_${dayId}_${ei}_${si}`;
      const saved = setData[key];
      if (!saved?.done || !saved?.weight || !saved?.reps) continue;
      const pbKey = `${ex.name}_${parseInt(saved.reps)}`;
      const pbWeight = pbs[pbKey];
      if (pbWeight && parseFloat(saved.weight) >= pbWeight) {
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
  const overTarget = mins > 60;
  const hasTime = mins > 0;

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  return (
    // Full screen backdrop
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 200,
        overflowY: 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Centred content — matches app max width */}
      <div
        style={{
          maxWidth: '620px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          padding: 'calc(var(--sat, 0px) + 40px) 20px calc(var(--sab, 0px) + 40px)',
          minHeight: '100%',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--accent)',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Session complete
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '52px',
              letterSpacing: '2px',
              color: 'var(--text)',
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            {day.focus.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {day.label} · Week {weekNum}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {/* Time */}
          <div
            style={{
              background: 'var(--card)',
              border: `1px solid ${overTarget ? 'var(--red)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '20px 16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              TIME
            </div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '44px',
                color: hasTime ? (overTarget ? 'var(--red)' : 'var(--accent)') : 'var(--border)',
                lineHeight: 1,
              }}
            >
              {hasTime ? mins : '0'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>mins</div>
            <div style={{ fontSize: '11px', marginTop: '8px', color: overTarget ? 'var(--red)' : 'var(--accent)' }}>
              {hasTime ? (overTarget ? '↑ Over 60 min' : '✓ Within target') : 'No timer data'}
            </div>
          </div>

          {/* Sets */}
          <div
            style={{
              background: 'var(--card)',
              border: `1px solid ${setsPercent === 100 ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '20px 16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              SETS
            </div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '44px',
                color: 'var(--accent)',
                lineHeight: 1,
              }}
            >
              {completedSets}
              <span style={{ fontSize: '24px', color: 'var(--muted)' }}>/{totalSets}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>completed</div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginTop: '10px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${setsPercent}%`,
                  background: setsPercent === 100 ? 'var(--accent)' : 'var(--accent2)',
                  borderRadius: '2px',
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '11px',
                marginTop: '6px',
                color: setsPercent === 100 ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {setsPercent === 100 ? '✓ All sets done' : `${setsPercent}% complete`}
            </div>
          </div>
        </div>

        {/* PBs */}
        {sessionPBs.length > 0 && (
          <div
            style={{
              background: 'rgba(255,215,0,0.05)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#ffd700',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              🏆 Personal bests
            </div>
            {sessionPBs.map((pb, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: i < sessionPBs.length - 1 ? '12px' : 0,
                  marginBottom: i < sessionPBs.length - 1 ? '12px' : 0,
                  borderBottom: i < sessionPBs.length - 1 ? '1px solid rgba(255,215,0,0.1)' : 'none',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{pb.exercise}</div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '18px',
                    color: '#ffd700',
                    letterSpacing: '0.5px',
                  }}
                >
                  {pb.weight}kg × {pb.reps}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dismiss */}
        <div style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Tap anywhere to continue</div>
        </div>
      </div>
    </div>
  );
}
