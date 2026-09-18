// ══════════════════════════════════════════
//  ranks.js
//  The game layer over strengthStandards.js — tiers, sub-tiers, rank-ups.
// ══════════════════════════════════════════
//
// A rank is a NAME for a score, nothing more. `scoreExercise` already produces a
// continuous 0–100 where each Strength Level band is 20 points wide:
//
//     0–20   below Beginner      Iron
//    20–40   Beginner            Bronze
//    40–60   Novice              Silver
//    60–80   Intermediate        Gold
//    80–100  Advanced            Platinum
//    100     Elite               Diamond
//
// Each tier splits into I / II / III by thirds of its band, so a sub-rank is a
// ~6.7-point step — small enough that a good session can move it, which is the
// point. Nothing here changes what a score MEANS; the honest caveats in
// strengthStandards.js (per-hand dumbbells, added-weight chin-ups, plates-only
// hack squats, machine numbers as proxies) all still apply underneath the name.
//
// Muscle and overall ranks come from muscleStrength.js: a muscle is the mean of
// its scorable lifts, overall is the mean of the scored muscles. A muscle with no
// scorable lift has no rank and is excluded from the average rather than dragged
// in as zero.

import { allMuscles } from './muscleStrength';

export const TIERS = [
  { id: 'iron', name: 'Iron', level: 'below Beginner', color: 'var(--rank-iron)', deep: '#4f535c', ink: '#eef0f4' },
  { id: 'bronze', name: 'Bronze', level: 'Beginner', color: 'var(--rank-bronze)', deep: '#8e5626', ink: '#fff3e6' },
  { id: 'silver', name: 'Silver', level: 'Novice', color: 'var(--rank-silver)', deep: '#8f96a3', ink: '#0c0d10' },
  { id: 'gold', name: 'Gold', level: 'Intermediate', color: 'var(--rank-gold)', deep: '#b58a26', ink: '#0c0d10' },
  {
    id: 'platinum',
    name: 'Platinum',
    level: 'Advanced',
    color: 'var(--rank-platinum)',
    deep: '#4fa9d6',
    ink: '#0c0d10',
  },
  { id: 'diamond', name: 'Diamond', level: 'Elite', color: 'var(--rank-diamond)', deep: '#9b87e6', ink: '#0c0d10' },
];
export const SUB = ['I', 'II', 'III'];
const BAND = 20;

// { tier, sub, name, ordinal, progress, next }
//   tier      one of TIERS
//   sub       'I' | 'II' | 'III'
//   name      'Bronze II'
//   ordinal   0..17 — Iron I is 0, Diamond III is 17; compare two ranks with this
//   progress  0..1 within the current sub-rank, for the bar
//   next      the next rank's name, or null at the top
export function rankFor(score) {
  if (score == null || !Number.isFinite(score)) return null;
  const s = Math.max(0, Math.min(100, score));
  if (s >= 100) {
    return { tier: TIERS[5], sub: 'III', name: 'Diamond III', ordinal: 17, progress: 1, next: null };
  }
  const tierIdx = Math.min(4, Math.floor(s / BAND));
  const within = (s - tierIdx * BAND) / BAND; // 0..1 inside the tier
  const subIdx = Math.min(2, Math.floor(within * 3));
  const progress = within * 3 - subIdx;
  const ordinal = tierIdx * 3 + subIdx;
  const tier = TIERS[tierIdx];
  const nextOrd = ordinal + 1;
  const next = nextOrd > 17 ? null : rankName(nextOrd);
  return { tier, sub: SUB[subIdx], name: `${tier.name} ${SUB[subIdx]}`, ordinal, progress, next };
}

export function rankName(ordinal) {
  if (ordinal >= 17) return 'Diamond III';
  return `${TIERS[Math.floor(ordinal / 3)].name} ${SUB[ordinal % 3]}`;
}

// Score at which a given ordinal begins — for "N kg to Silver I" style copy the
// caller converts back through the lift's own thresholds; here it is just points.
export function scoreAtOrdinal(ordinal) {
  if (ordinal >= 17) return 100;
  return Math.floor(ordinal / 3) * BAND + (ordinal % 3) * (BAND / 3);
}

// Every muscle with its rank, plus the overall.
//   { overall: { score, rank, scored, total }, muscles: [{ muscle, label, score, rank, rows, ... }] }
export function rankBoard(days, slice, bodyweightKg) {
  const muscles = allMuscles(days, slice, bodyweightKg).map((m) => ({ ...m, rank: rankFor(m.score) }));
  const scored = muscles.filter((m) => m.score != null);
  const mean = scored.length ? scored.reduce((a, m) => a + m.score, 0) / scored.length : null;
  const score = mean == null ? null : Math.round(mean * 10) / 10;
  return {
    overall: { score, rank: rankFor(score), scored: scored.length, total: muscles.length },
    muscles,
  };
}

// The rank-ups between two boards, for the end-of-session moment. Compares by
// ordinal so a move from Bronze III to Silver I counts once, and a drop is not
// reported at all — a bad day is not a demotion ceremony.
export function rankUps(before, after) {
  const ups = [];
  const prev = new Map((before?.muscles ?? []).map((m) => [m.muscle, m]));
  for (const m of after?.muscles ?? []) {
    const was = prev.get(m.muscle)?.rank;
    if (!m.rank) continue;
    if (!was || m.rank.ordinal > was.ordinal) {
      ups.push({
        kind: 'muscle',
        muscle: m.muscle,
        label: m.label,
        from: was ?? null,
        to: m.rank,
        best: m.best ?? null,
      });
    }
  }
  const o0 = before?.overall?.rank;
  const o1 = after?.overall?.rank;
  if (o1 && (!o0 || o1.ordinal > o0.ordinal)) {
    ups.push({ kind: 'overall', label: 'Overall', from: o0 ?? null, to: o1, best: null });
  }
  return ups;
}

// The muscles nearest their next sub-rank, for "closest rank-ups".
export function closestRankUps(board, limit = 2) {
  return (board?.muscles ?? [])
    .filter((m) => m.rank && m.rank.next)
    .sort((a, b) => b.rank.progress - a.rank.progress)
    .slice(0, limit);
}
