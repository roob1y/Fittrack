// ══════════════════════════════════════════
//  planOverview.js
//  Every exercise in the plan, on one page, over time.
// ══════════════════════════════════════════
//
// Asked for 18 Sep: "a page available in the app to check on every workout in the
// plan to read easily the comparisons of each exercise laid out on one page".
//
// The Progress hub already answers this, but only one exercise at a time and three
// taps deep — Strength & Overload → a day → a lift. Twenty-two exercises is
// sixty-six taps to see how the programme is going. Nothing here computes anything
// new: `sessionsFor`, `matchedLoad`, `repProgress`, `isReadyToProgress`, `isStalled`
// and `nextTarget` all already exist and are already the source of the in-workout
// suggestion. This assembles them into one row per exercise so the page cannot
// disagree with the tile he sees in the gym.
//
// ⚠ THE TREND IS TOTAL REPS AT THAT SESSION'S TOP LOAD, at his choice, and that is
// the same rule the progression logic uses. It has one consequence that has to be
// drawn rather than hidden: **adding weight makes the line go DOWN.** 12/12/12 at
// 100 kg is 36 reps; 10/8/7 at 100 after a jump from 50 is 25. A rep line alone
// would show his best session of the block as a collapse. So every point carries
// its load, and a point where the load CHANGED is marked and labelled. The dip and
// the "↑ 110" sit on the same pixel, which is the only honest way to plot it.
//
// Three further things the series must respect, each already a documented scar:
//
//   - `compareFrom` marks where an exercise's numbers changed meaning — a rep
//     convention, a different machine, a unit fix. Those earlier sessions are NOT
//     plotted. A sparkline is 28 pixels tall with no axis; there is no room to show
//     that two halves of a line are measured against different rulers, so the
//     honest move is to drop them and say how many were dropped.
//   - `excludeFromOverload` opts an exercise out entirely. It gets a row and no line.
//   - Bodyweight lifts — push-ups, inverted rows — have no load at all. The series
//     is total reps, which for them is the whole story anyway.
//
// The range filter scopes the LINE only. The verdict, the matched-load delta and
// the stall check all read full history, for the same reason the other Progress
// screens do it this way: a filter must be a way to look at a stretch of time, not
// a way to change the answer.

import { sessionsFor, comparable, matchedLoad, repProgress, isReadyToProgress, isStalled } from './progressStats';
import { nextTarget, incrementFor } from './increments';
import { dayTiles } from './slots';
import { withinRange } from './dateRange';

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// One point per session: what the top load was and how many reps were done AT it.
// Sets below the top load are excluded on purpose — a ramp set padding the total
// is bug 24, and it is the reason the app ever told him a weight was mastered off
// two working sets.
export function seriesFor(sessions) {
  return (sessions ?? []).map((s) => {
    const loaded = s.sets.filter((x) => x.weight > 0);
    if (!loaded.length) {
      return { date: s.date, load: null, reps: s.totalReps, setsAtLoad: s.sets.length };
    }
    const load = Math.max(...loaded.map((x) => x.weight));
    const atLoad = loaded.filter((x) => x.weight === load);
    return { date: s.date, load, reps: sum(atLoad.map((x) => x.reps)), setsAtLoad: atLoad.length };
  });
}

// Where the load moved between consecutive points, so the chart can mark it and
// the footer can name it. Returns the LAST change, which is the one that explains
// the shape of the recent line.
export function lastLoadChange(points) {
  for (let i = points.length - 1; i > 0; i--) {
    const now = points[i].load;
    const prev = points[i - 1].load;
    if (now != null && prev != null && now !== prev) {
      return { from: prev, to: now, date: points[i].date, index: i, up: now > prev };
    }
  }
  return null;
}

// One exercise's row.
export function exerciseRow(days, slice, dayId, ex, rangeId) {
  const all = sessionsFor(days, slice, dayId, ex);
  if (!all.length) return null;

  const cmp = comparable(ex, all);
  const points = seriesFor(cmp);
  const shown = withinRange(points, rangeId);

  const latest = all[all.length - 1];
  const progress = repProgress(ex, all);
  const target = nextTarget(ex, latest);

  return {
    ex,
    dayId,
    name: ex.name,
    sessions: all.length,
    // Sessions real enough to have happened but not comparable to today's numbers.
    droppedByCompareFrom: all.length - cmp.length,
    excluded: !!ex.excludeFromOverload,
    points: shown,
    hiddenByRange: points.length - shown.length,
    latest,
    current: progress ? progress.load : (latest.topLoad ?? null),
    progress,
    matched: matchedLoad(ex, all),
    ready: isReadyToProgress(ex, all),
    stalled: isStalled(ex, all),
    target,
    increment: incrementFor(ex),
    loadChange: lastLoadChange(points),
  };
}

// The whole plan: one entry per day, tiles in programme order, slot-mates kept
// together so two leg presses read as one movement on two machines rather than as
// two different things to do. Both options keep their own row — they have genuinely
// separate histories, and that is the entire reason the split exists.
export function planOverview(days, slice, rangeId) {
  return (days ?? []).map((day) => {
    const tiles = dayTiles(day)
      .map((tile) => {
        const rows = tile.options.map((ex) => exerciseRow(days, slice, day.id, ex, rangeId)).filter(Boolean);
        return rows.length ? { slot: tile.slot, rows } : null;
      })
      .filter(Boolean);
    const rows = tiles.flatMap((t) => t.rows);
    return {
      day,
      tiles,
      count: rows.length,
      untouched: (day.exercises ?? []).length - rows.length,
      readyCount: rows.filter((r) => r.ready).length,
      stalledCount: rows.filter((r) => r.stalled).length,
    };
  });
}
