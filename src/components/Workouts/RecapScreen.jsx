import React, { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { EMPTY } from '../../store/shape';
import { dayKey } from '../../utils/setKeys';
import { sessionRecap, topSets, topSetHistory } from '../../utils/recap';
import { shareNodeAsImage } from '../../utils/shareImage';
import useRankBoard from '../../hooks/useRankBoard';
import { rankBoard } from '../../utils/ranks';
import { bodyweightAt } from '../../utils/loads';
import Icon from '../ui/Icon';
import ShareCard from './ShareCard';
import fanfareSrc from '../../assets/sounds/celebration-fanfare.mp3';

// Session complete. Replaces CelebrationScreen + WorkoutSummaryScreen: a headline
// in plain words, the session's numbers with deltas against last time, every
// exercise as a row with what changed, a one-line note, Share.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtLong = (s) =>
  s ? new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
const tonnage = (kg) => (kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg} kg`);
const KIND = {
  up: { icon: 'up', cls: 'up', label: 'new best' },
  reps: { icon: 'up', cls: '', label: '' },
  new: { icon: 'plus', cls: '', label: 'first session' },
  hold: { icon: 'hold', cls: '', label: 'held' },
  down: { icon: 'down', cls: 'down', label: '' },
  skipped: { icon: 'x', cls: '', label: 'skipped' },
};

// `past`: opened from a finished session rather than by finishing it. No fanfare,
// and the rank on the card is the rank as of that session's date, not today's —
// sharing a 20 Aug session should not show a rank earned in September.
export default function RecapScreen({ dayId, weekNum, rankUps = [], onDismiss, past = false }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const equipment = useStore((s) => s.equipment);
  const notes = slice?.notes ?? EMPTY;
  const saveNote = useStore((s) => s.saveNote);
  const sessionHealth = slice?.sessionHealth ?? EMPTY;
  const healthEnabled = useStore((s) => s.healthEnabled);
  const { board } = useRankBoard();
  const weightLog = useStore((s) => s.weightLog);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const key = dayKey(weekNum, dayId);

  const recap = useMemo(
    () => sessionRecap(days, slice, dayId, weekNum, { equipment }),
    [days, slice, dayId, weekNum, equipment],
  );
  const tops = useMemo(
    () => (recap ? topSets(days, slice, dayId, weekNum, recap) : []),
    [days, slice, dayId, weekNum, recap],
  );
  const chart = useMemo(() => {
    if (!recap) return null;
    // Chart the lift that moved most today, else the heaviest top set.
    const pick = tops[0];
    if (!pick) return null;
    const ex =
      recap.day.exercises.find((e) => e.name === pick.name) ??
      recap.day.exercises.find((e) => e.alternative?.name === pick.name);
    if (!ex) return null;
    return { name: pick.name, points: topSetHistory(days, slice, dayId, ex, 6, recap.date) };
  }, [recap, tops, days, slice, dayId]);
  const rankThen = useMemo(() => {
    if (!past || !recap?.date) return board.overall.rank;
    const upTo = Object.fromEntries(Object.entries(slice?.workoutDates ?? {}).filter(([, d]) => d && d <= recap.date));
    const bw = bodyweightAt(weightLog, recap.date)?.kg ?? null;
    return rankBoard(days, { ...slice, workoutDates: upTo }, bw).overall.rank;
  }, [past, recap, slice, days, weightLog, board]);

  const [visible, setVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef(null);
  useEffect(() => {
    setTimeout(() => setVisible(true), 30);
    if (!rankUps.length && !past) {
      try {
        new Audio(fanfareSrc).play();
      } catch {}
    }
  }, []);

  if (!recap) return null;
  const health = sessionHealth?.[key];
  const d = recap.prev;
  const delta = (a, b) => (a != null && b != null ? a - b : null);
  const dMins = delta(recap.mins, d?.mins);
  const dTon = delta(recap.tonnage, d?.tonnage);

  async function share() {
    if (sharing) return;
    setSharing(true);
    try {
      await shareNodeAsImage(cardRef.current, `fittrack-${recap.date ?? 'session'}.png`, 'Share your session');
    } catch (e) {
      console.error('share failed', e);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg)',
        overflowY: 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div
        className="stack stack-16"
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: 'calc(var(--sat) + 28px) 20px calc(var(--sab) + 24px)',
          minHeight: '100%',
        }}
      >
        <div className="stack stack-8">
          <span className="eyebrow accent">
            {past ? 'Session recap' : 'Session complete'} · {recap.day.focus}
          </span>
          <span className="display" style={{ fontSize: 44, fontVariationSettings: "'wdth' 70", lineHeight: 0.95 }}>
            {recap.headline}
          </span>
          <span className="meta-2" style={{ color: 'var(--muted)' }}>
            {fmtLong(recap.date)} · cycle {weekNum} · session {recap.sessionNumber}
            {rankUps.length ? ` · ${rankUps.length} rank-up${rankUps.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        <div className="grid-3">
          <div className="card stack stack-4" style={{ padding: 12 }}>
            <span
              className="display"
              style={{ fontSize: 26, fontVariationSettings: "'wdth' 75", textTransform: 'none' }}
            >
              {recap.mins ?? '—'}
              <span className="meta" style={{ fontWeight: 600 }}>
                {' '}
                min
              </span>
            </span>
            <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
              {dMins == null
                ? 'this session'
                : dMins === 0
                  ? 'same as last'
                  : `${Math.abs(dMins)} min ${dMins < 0 ? 'faster' : 'longer'}`}
            </span>
          </div>
          <div className="card stack stack-4" style={{ padding: 12 }}>
            <span
              className="display"
              style={{ fontSize: 26, fontVariationSettings: "'wdth' 75", textTransform: 'none' }}
            >
              {tonnage(recap.tonnage)}
            </span>
            <span
              className="meta"
              style={{ fontSize: 11, fontWeight: 700, color: dTon > 0 ? 'var(--accent)' : undefined }}
            >
              {dTon == null
                ? 'lifted'
                : dTon === 0
                  ? 'same as last'
                  : `${dTon > 0 ? '+' : '−'}${Math.abs(dTon)} kg lifted`}
            </span>
          </div>
          <div className="card stack stack-4" style={{ padding: 12 }}>
            <span
              className="display"
              style={{ fontSize: 26, fontVariationSettings: "'wdth' 75", textTransform: 'none' }}
            >
              {recap.sets}
              <span className="meta" style={{ fontWeight: 600 }}>
                {' '}
                sets
              </span>
            </span>
            <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
              {recap.skipped ? `${recap.skipped} skipped` : `of ${recap.setsTotal}`}
            </span>
          </div>
        </div>

        <div className="list">
          {recap.rows.map((r) => {
            const k = KIND[r.kind];
            return (
              <div
                key={r.name}
                className={`list-row${r.kind === 'up' || r.pb ? ' highlight' : ''}`}
                style={r.kind === 'skipped' ? { opacity: 0.6 } : undefined}
              >
                <span
                  className={`check-dot${r.kind === 'up' || r.pb ? ' done' : ''}`}
                  style={{ width: 30, height: 30, borderStyle: r.kind === 'skipped' ? 'dashed' : 'solid' }}
                >
                  {r.kind !== 'skipped' && <Icon name={r.pb ? 'trophy' : k.icon} size={14} strokeWidth={3} />}
                </span>
                <span className="grow">
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                  <span className="meta" style={{ display: 'block' }}>
                    {r.kind === 'skipped' ? 'Skipped' : r.text}
                  </span>
                </span>
                {r.kind !== 'skipped' && (
                  <span style={{ textAlign: 'right' }}>
                    <span
                      className="num"
                      style={{
                        display: 'block',
                        fontSize: 15,
                        color:
                          r.kind === 'up' || r.kind === 'reps'
                            ? 'var(--accent)'
                            : r.kind === 'down'
                              ? 'var(--down)'
                              : undefined,
                      }}
                    >
                      {r.deltaText}
                    </span>
                    <span className="meta" style={{ display: 'block', fontSize: 11 }}>
                      {r.pb ? 'PB' : k.label}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {healthEnabled && (
          <div className="meta" style={{ fontSize: 11 }}>
            {health?.avgHr
              ? `Avg HR ${health.avgHr} · max ${health.maxHr ?? '—'}`
              : 'Heart rate arrives once Samsung Health syncs — check Sessions & recovery later.'}
          </div>
        )}

        <div className="stack stack-8">
          <label className="eyebrow" htmlFor="recap-note" style={{ fontSize: 10 }}>
            How did it feel?
          </label>
          <textarea
            id="recap-note"
            className="input"
            rows={2}
            placeholder="One line for next time…"
            value={notes[key] || ''}
            onChange={(e) => saveNote(key, e.target.value)}
          />
        </div>

        <div className="stack stack-8" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <button className="btn btn-primary btn-block" onClick={share} disabled={sharing}>
            <Icon name="share" size={18} strokeWidth={2.5} /> {sharing ? 'Preparing…' : 'Share recap'}
          </button>
          <button className="btn btn-ghost btn-block" onClick={onDismiss}>
            {past ? 'Close' : 'Done'}
          </button>
        </div>
      </div>

      {/* Off-screen share card, rasterised on demand. */}
      <div style={{ position: 'fixed', left: -2000, top: 0, pointerEvents: 'none' }} aria-hidden="true">
        <ShareCard
          ref={cardRef}
          recap={recap}
          rank={rankThen}
          rankUps={rankUps}
          tops={tops}
          chart={chart}
          past={past}
        />
      </div>
    </div>
  );
}
