// ══════════════════════════════════════════
//  muscleStrength.js
//  Per-muscle strength, assembled from per-LIFT standards.
// ══════════════════════════════════════════
//
// ⚠ Read this before trusting a muscle score.
//
// Published strength standards exist for LIFTS, not for muscles. Nobody measures
// "average bicep strength"; they measure what people curl. So a muscle score here
// is the mean of the scorable lifts that train it DIRECTLY — an inference, and it
// is labelled as one on screen.
//
// Direct work only, the same rule the volume panel already uses: a bench press
// says nothing trustworthy about what the triceps could lift alone, so secondary
// involvement is excluded entirely rather than weighted down.
//
// COVERAGE IS PARTIAL AND THAT IS THE HONEST STATE. Only free-weight and
// bodyweight lifts have portable standards; cable and machine numbers mean
// something different on every machine, so triceps (all cable), quads and
// hamstrings (all machine) currently score nothing at all. A muscle with no
// scorable lift returns `covered: 0` and the screen says so rather than inventing
// a figure from the lifts it does have.

import { sessionsFor } from './progressStats';
import { scoreExercise, STANDARDS } from './strengthStandards';
import { MUSCLE_LABELS } from './muscleVolume';

// Every programme exercise that trains this muscle as a PRIMARY mover, with its
// score where one exists. Ordered strongest first so the page opens on the best.
export function muscleBreakdown(days, slice, muscle, bodyweightKg) {
  const rows = [];
  for (const day of days ?? []) {
    for (const ex of day.exercises ?? []) {
      if (!(ex.muscles?.primary ?? []).includes(muscle)) continue;
      const sessions = sessionsFor(days, slice, day.id, ex);
      rows.push({
        ex,
        dayId: day.id,
        focus: day.focus,
        sessions,
        hasStandard: !!STANDARDS[ex.name],
        score: scoreExercise(ex, sessions, bodyweightKg),
      });
    }
  }
  return rows.sort((a, b) => (b.score?.score ?? -1) - (a.score?.score ?? -1));
}

// One muscle's headline: the mean score across its scorable lifts.
export function muscleScore(rows) {
  const scored = rows.filter((r) => r.score);
  if (!scored.length) return { score: null, covered: 0, total: rows.length, approx: false };
  const mean = scored.reduce((a, r) => a + r.score.score, 0) / scored.length;
  return {
    score: Math.round(mean),
    covered: scored.length,
    total: rows.length,
    approx: scored.some((r) => r.score.approx),
    best: scored[0],
  };
}

// Every muscle the programme trains directly, with its score. Muscles with no
// scorable lift still appear — a blank is information, and hiding them would make
// the missing standards invisible.
export function allMuscles(days, slice, bodyweightKg) {
  const seen = new Set();
  for (const day of days ?? []) {
    for (const ex of day.exercises ?? []) for (const m of ex.muscles?.primary ?? []) seen.add(m);
  }
  return [...seen]
    .map((muscle) => {
      const rows = muscleBreakdown(days, slice, muscle, bodyweightKg);
      return { muscle, label: MUSCLE_LABELS[muscle] ?? muscle, rows, ...muscleScore(rows) };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
