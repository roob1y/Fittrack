import React, { useEffect, useRef, useState } from 'react';
import { hapticsNotification } from '../../hooks/useHaptics';

// Exercises treated as compound — get 90s rest.
// Everything else gets 60s.
const COMPOUND_NAMES = [
  'Deadlifts',
  'Squats',
  'Bench Press',
  'Incline Bench Press',
  'Bent Over Rows',
  'Front Barbell Squat',
  'Straight-Legged Deadlifts',
  'Dumbbell Deadlifts',
  'Dumbbell Straight-Legged Deadlifts',
  'Barbell Hip Thrusts',
  'Bulgarian Split Squats',
];

export function getRestDuration(exerciseName) {
  if (!exerciseName) return 60;
  const isCompound = COMPOUND_NAMES.some((name) =>
    exerciseName.toLowerCase().includes(name.toLowerCase()),
  );
  return isCompound ? 90 : 60;
}

export default function RestTimer({ exerciseName, duration, onComplete, onSkip }) {
  const [seconds, setSeconds] = useState(duration);
  const [closing, setClosing] = useState(false);
  const intervalRef = useRef(null);
  const totalRef = useRef(duration);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          hapticsNotification();
          // slight delay so user sees 0 before sheet closes
          setTimeout(() => handleComplete(), 400);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  function handleComplete() {
    setClosing(true);
    setTimeout(onComplete, 280);
  }

  function handleSkip() {
    clearInterval(intervalRef.current);
    setClosing(true);
    setTimeout(onSkip, 280);
  }

  const progress = seconds / totalRef.current; // 1 → 0
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Colour shifts from accent → red as time runs low
  const isLow = seconds <= 10;
  const arcColour = isLow ? 'var(--red)' : 'var(--accent)';

  return (
    <>
      {/* Backdrop — no onClick, user must use buttons to dismiss */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 110,
        }}
      />

      {/* Sheet */}
      <div
        className={`bottom-sheet${closing ? ' closing' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          zIndex: 120,
          padding: '0 24px 40px',
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Drag handle — decorative only, no dismiss on tap */}
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'var(--border)',
            borderRadius: '2px',
            margin: '12px auto 20px',
          }}
        />

        {/* Exercise label */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--muted)',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          Rest
        </div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          {exerciseName}
        </div>

        {/* Circular countdown */}
        <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '28px' }}>
          <svg
            width="140"
            height="140"
            style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}
          >
            {/* Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={arcColour}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>

          {/* Countdown number */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '52px',
                color: isLow ? 'var(--red)' : 'var(--accent)',
                lineHeight: 1,
                transition: 'color 0.3s',
              }}
            >
              {seconds}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
              SEC
            </div>
          </div>
        </div>

        {/* Type badge */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--muted)',
            marginBottom: '24px',
          }}
        >
          {duration === 90 ? 'Compound · 90s rest' : 'Isolation · 60s rest'}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: '14px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '18px',
              letterSpacing: '1px',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            SKIP REST
          </button>
          <button
            onClick={handleComplete}
            style={{
              flex: 1,
              padding: '14px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '18px',
              letterSpacing: '1px',
              color: '#0d0d0f',
              cursor: 'pointer',
            }}
          >
            DONE RESTING
          </button>
        </div>
      </div>
    </>
  );
}
