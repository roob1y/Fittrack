// ══════════════════════════════════════════
//  recap.js
//  What happened in one session, in the words the recap and the share card use.
// ══════════════════════════════════════════
//
// Everything here is a read of the log after the day is marked complete. Each
// exercise the day asked for gets one row: what was done, how it compares with
// the previous session on the SAME exercise (a Smith session is compared with the
// last Smith session, never the barbell one — `via`), and a verdict word. The
// headline is built from the verdicts, so it always says something true.

import { setKey, dayKey } from './setKeys';
import { sessionsFor, personalBests } from './progressStats';
import { activeExercises } from './slots';
import { sessionTonnage } from './sessionStats';

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

function describeSets(sets, assisted) {
  if (!sets.length) return '';
  const loads = [...new Set(sets.map((s) => s.weight))];
  const reps = sets.map((s) => s.reps).join(' · ');
  if (loads.length === 1 && loads[0]) return `${reps} at ${loads[0]} kg${assisted ? ' effective' : ''}`;
  if (loads.length === 1) return `${reps} reps`;
  return sets.map((s) => (s.weight ? `${s.reps}@${s.weight}` : s.reps)).join(' · ');
}

// One exercise's row.
//   { name, via, sets, text, kind: 'up'|'reps'|'hold'|'down'|'new'|'skipped', delta, deltaText, pb }
function exerciseRow(days, slice, dayId, weekNum, ex, pbDates) {
  const all = sessionsFor(days, slice, dayId, ex);
  const idx = all.findIndex((s) => s.week === weekNum && s.dayId === dayId);
  const cur = idx >= 0 ? all[idx] : null;
  const name = cur?.via ?? ex.name;
  if (!cur) return { name, via: null, sets: [], text: 'Skipped', kind: 'skipped', delta: 0, deltaText: '', pb: false };

  const prev = all
    .slice(0, idx)
    .filter((s) => (s.via ?? null) === (cur.via ?? null))
    .pop();
  const pb = pbDates.has(`${ex.name}|${cur.date}`);
  const row = { name, via: cur.via ?? null, sets: cur.sets, text: describeSets(cur.sets, ex.assisted), pb };

  if (!prev) return { ...row, kind: 'new', delta: 0, deltaText: 'first session' };

  const curTop = cur.topLoad ?? 0;
  const prevTop = prev.topLoad ?? 0;
  if (curTop > prevTop) {
    return { ...row, kind: 'up', delta: curTop - prevTop, deltaText: `+${round(curTop - prevTop)} kg` };
  }
  if (curTop < prevTop) {
    return { ...row, kind: 'down', delta: curTop - prevTop, deltaText: `${round(curTop - prevTop)} kg` };
  }
  // Same load: compare reps at that load.
  const at = (s) => sum(s.sets.filter((x) => x.weight === s.topLoad || !s.topLoad).map((x) => x.reps));
  const d = at(cur) - at(prev);
  if (d > 0) return { ...row, kind: 'reps', delta: d, deltaText: `+${d} rep${d === 1 ? '' : 's'}` };
  if (d < 0) return { ...row, kind: 'down', delta: d, deltaText: `${d} rep${d === -1 ? '' : 's'}` };
  return { ...row, kind: 'hold', delta: 0, deltaText: 'held' };
}

const round = (v) => Math.round(v * 100) / 100;

function headline(rows) {
  const up = rows.filter((r) => r.kind === 'up').length;
  const reps = rows.filter((r) => r.kind === 'reps').length;
  const down = rows.filter((r) => r.kind === 'down').length;
  const pbs = rows.filter((r) => r.pb).length;
  const lifted = rows.filter((r) => r.kind !== 'skipped').length;
  const word = (n, s, p) => `${n === 1 ? 'One' : n === 2 ? 'Two' : n === 3 ? 'Three' : n} ${n === 1 ? s : p}`;
  if (up + reps === 0 && down === 0 && lifted > 0) {
    return rows.every((r) => r.kind === 'new' || r.kind === 'skipped') ? 'First one in the book.' : 'Held every line.';
  }
  const first =
    up > 0 ? `${word(up, 'lift', 'lifts')} up.` : reps > 0 ? `${word(reps, 'lift', 'lifts')} gained reps.` : '';
  const second =
    down === 0
      ? 'Nothing down.'
      : up + reps > 0
        ? `${word(down, 'slipped', 'slipped')}.`
        : `${word(down, 'lift', 'lifts')} slipped.`;
  const third = pbs > 0 ? ` ${word(pbs, 'new best', 'new bests')}.` : '';
  return `${first} ${second}${third}`.trim();
}

// The whole recap for one completed session.
export function sessionRecap(days, slice, dayId, weekNum, { equipment } = {}) {
  const day = (days ?? []).find((d) => d.id === dayId);
  if (!day) return null;
  const key = dayKey(weekNum, dayId);
  const setData = slice?.setData ?? {};
  const date = slice?.workoutDates?.[key] ?? null;
  const mins = slice?.sessionTimes?.[key] ?? null;

  const pbDates = new Set(personalBests(days, slice, 500).map((p) => `${p.exercise}|${p.date}`));
  const exs = activeExercises(day, { weekNum, dayId, setData, slotChoices: slice?.slotChoices ?? {}, equipment });
  const rows = exs.map((ex) => exerciseRow(days, slice, dayId, weekNum, ex, pbDates));

  const { tonnage, sets } = sessionTonnage(day, setData, weekNum);
  const setsTotal = sum(exs.map((ex) => ex.sets ?? 0));

  // The previous completed run of this day, for the stat deltas.
  let prev = null;
  for (let w = weekNum - 1; w >= 1; w--) {
    const k = dayKey(w, dayId);
    if (!slice?.completedDays?.[k] || !slice?.workoutDates?.[k]) continue;
    const t = sessionTonnage(day, setData, w);
    prev = {
      week: w,
      date: slice.workoutDates[k],
      mins: slice.sessionTimes?.[k] ?? null,
      tonnage: t.tonnage,
      sets: t.sets,
    };
    break;
  }

  // Number of sessions logged in this programme, and the 30-day count, for the footer.
  const dates = [...new Set(Object.values(slice?.workoutDates ?? {}))].filter(Boolean).sort();
  const sessionNumber = date ? dates.indexOf(date) + 1 : dates.length;

  return {
    day,
    date,
    mins,
    tonnage,
    sets,
    setsTotal,
    skipped: rows.filter((r) => r.kind === 'skipped').length,
    prev,
    rows,
    headline: headline(rows),
    sessionNumber,
    totalSessions: dates.length,
  };
}

// Top sets for the share card: the heaviest set of each lifted exercise, with the
// change against the earliest session of that exercise inside the last 30 days.
export function topSets(days, slice, dayId, weekNum, recap, limit = 4) {
  const day = recap?.day;
  if (!day) return [];
  const monthAgo = recap.date
    ? new Date(new Date(recap.date).getTime() - 30 * 86400000).toISOString().slice(0, 10)
    : null;
  const out = [];
  for (const ex of day.exercises ?? []) {
    const all = sessionsFor(days, slice, dayId, ex);
    const cur = all.find((s) => s.week === weekNum && s.dayId === dayId);
    if (!cur || !cur.topLoad) continue;
    const top = cur.sets.filter((s) => s.weight === cur.topLoad).sort((a, b) => b.reps - a.reps)[0];
    const earlier = all.filter(
      (s) =>
        s.date < cur.date && (!monthAgo || s.date >= monthAgo) && (s.via ?? null) === (cur.via ?? null) && s.topLoad,
    );
    const base = earlier[0];
    out.push({
      name: cur.via ?? ex.name,
      weight: cur.topLoad,
      reps: top?.reps ?? null,
      delta: base ? round(cur.topLoad - base.topLoad) : null,
      assisted: !!ex.assisted,
    });
  }
  return out.sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity) || b.weight - a.weight).slice(0, limit);
}

// Top-set history for one exercise (the charted one on the share card): last N
// sessions up to and including `upTo` — a recap opened on an old session must not
// chart the sessions that came after it.
export function topSetHistory(days, slice, dayId, ex, limit = 6, upTo = null) {
  const all = sessionsFor(days, slice, dayId, ex).filter((s) => s.topLoad && (!upTo || s.date <= upTo));
  const last = all[all.length - 1];
  const same = last ? all.filter((s) => (s.via ?? null) === (last.via ?? null)) : all;
  return same.slice(-limit).map((s) => {
    const top = s.sets.filter((x) => x.weight === s.topLoad).sort((a, b) => b.reps - a.reps)[0];
    return { date: s.date, weight: s.topLoad, reps: top?.reps ?? null };
  });
}
