// ══════════════════════════════════════════
//  progressStats.js
//  The read-out the Progress screens are built from.
// ══════════════════════════════════════════
//
// One pass over the log producing everything the screens need, so no two panels
// can quietly disagree about what happened. `sessionsFor` is the primitive;
// everything else is a view of it.
//
// The judgements baked in here were all learned the hard way from real data:
//
//   - Compare at MATCHED LOAD. Estimated 1RM scored three improving lifts as
//     declines because a single heavy calibration set had inflated their baseline.
//   - Total reps only when the set count matched, otherwise the best single set —
//     moving two of three sets up in weight must not read as a loss.
//   - An exercise can opt out entirely with `excludeFromOverload` when its units
//     changed underneath the numbers.

import { setKey, dayKey, exerciseNoteKey } from './setKeys';
import { incrementFor, repRangeForSet, nextTarget } from './increments';
import { historyPeers } from './history';

const e1rm = (w, r) => w * (1 + r / 30);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// Every session this exercise was logged in, oldest first:
//   { week, dayId, date, note, sets: [{ si, reps, weight }], topLoad, bestE1rm, totalReps }
//
// Sessions come from every day carrying the exercise's `historyGroup`, not just
// `dayId` — the weighted crunch finisher runs on Push and on Pull and is one
// timeline. Storage stays per-day (see utils/history.js for why merging the keys
// would destroy data); only the reading is joined, and `dayId` rides along on each
// session so a caller can still tell the two apart.
export function sessionsFor(days, slice, dayId, ex, maxWeeks = 52) {
  const setData = slice?.setData ?? {};
  const out = [];
  for (const peer of historyPeers(days, dayId, ex)) {
    for (let week = 1; week <= maxWeeks; week++) {
      const date = slice?.workoutDates?.[dayKey(week, peer.dayId)];
      if (!date) continue;
      const sets = [];
      for (let si = 0; si < peer.ex.sets; si++) {
        const d = setData[setKey(week, peer.dayId, peer.ex, si)];
        if (!d?.done) continue;
        const reps = parseInt(d.reps, 10);
        const weight = parseFloat(d.weight);
        if (!(reps > 0)) continue;
        sets.push({ si, reps, weight: weight > 0 ? weight : null });
      }
      if (!sets.length) continue;
      const loaded = sets.filter((s) => s.weight !== null);
      out.push({
        week,
        dayId: peer.dayId,
        date,
        note: slice?.exerciseNotes?.[exerciseNoteKey(week, peer.dayId, peer.ex)] ?? '',
        sets,
        topLoad: loaded.length ? Math.max(...loaded.map((s) => s.weight)) : null,
        bestE1rm: loaded.length ? Math.max(...loaded.map((s) => e1rm(s.weight, s.reps))) : null,
        totalReps: sum(sets.map((s) => s.reps)),
      });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Sessions that may be compared with each other.
//
// `compareFrom` on an exercise marks the point where its numbers changed meaning —
// a rep convention, a different machine, a unit correction. Everything before is
// still shown on the graph, because it happened; it is simply not the same ruler.
// Without this, crossbody hammer curls anchored on 11/10/10 from before the
// convention changed and reported +0 for a session that was really +7.
export function comparable(ex, sessions) {
  if (ex.excludeFromOverload) return [];
  const from = ex.compareFrom;
  return from ? sessions.filter((s) => s.date >= from) : sessions;
}

// Matched-load comparison for one exercise, or null when nothing is comparable yet.
export function matchedLoad(ex, allSessions) {
  const sessions = comparable(ex, allSessions);
  if (sessions.length < 2) return null;
  const last = sessions[sessions.length - 1];
  if (!last.topLoad) return null;

  // Loads used in the latest session and in at least one earlier one. Requiring
  // the latest session stops a row going stale the moment a weight is left behind.
  const loadsNow = [...new Set(last.sets.filter((s) => s.weight).map((s) => s.weight))];
  const earlier = sessions.slice(0, -1);
  const usable = loadsNow.filter((w) => earlier.some((s) => s.sets.some((x) => x.weight === w))).sort((a, b) => b - a);
  if (!usable.length) return null;

  const load = usable[0];
  const at = (s) => s.sets.filter((x) => x.weight === load).map((x) => x.reps);
  const first = earlier.find((s) => at(s).length);
  const firstReps = at(first);
  const lastReps = at(last);
  const same = firstReps.length === lastReps.length;
  return {
    load,
    first: { date: first.date, reps: firstReps },
    latest: { date: last.date, reps: lastReps },
    basis: same ? 'total' : 'best',
    delta: same ? sum(lastReps) - sum(firstReps) : Math.max(...lastReps) - Math.max(...firstReps),
  };
}

// How close the last session came to a perfect one at that weight.
//   { total, max, short }  — reps done, reps possible, and the gap.
//
// TOTAL reps rather than every-set-at-the-top. Requiring all three sets to hit the
// ceiling sounds rigorous and in practice strands you: rear delt flys at 15/15/14
// is 44 of a possible 45 and would be told to hold, and dumbbell curls at 8/6/4
// would need the third set to nearly triple before the weight was allowed to move.
// Robbie's drop-off from set one to set three runs 35-50% on arm and shoulder
// isolation — steep, deliberate, and not something a progression rule should
// punish. Totals absorb that; per-set ceilings do not.
export function repProgress(ex, sessions) {
  const last = sessions[sessions.length - 1];
  if (!last) return null;
  // Only sets at the HEAVIEST load in the session count. Summing across weights
  // lets a lighter first set pad the total: 15 reps at 16.5 kg followed by 11 and
  // 10 at 18 kg added up to a full house and called 18 kg mastered, when the work
  // at 18 kg was 21 of a possible 24.
  const loaded = last.sets.filter((s) => s.weight);
  if (!loaded.length) return null;
  const topLoad = Math.max(...loaded.map((s) => s.weight));
  const atLoad = loaded.filter((s) => s.weight === topLoad);
  if (atLoad.length < 2) return null;
  const ranges = atLoad.map((s) => repRangeForSet(ex.reps, s.si)).filter(Boolean);
  if (ranges.length !== atLoad.length) return null;
  const max = sum(ranges.map((r) => r[1]));
  const total = sum(atLoad.map((s) => s.reps));
  // How many of the programmed sets actually reached the top load. A session that
  // ramped — 12 @ 80 kg then 12 and 11 @ 100 — has only TWO sets at 100, and
  // scoring 23 of a possible 24 called 100 kg mastered off two working sets.
  // Robbie spotted it on the leg press: "when lower weight is recorded than the
  // new calibrated weight it skews the suggested increase formula".
  return { load: topLoad, total, max, short: Math.max(0, max - total), setsAtLoad: atLoad.length, setsWanted: ex.sets };
}

// Ready when the session came within ONE rep of the maximum the range allows.
// The single rep of slack is the whole point: a rule that blocks a weight increase
// over one rep is measuring pedantry, not readiness.
export function isReadyToProgress(ex, sessions) {
  const p = repProgress(ex, sessions);
  // The load has to have been CARRIED for the whole exercise, not just topped on
  // the sets that reached it — see the ramp-set note in repProgress.
  return !!p && p.short <= 1 && p.setsAtLoad >= p.setsWanted;
}

// Same top load AND no reps gained across the last `window` sessions. Two sessions
// at the same numbers is a normal week; three is a plateau worth naming.
//
// TOTAL reps at that load, not the best set. Best set stops moving the moment it
// reaches the top of the rep range while the other sets are still climbing — rear
// delt flys ran 15/12/12 → 15/15/13 → 15/15/14, which is four reps gained, and a
// best-set test called it three sessions of nothing.
//
// An exercise that is ready for more weight is never stalled. It sat at the same
// load because the load was right, and it has now outgrown it.
export function isStalled(ex, allSessions, windowSize = 3) {
  const sessions = comparable(ex, allSessions);
  if (sessions.length < windowSize) return false;
  if (isReadyToProgress(ex, sessions)) return false;
  const recent = sessions.slice(-windowSize).filter((s) => s.topLoad);
  if (recent.length < windowSize) return false;
  if (!recent.every((s) => s.topLoad === recent[0].topLoad)) return false;
  const totals = recent.map((s) => sum(s.sets.filter((x) => x.weight === s.topLoad).map((x) => x.reps)));
  return Math.max(...totals) <= totals[0];
}

// Everything the Strength screen needs about one day's exercises.
export function workoutSummary(days, slice, dayId) {
  const day = (days ?? []).find((d) => d.id === dayId);
  if (!day) return null;
  const rows = (day.exercises ?? []).map((ex) => {
    const sessions = sessionsFor(days, slice, dayId, ex);
    return {
      ex,
      name: ex.name,
      sessions,
      matched: matchedLoad(ex, sessions),
      ready: isReadyToProgress(ex, sessions),
      reps: repProgress(ex, sessions),
      stalled: isStalled(ex, sessions),
      target: nextTarget(ex, sessions[sessions.length - 1]),
      increment: incrementFor(ex),
      excluded: !!ex.excludeFromOverload,
      comparedFrom: ex.compareFrom ?? null,
    };
  });
  return {
    day,
    rows: rows.filter((r) => r.sessions.length),
    untouched: rows.filter((r) => !r.sessions.length).length,
  };
}

// Personal bests as they happened, newest first. A PB is a best-estimated-1RM
// higher than anything before it — and the FIRST session of an exercise never
// counts, or every new movement would announce itself as a record.
export function personalBests(days, slice, limit = 12) {
  const events = [];
  for (const day of days ?? []) {
    for (const ex of day.exercises ?? []) {
      const sessions = comparable(ex, sessionsFor(days, slice, day.id, ex));
      if (!sessions.length) continue;
      let best = 0;
      sessions.forEach((s, i) => {
        if (!s.bestE1rm) return;
        if (i > 0 && s.bestE1rm > best + 0.01) {
          const top = s.sets.filter((x) => x.weight === s.topLoad);
          events.push({
            date: s.date,
            exercise: ex.name,
            focus: day.focus,
            load: s.topLoad,
            reps: Math.max(...top.map((x) => x.reps)),
            gainPct: ((s.bestE1rm - best) / best) * 100,
          });
        }
        best = Math.max(best, s.bestE1rm);
      });
    }
  }
  return events.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
