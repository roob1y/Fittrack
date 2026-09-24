import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RankBadge from './RankBadge';
import Icon from '../ui/Icon';
import { hapticsNotification } from '../../hooks/useHaptics';
import rankUpSrc from '../../assets/sounds/rank-up.mp3';

// The rank-up moment. One screen per rank-up, shown between "Finish session" and
// the recap. The sequence: rays fade in and turn, the badge springs in, the old
// sub-rank slides up and out as the new one slides in, the bar fills to the end
// of the old rank and resets to the start of the new one, then the "what did it"
// card and the button. Haptic on the badge landing.

const RAYS = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);

export default function RankUpScreen({ up, index, total, onContinue }) {
  const [stage, setStage] = useState(0); // 0 badge in, 1 old→new, 2 the rest
  useEffect(() => {
    // The jingle's landing chord is at 0.5 s; the badge spring lands at ~0.8 s.
    const audio = new Audio(rankUpSrc);
    const t0 = setTimeout(() => {
      try {
        audio.play();
      } catch {}
    }, 300);
    const t1 = setTimeout(() => {
      hapticsNotification?.();
      setStage(1);
    }, 900);
    const t2 = setTimeout(() => setStage(2), 2100);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      audio.pause();
    };
  }, [up]);

  const tier = up.to.tier;
  const fromName = up.from?.name ?? 'Unranked';
  const best = up.best;
  const bestScore = best?.score;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'calc(var(--sat) + 24px) 24px calc(var(--sab) + 24px)',
      }}
    >
      <motion.svg
        width="640"
        height="640"
        viewBox="0 0 640 640"
        style={{ position: 'absolute', top: 'calc(var(--sat) - 40px)', left: 'calc(50% - 320px)', opacity: 0.35 }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 0.35 }}
        transition={{ rotate: { duration: 40, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.8 } }}
        aria-hidden="true"
      >
        <g stroke={tier.color} strokeWidth="1">
          {RAYS.map((a) => (
            <line
              key={a}
              x1="320"
              y1="320"
              x2={320 + 320 * Math.cos((a * Math.PI) / 180)}
              y2={320 + 320 * Math.sin((a * Math.PI) / 180)}
            />
          ))}
        </g>
        <circle cx="320" cy="320" r="150" fill="var(--bg)" />
      </motion.svg>

      <div
        style={{
          position: 'relative',
          marginTop: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <motion.span
          className="eyebrow accent"
          style={{ letterSpacing: '0.18em', fontSize: 12 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Rank up
        </motion.span>
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.3 }}
        >
          <RankBadge rank={up.to} size={200} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          <span className="display" style={{ fontSize: 48, fontVariationSettings: "'wdth' 70" }}>
            {up.label}
          </span>
          <div style={{ position: 'relative', height: 26, width: 260, textAlign: 'center' }}>
            <AnimatePresence mode="wait">
              {stage < 1 ? (
                <motion.span
                  key="old"
                  style={{ position: 'absolute', inset: 0, fontSize: 18, fontWeight: 600, color: 'var(--muted)' }}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.3 }}
                >
                  {fromName}
                </motion.span>
              ) : (
                <motion.span
                  key="new"
                  style={{ position: 'absolute', inset: 0, fontSize: 18, fontWeight: 700 }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {up.to.name}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <motion.div
        style={{ position: 'relative', width: '100%', marginTop: 34 }}
        className="stack stack-10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <span className="bar thick">
          <motion.i
            initial={{ width: `${Math.round((up.from?.progress ?? 0) * 100)}%` }}
            animate={stage >= 1 ? { width: ['100%', '100%', `${Math.max(6, Math.round(up.to.progress * 100))}%`] } : {}}
            transition={{ duration: 1.4, times: [0, 0.55, 1], ease: 'easeInOut' }}
            style={{ display: 'block', height: '100%', background: 'var(--accent)', borderRadius: 'inherit' }}
          />
        </span>
        <div className="row-between meta" style={{ fontWeight: 600 }}>
          <span>{up.to.name}</span>
          <span>{up.to.next ? `next: ${up.to.next}` : 'top of the ladder'}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {stage >= 2 && (
          <motion.div
            className="card stack stack-4"
            style={{ position: 'relative', width: '100%', marginTop: 18, padding: '14px 16px' }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="eyebrow" style={{ fontSize: 10 }}>
              What did it
            </span>
            {best ? (
              <>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {best.name ?? best.ex?.name}
                  {bestScore?.from?.weight != null
                    ? ` · ${bestScore.from.weight} ${bestScore.unit} × ${bestScore.from.reps}`
                    : ''}
                </span>
                <span className="meta">
                  {bestScore
                    ? bestScore.repsBased
                      ? `${bestScore.value} reps — ${bestScore.level ?? 'below Beginner'} on the ${bestScore.proxy ?? 'published'} table`
                      : `est. 1RM ${bestScore.value} ${bestScore.unit} — ${bestScore.level ?? 'below Beginner'}${bestScore.proxy ? ` on the ${bestScore.proxy} table` : ''}`
                    : ''}
                </span>
              </>
            ) : (
              <span style={{ fontWeight: 600, fontSize: 14 }}>Every scored muscle moved the average up</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'relative', marginTop: 'auto', width: '100%' }} className="stack stack-8">
        <motion.button
          className="btn btn-primary btn-block"
          onClick={onContinue}
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 2 ? 1 : 0.35 }}
        >
          {index + 1 < total ? 'Next rank-up' : 'See recap'}
          <Icon name="arrowRight" size={18} strokeWidth={2.5} />
        </motion.button>
        <span className="meta" style={{ textAlign: 'center' }}>
          {index + 1} of {total} rank-up{total === 1 ? '' : 's'} this session
        </span>
      </div>
    </div>
  );
}
