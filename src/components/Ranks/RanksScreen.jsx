import React, { useState } from 'react';
import useRankBoard from '../../hooks/useRankBoard';
import { TIERS, closestRankUps } from '../../utils/ranks';
import RankBadge from './RankBadge';
import MuscleStrengthScreen from '../Progress/MuscleStrengthScreen';
import Icon from '../ui/Icon';

// Ranks — the game layer over Strength by Muscle.
//
// Overall rank up top, the tier ladder, one row per muscle (strongest first, the
// order allMuscles already gives), then the muscles closest to their next rank.
// Tapping a muscle drops into the existing per-muscle detail, which is where the
// two-scale honesty (logged vs untrained) and the per-lift breakdown live.

function toNextCopy(m) {
  const best = m.best?.score;
  if (!m.rank?.next) return 'Top of the ladder';
  if (best?.toNext != null && best?.nextLevel) {
    const unit = best.repsBased ? 'reps' : best.unit === 'kg per hand' ? 'kg per hand' : 'kg';
    return `${best.toNext} ${unit} on ${m.best.name ?? m.best.ex.name} to ${best.nextLevel}`;
  }
  return `${Math.round((1 - m.rank.progress) * 100)}% to ${m.rank.next}`;
}

export default function RanksScreen({ onBack }) {
  const { board, bodyweight } = useRankBoard();
  const [detail, setDetail] = useState(null);

  if (detail) {
    return <MuscleStrengthScreen onBack={() => setDetail(null)} initialOpen={detail} />;
  }

  const overall = board.overall;
  const closest = closestRankUps(board, 2);

  return (
    <div className="stack stack-16">
      <div className="row-between">
        <button className="icon-btn" onClick={onBack} aria-label="Back to progress">
          <Icon name="arrowLeft" size={18} />
        </button>
        <span className="meta" style={{ fontWeight: 600 }}>
          {bodyweight?.kg
            ? `Ranked against lifters your size · ${bodyweight.kg} kg`
            : 'Needs a bodyweight in the Body tab'}
        </span>
        <span style={{ width: 40 }} />
      </div>

      <div className="card card-lg row" style={{ padding: 20, gap: 18 }}>
        <RankBadge rank={overall.rank} size={84} />
        <div className="grow stack" style={{ gap: 6 }}>
          <span className="eyebrow">Overall rank</span>
          <span className="display" style={{ fontSize: 34, fontVariationSettings: "'wdth' 72" }}>
            {overall.rank ? overall.rank.name : 'Unranked'}
          </span>
          <span className="bar thick">
            <i style={{ width: `${overall.rank ? Math.round(overall.rank.progress * 100) : 0}%` }} />
          </span>
          <span className="meta" style={{ color: 'var(--text-2)' }}>
            {overall.rank
              ? `${Math.round((1 - overall.rank.progress) * 100)}% to ${overall.rank.next ?? 'the top'} · ${overall.scored} of ${overall.total} muscles scored`
              : 'Log a session and a bodyweight to get ranked'}
          </span>
        </div>
      </div>

      <div className="row" style={{ gap: 6, flexWrap: 'wrap', padding: '0 2px' }}>
        {TIERS.map((t, i) => (
          <span
            key={t.id}
            className="row"
            style={{
              gap: 5,
              fontSize: 11,
              fontWeight: overall.rank?.tier.id === t.id ? 700 : 600,
              color: overall.rank?.tier.id === t.id ? 'var(--text)' : 'var(--muted)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
            {t.name}
            {i < TIERS.length - 1 && <span style={{ color: 'var(--border)', marginLeft: 2 }}>·</span>}
          </span>
        ))}
        <span className="meta" style={{ marginLeft: 'auto', fontSize: 11 }}>
          I · II · III each
        </span>
      </div>

      <div>
        <div className="section-head">
          <span className="h-section">By muscle</span>
          <span className="link">strongest first</span>
        </div>
        <div className="list">
          {board.muscles.map((m) => (
            <button key={m.muscle} className="list-row" onClick={() => setDetail({ muscle: m.muscle, label: m.label })}>
              <RankBadge rank={m.rank} size={34} />
              <span className="grow stack" style={{ gap: 5 }}>
                <span className="row-between">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.rank ? 'var(--text-2)' : 'var(--muted)' }}>
                    {m.rank ? m.rank.name : 'Unranked'}
                    {m.approx && <span style={{ color: 'var(--muted)', fontWeight: 600 }}> ≈</span>}
                  </span>
                </span>
                <span className="bar">
                  <i style={{ width: `${m.rank ? Math.round(m.rank.progress * 100) : 0}%` }} />
                </span>
                <span className="meta" style={{ fontSize: 11 }}>
                  {m.rank
                    ? `${m.best?.name ?? m.best?.ex?.name ?? ''}${m.best?.score ? ` ${m.best.score.repsBased ? `${m.best.score.value} reps` : `e1RM ${m.best.score.value} ${m.best.score.unit}`}` : ''} · ${toNextCopy(m)}`
                    : m.total
                      ? 'No session logged yet for this muscle'
                      : 'Not in this programme'}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="meta" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
          Tiers follow Strength Level's bands — Iron below Beginner, then Bronze, Silver, Gold, Platinum, Diamond for
          Beginner to Elite — split into thirds. ≈ marks a lift scored on the nearest published machine table.
        </div>
      </div>

      {closest.length > 0 && (
        <div>
          <div className="section-head">
            <span className="h-section">Closest rank-ups</span>
          </div>
          <div className="grid-2">
            {closest.map((m) => (
              <button
                key={m.muscle}
                className="card stack stack-4"
                style={{ padding: '12px 14px', textAlign: 'left' }}
                onClick={() => setDetail({ muscle: m.muscle, label: m.label })}
              >
                <span className="eyebrow accent" style={{ fontSize: 10 }}>
                  {m.label} → {m.rank.next}
                </span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{toNextCopy(m)}</span>
                <span className="meta" style={{ fontSize: 11 }}>
                  {Math.round(m.rank.progress * 100)}% of the way
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
