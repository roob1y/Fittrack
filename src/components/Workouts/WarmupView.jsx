import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROGRAM } from '../../data/program';
import { WARMUPS } from '../../data/warmups';
import useStore from '../../store/useStore';

const SLIDE_VARIANTS = {
  enter: (dir) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const TRANSITION = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.28,
};

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? '20px' : '6px',
            height: '6px',
            borderRadius: '3px',
            background: i === current ? 'var(--accent)' : 'var(--border)',
            transition: 'all 0.25s ease',
          }}
        />
      ))}
    </div>
  );
}

function TimedScreen({ warmup, onAdvance }) {
  const [timeLeft, setTimeLeft] = useState(warmup.duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(warmup.duration);
    setRunning(false);
  }, [warmup]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setTimeout(onAdvance, 600);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, warmup, onAdvance]);

  const progress = timeLeft / warmup.duration;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * progress;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
      {/* GIF placeholder */}
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          aspectRatio: '4/3',
          borderRadius: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '8px',
          color: 'var(--muted)',
        }}
      >
        <div style={{ fontSize: '36px' }}>🎬</div>
        <div style={{ fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>Animation coming soon</div>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: 'var(--muted)',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
          padding: '0 8px',
        }}
      >
        {warmup.description}
      </p>

      {/* Countdown ring */}
      <div style={{ position: 'relative', width: '128px', height: '128px' }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: running ? 'stroke-dasharray 0.9s linear' : 'none' }}
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
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '42px',
              color: running ? 'var(--text)' : 'var(--muted)',
              lineHeight: 1,
            }}
          >
            {timeLeft}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'var(--muted)' }}>secs</span>
        </div>
      </div>

      {/* Start button — only shown when not yet running */}
      {!running && (
        <button className="save-day-btn" onClick={() => setRunning(true)} style={{ width: '100%', maxWidth: '320px' }}>
          START
        </button>
      )}
    </div>
  );
}

function RepsScreen({ warmup, onAdvance }) {
  const weightUnit = useStore((s) => s.weightUnit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
      {/* GIF placeholder */}
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          aspectRatio: '4/3',
          borderRadius: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '8px',
          color: 'var(--muted)',
        }}
      >
        <div style={{ fontSize: '36px' }}>🎬</div>
        <div style={{ fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>Animation coming soon</div>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: 'var(--muted)',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
          padding: '0 8px',
        }}
      >
        {warmup.description}
      </p>

      {/* Reps target */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '64px',
            color: 'var(--accent)',
            lineHeight: 1,
          }}
        >
          {warmup.reps}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'var(--muted)',
            marginTop: '2px',
          }}
        >
          reps
        </div>
        {warmup.weightNote && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: 'var(--accent)',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
          >
            🏋️ {warmup.weightNote} ({weightUnit})
          </div>
        )}
      </div>

      {/* Done button */}
      <button className="save-day-btn" onClick={onAdvance} style={{ width: '100%', maxWidth: '320px' }}>
        DONE
      </button>
    </div>
  );
}

export default function WarmupView({ dayId, onStartWorkout, onBack }) {
  const equipment = useStore((s) => s.equipment);
  const day = PROGRAM.find((d) => d.id === dayId);
  const warmups = WARMUPS[dayId] || [];

  function hasEquipment(required) {
    if (!required || required.length === 0) return true;
    return required.every((e) => equipment?.includes(e));
  }

  const available = warmups.filter((w) => hasEquipment(w.equipment));

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  function advance() {
    if (index < available.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
      window.scrollTo({ top: 0 });
    } else {
      onStartWorkout();
    }
  }

  function goBack() {
    if (index === 0) {
      onBack();
    } else {
      setDirection(-1);
      setIndex((i) => i - 1);
      window.scrollTo({ top: 0 });
    }
  }

  // Expose goBack for Android back button — called from WorkoutsView
  useEffect(() => {
    window.__warmupGoBack = goBack;
    return () => {
      delete window.__warmupGoBack;
    };
  }, [index]);

  const warmup = available[index];
  const isLast = index === available.length - 1;

  return (
    <div style={{ padding: '0 16px', paddingBottom: '32px' }}>
      {/* Header row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          paddingTop: '8px',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '28px',
              color: 'var(--text)',
              margin: 0,
            }}
          >
            WARM UP
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            {day.focus} · {index + 1} of {available.length}
          </p>
        </div>
        <button
          onClick={onStartWorkout}
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
          SKIP
        </button>
      </motion.div>

      {/* Progress dots */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <ProgressDots total={available.length} current={index} />
      </motion.div>

      {/* Sliding exercise name */}
      <div style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.h3
            key={`name-${index}`}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '22px',
              color: 'var(--text)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {warmup.name}
          </motion.h3>
        </AnimatePresence>
      </div>

      {/* Sliding screen content */}
      <div style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`screen-${index}`}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
          >
            {warmup.type === 'timed' ? (
              <TimedScreen key={`timed-${index}`} warmup={warmup} onAdvance={advance} />
            ) : (
              <RepsScreen warmup={warmup} onAdvance={advance} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
