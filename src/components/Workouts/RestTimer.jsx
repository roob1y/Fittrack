import React, { useEffect, useRef, useState } from 'react';
import { hapticsNotification } from '../../hooks/useHaptics';
import { playRestComplete } from '../../hooks/useSound';
import { scheduleLocalNotification, cancelLocalNotification } from '../../plugins/localNotifications';
import useStore from '../../store/useStore';

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
  const isCompound = COMPOUND_NAMES.some((name) => exerciseName.toLowerCase().includes(name.toLowerCase()));
  return isCompound ? 90 : 60;
}

// REPLACE the component signature
export default function RestTimer({
  exerciseName,
  duration,
  nextSetKey,
  nextSetWeight,
  isLastSet,
  nextSetInfo,
  onComplete,
  onSkip,
}) {
  const weightUnit = useStore((s) => s.weightUnit);
  const [weight, setWeight] = useState(nextSetWeight || '');
  const [seconds, setSeconds] = useState(duration);

  const notifIdRef = useRef(null);
  const intervalRef = useRef(null);
  const totalRef = useRef(duration);
  // Record wall-clock start time so we can resync after backgrounding
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);
  const weightRef = useRef(nextSetWeight || '');

  function handleComplete() {
    if (completedRef.current) return;
    completedRef.current = true;
    clearInterval(intervalRef.current);
    if (notifIdRef.current !== null) {
      cancelLocalNotification(notifIdRef.current);
      notifIdRef.current = null;
    }
    hapticsNotification();
    playRestComplete();
    onComplete(weightRef.current);
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Tick interval — uses wall clock to stay accurate after backgrounding
  useEffect(() => {
    function tick() {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        // slight delay so user sees 0
        setTimeout(() => handleComplete(), 400);
      }
    }

    intervalRef.current = setInterval(tick, 500); // poll every 500ms for accuracy
    return () => clearInterval(intervalRef.current);
  }, []);

  // Resync timer when app comes back to foreground
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && !completedRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        setSeconds(remaining);
        if (remaining <= 0) {
          handleComplete();
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Schedule / cancel background rest notification based on app visibility
  useEffect(() => {
    async function handleVisibility() {
      if (document.visibilityState === 'hidden' && !completedRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(1, duration - elapsed);
        const id = Date.now() % 2147483647;
        notifIdRef.current = id;
        await scheduleLocalNotification({
          id,
          title: 'Rest over — time to lift! 💪',
          body: `${exerciseName} — next set ready.`,
          delaySeconds: remaining,
        });
      } else if (document.visibilityState === 'visible' && notifIdRef.current !== null) {
        await cancelLocalNotification(notifIdRef.current);
        notifIdRef.current = null;
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [duration, exerciseName]);

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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          borderRadius: '0 0 20px 20px',
          zIndex: 120,
          padding: 'calc(var(--sat, 0px) + 20px) 24px 28px',
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
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
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
            <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
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
              style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
            />
          </svg>

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
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px' }}>SEC</div>
          </div>
        </div>

        {/* Type badge */}
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '24px' }}>
          {duration === 90 ? 'Compound · 90s rest' : 'Isolation · 60s rest'}
        </div>

        {nextSetKey && !isLastSet && (
          <div style={{ width: '100%', marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              NEXT SET WEIGHT (KG)
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                weightRef.current = e.target.value;
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '20px',
                fontWeight: 700,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Buttons */}
        <div style={{ width: '100%' }}>
          <button
            onClick={() => handleComplete(weight)}
            style={{
              width: '100%',
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

        {/* Next set info footer */}
        {nextSetInfo && (
          <div
            style={{
              marginTop: '20px',
              fontSize: '12px',
              color: 'var(--muted)',
              textAlign: 'center',
              letterSpacing: '0.3px',
            }}
          >
            {nextSetInfo.type === 'set'
              ? `NEXT · SET ${nextSetInfo.setNum} OF ${nextSetInfo.totalSets} · ${nextSetInfo.reps} REPS`
              : `NEXT EXERCISE · ${nextSetInfo.name.toUpperCase()}`}
          </div>
        )}
      </div>{' '}
      {/* end sheet */}
    </>
  );
}
