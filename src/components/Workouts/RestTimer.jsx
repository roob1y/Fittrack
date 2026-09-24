import React, { useEffect, useRef, useState } from 'react';
import { hapticsNotification } from '../../hooks/useHaptics';
import { playRestComplete, playCountdownBeep } from '../../hooks/useSound';
import { scheduleLocalNotification, cancelLocalNotification } from '../../plugins/localNotifications';

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

export function getRestDuration(exerciseName, overrides, compoundFlag, restSeconds) {
  // A per-exercise `restSeconds` in program.js wins over everything else. It is
  // the only honest way to say "this IS a compound movement, but it does not
  // need the full compound rest" — an activation set, a light ramp — without
  // lying about `compound` and losing the flag everywhere else it is read.
  // It beats the user's global compound/accessory overrides too: those set the
  // default for a whole category, this is a deliberate exception to it.
  const explicit = Number(restSeconds);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);

  // Otherwise prefer the programme's own `compound` flag. COMPOUND_NAMES is a
  // legacy fallback for programmes whose exercises predate the flag — it
  // silently misses any name not on the list, which is how a whole day of
  // compound work ended up on 60s rest.
  if (typeof compoundFlag === 'boolean') {
    return compoundFlag ? (overrides?.compound ?? 90) : (overrides?.accessory ?? 60);
  }
  if (!exerciseName) return overrides?.accessory ?? 60;
  const isCompound = COMPOUND_NAMES.some((name) => exerciseName.toLowerCase().includes(name.toLowerCase()));
  if (isCompound) return overrides?.compound ?? 90;
  return overrides?.accessory ?? 60;
}

export default function RestTimer({
  exerciseName,
  duration,
  nextSetKey,
  nextSetWeight,
  isLastSet,
  nextSetInfo,
  isBodyweight,
  isCompound,
  onComplete,
  onSkip,
}) {
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

  // Countdown beeps at 3, 2, 1
  useEffect(() => {
    if (seconds === 3 || seconds === 2 || seconds === 1) {
      playCountdownBeep(seconds);
    }
  }, [seconds]);

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

  // Colour shifts from accent → red as time runs low
  const isLow = seconds <= 10;
  const arcColour = isLow ? 'var(--red)' : 'var(--accent)';

  // ±30 s: move the wall-clock start rather than the countdown, so the tick,
  // the resync after backgrounding and the notification all agree.
  function adjust(delta) {
    startTimeRef.current -= delta * 1000;
    totalRef.current = Math.max(1, totalRef.current + delta);
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSeconds(Math.max(0, duration - elapsed));
  }
  const bump = (delta) => {
    const next = Math.max(0, (parseFloat(weight) || 0) + delta);
    const str = String(Math.round(next * 100) / 100);
    setWeight(str);
    weightRef.current = str;
  };
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  const R = 100;
  const C = 2 * Math.PI * R;

  return (
    <>
      <div className="scrim" style={{ zIndex: 110 }} />
      <div className="bottom-sheet stack" style={{ zIndex: 120, alignItems: 'center', gap: 16, overflow: 'visible' }}>
        <div className="sheet-handle" style={{ margin: '0 auto 4px' }} />
        <div className="stack" style={{ alignItems: 'center', gap: 2 }}>
          <span className="eyebrow">Resting</span>
          <span className="meta-2" style={{ fontWeight: 600 }}>
            {exerciseName}
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            width: 220,
            height: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke={arcColour}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - Math.min(1, seconds / totalRef.current))}
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
            />
          </svg>
          <div className="stack" style={{ alignItems: 'center', gap: 2 }}>
            <span
              className="display"
              style={{
                fontSize: 64,
                fontVariationSettings: "'wdth' 75",
                fontVariantNumeric: 'tabular-nums',
                color: isLow ? 'var(--down)' : undefined,
              }}
            >
              {mm}:{ss}
            </span>
            <span className="meta" style={{ fontWeight: 600 }}>
              of {Math.floor(totalRef.current / 60)}:{String(totalRef.current % 60).padStart(2, '0')} ·{' '}
              {isCompound ? 'compound' : 'isolation'}
            </span>
          </div>
        </div>

        {nextSetInfo && (
          <div className="card row" style={{ width: '100%', gap: 12, padding: '12px 14px' }}>
            <div className="grow">
              <div className="eyebrow" style={{ fontSize: 10 }}>
                {nextSetInfo.type === 'set'
                  ? `Next · set ${nextSetInfo.setNum} of ${nextSetInfo.totalSets}`
                  : 'Next exercise'}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>
                {nextSetInfo.type === 'set' ? `${exerciseName} · ${nextSetInfo.reps} reps` : nextSetInfo.name}
              </div>
            </div>
            {nextSetKey && !isLastSet && !isBodyweight && (
              <div className="stepper sm" style={{ flexShrink: 0 }}>
                <button onClick={() => bump(-2.5)} aria-label="Less weight">
                  −
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  aria-label="Next set weight"
                  onChange={(e) => {
                    setWeight(e.target.value);
                    weightRef.current = e.target.value;
                  }}
                  style={{ width: 64, minWidth: 0 }}
                />
                <button onClick={() => bump(2.5)} aria-label="More weight">
                  +
                </button>
              </div>
            )}
          </div>
        )}

        <div className="row" style={{ width: '100%', gap: 8 }}>
          <button className="btn grow" onClick={() => adjust(-30)}>
            −30 s
          </button>
          <button className="btn grow" onClick={() => adjust(30)}>
            +30 s
          </button>
          <button
            className="btn btn-primary"
            style={{ flexGrow: 2, fontSize: 16 }}
            onClick={() => handleComplete(weight)}
          >
            Skip rest
          </button>
        </div>
      </div>
    </>
  );
}
