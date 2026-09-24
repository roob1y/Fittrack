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
// COVERAGE: since 18 Sep every lift in the v2 programme has a table. Free-weight
// and bodyweight lifts are portable; machine and cable lifts are scored on the
// published table for that machine type and carry `proxy` so the screen can say
// which — a stack number still differs machine to machine. A muscle with no
// scorable lift (only possible on older programmes now) returns `covered: 0`.

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
      // Score the exercise as it is CURRENTLY done. Sessions logged on the
      // alternative (`via`) belong to a different lift with its own table, and
      // showing both rows at once (18 Sep) double-counted a movement he only does
      // one way now. So: the variant of the most recent session is the row; any
      // other variants are listed on it, not scored beside it.
      const groups = new Map();
      for (const s of sessions) {
        const name = s.via ?? ex.name;
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(s);
      }
      const latest = sessions[sessions.length - 1];
      const name = latest ? (latest.via ?? ex.name) : ex.name;
      const group = groups.get(name) ?? [];
      const scored = name === ex.name ? ex : { ...ex, name };
      const otherVariants = [...groups.entries()]
        .filter(([n]) => n !== name)
        .map(([n, g]) => ({ name: n, sessions: g.length, lastDate: g[g.length - 1].date }));
      rows.push({
        ex,
        name,
        performedVia: name === ex.name ? null : name,
        otherVariants,
        dayId: day.id,
        focus: day.focus,
        sessions: group,
        hasStandard: !!STANDARDS[name],
        score: scoreExercise(scored, group, bodyweightKg),
      });
    }
  }
  // Same rule for SLOT pairs — the two leg presses, the two RDLs, the two shoulder
  // presses. They are separate programme entries with separate histories, and the
  // screen was scoring both. He does whichever is free, so the one used most
  // recently is the row; its slot-mate is listed on it and comes back if he
  // switches. A slot with nothing logged on either keeps just the first entry.
  const bySlot = new Map();
  const out = [];
  for (const r of rows) {
    const slotId = r.ex.slot ? `${r.dayId}_${r.ex.slot}` : null;
    if (!slotId) {
      out.push(r);
      continue;
    }
    const last = r.sessions[r.sessions.length - 1]?.date ?? '';
    const cur = bySlot.get(slotId);
    if (!cur) {
      bySlot.set(slotId, { row: r, last });
      out.push(r);
      continue;
    }
    const loser = last > cur.last ? cur.row : r;
    const winner = last > cur.last ? r : cur.row;
    if (winner !== cur.row) {
      out[out.indexOf(cur.row)] = winner;
      bySlot.set(slotId, { row: winner, last });
    }
    if (loser.sessions.length) {
      winner.otherVariants = [
        ...(winner.otherVariants ?? []),
        { name: loser.name, sessions: loser.sessions.length, lastDate: loser.sessions[loser.sessions.length - 1].date },
      ];
    }
  }
  return out.sort((a, b) => (b.score?.score ?? -1) - (a.score?.score ?? -1));
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
