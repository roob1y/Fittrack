// ══════════════════════════════════════════
//  increments.js
//  What the gym can actually make.
// ══════════════════════════════════════════
//
// A weight graph drawn on a continuous axis is quietly dishonest. It puts ticks at
// 17.3 kg and draws a slope between two points that are, in the room, one pin hole
// apart. Every machine has a smallest step it can make, and a strength chart is
// really a chart of how many of those steps you have climbed.
//
// The steps below are read off Robbie's own logs rather than assumed:
//
//   cable stack     1.5  — his loads run 12, 13.5, 15, 16.5, 18
//   dumbbells       2.0  — PAIR totals, so 1 kg a hand: 12, 14, 16
//   assisted chin   7.0  — 49 and 42 are adjacent settings on that stack
//   barbell         2.5  — the smallest pair of plates worth having, 2 x 1.25
//   hack squat      2.5  — plate-loaded, so the same plates as the bar
//
// PLATE-LOADED equipment inherits the barbell's step, because it is loaded with the
// barbell's plates. Only genuine weight STACKS have their own granularity, and the
// numbers below for those are assumptions until measured in the gym.
//
// An exercise can override with `increment` in program.js when its machine is odd.
// Otherwise the first piece of equipment with a known step wins — which is why
// benches and racks are absent from the table rather than set to null: a
// 'Flat Bench' in the list must fall through to the 'Barbell' beside it.

export const EQUIPMENT_INCREMENT = {
  'Assisted Chin/Dip Machine': 7,
  'Cable Machine': 1.5,
  Dumbbells: 2,
  Barbell: 2.5,
  'Leg Press Machine': 10,
  // Plate-loaded, confirmed by Robbie 31 Aug — so it takes the same plates as a
  // barbell and has the same granularity: a pair of 1.25s. It was 10 (predicting
  // 4 reps against an 8-12 range), then 5, before he said what the machine is.
  'Hack Squat Machine': 2.5,
  'Calf Press Machine': 10,
  'Leg Curl Machine': 5,
  'Leg Extension Machine': 5,
  'Chest Fly Machine': 5,
  'Chest Press Machine': 5,
  'Lat Pulldown Machine': 5,
  'Chest Supported Row Machine': 5,
};

// The smallest weight change this exercise can actually make, or null for
// bodyweight movements where the question does not apply.
export function incrementFor(ex) {
  if (ex?.increment != null) return ex.increment;
  for (const e of ex?.equipment ?? []) {
    if (EQUIPMENT_INCREMENT[e] != null) return EQUIPMENT_INCREMENT[e];
  }
  return null;
}

export const roundToStep = (v, step) => (step > 0 ? Math.round(v / step) * step : v);
const floorToStep = (v, step) => (step > 0 ? Math.floor(v / step) * step : v);
const ceilToStep = (v, step) => (step > 0 ? Math.ceil(v / step) * step : v);

// Tidy a float that has been through a chain of multiplications — 16.499999999.
export const tidy = (v) => Math.round(v * 100) / 100;

// Axis ticks that land on real stack positions.
//
// Returns { min, max, ticks: [] } covering the data with at least one step of
// headroom either side, then thinned to at most `maxTicks` by taking every 2nd,
// 3rd … step. Thinning by whole steps rather than recomputing a "nice" interval is
// the point: every gridline stays a weight the machine can make.
export function axisTicks(values, step, maxTicks = 5) {
  const vals = values.filter((v) => Number.isFinite(v));
  if (!vals.length) return { min: 0, max: 1, ticks: [] };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);

  if (!(step > 0)) {
    const pad = (hi - lo || 1) * 0.1;
    return { min: lo - pad, max: hi + pad, ticks: [lo, hi] };
  }

  let min = floorToStep(lo, step) - step;
  let max = ceilToStep(hi, step) + step;
  if (min < 0 && lo >= 0) min = 0;
  if (max === min) max = min + step;

  const stepCount = Math.round((max - min) / step);
  const every = Math.max(1, Math.ceil(stepCount / (maxTicks - 1)));
  const ticks = [];
  for (let i = 0; i <= stepCount; i += every) ticks.push(tidy(min + i * step));
  const last = tidy(max);
  if (ticks[ticks.length - 1] !== last) ticks.push(last);
  return { min, max, ticks };
}

// Reps to expect at a new weight, holding estimated 1RM constant.
//
//   Epley:  e1RM = w * (1 + r/30)
//   so at w2:  r2 = 30 * ( w1/w2 * (1 + r1/30) - 1 )
//
// Rough, and increasingly so above about 12 reps where Epley starts flattering the
// lifter. It is used only to set an expectation for the next session, never to
// score one — a prediction that is a rep or two out still tells you whether the
// jump lands inside your range or well under it.
// "an 8% step", "a 17% step" — 8, 11 and 18 are the ones that take "an".
const article = (n) => (/^(8|11|18)/.test(String(n)) ? 'an' : 'a');

export function expectedReps(w1, r1, w2) {
  if (!(w1 > 0) || !(w2 > 0) || !(r1 > 0)) return null;
  return Math.max(0, Math.round(30 * ((w1 / w2) * (1 + r1 / 30) - 1)));
}

// `reps` is per-set and slash-separated: '8-12/8-12/8-12' or a bare '12-15'.
export function repRangeForSet(repsField, setIndex) {
  const parts = String(repsField ?? '').split('/');
  const part = (parts[setIndex] ?? parts[parts.length - 1] ?? '').trim();
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(part);
  if (range) return [Number(range[1]), Number(range[2])];
  const one = /^(\d+)$/.exec(part);
  return one ? [Number(one[1]), Number(one[1])] : null;
}

// What to aim for next time, as an instruction rather than a history lesson.
//
//   { verdict: 'add' | 'reps' | 'hold', load, nextLoad, topOfRange, note }
//
// `add` — every set topped its range, so the load is the thing to change, and
//   `nextLoad` is one real step up, never a number the stack cannot make.
// `reps` — the load is right and there are reps still to win at it.
// `hold` — the last session came in under range, which usually means a weight was
//   just added. Nothing to change; let it settle.
// An equipment ceiling — the heaviest weight he can SAFELY use for this exercise,
// in the same units he logs. Weighted crunches are the first: 20 kg is the heaviest
// dumbbell that is safe to hold on his chest, and the app flagged "due a weight
// increase" at 20 kg on four straight sessions because nothing knew that. A rule
// that can only ever say "add weight" is wrong the moment there is none to add.
export function ceilingFor(ex) {
  const m = Number(ex?.maxWeight);
  return m > 0 ? m : null;
}
export function atCeiling(ex, load) {
  const m = ceilingFor(ex);
  return m != null && Number(load) >= m;
}
// One real step up, but never past the ceiling. A step that would overshoot lands
// ON the ceiling (18 → 20, not 18 → 22); at the ceiling there is no next load.
export function nextLoadFor(ex, load) {
  const step = incrementFor(ex);
  if (!(step > 0)) return null;
  const m = ceilingFor(ex);
  if (m == null) return tidy(load + step);
  if (load >= m) return null;
  return tidy(Math.min(load + step, m));
}

export function nextTarget(ex, lastSession) {
  const sets = (lastSession?.sets ?? []).filter((s) => s.reps > 0 && s.weight > 0);
  if (!sets.length) return null;

  const load = Math.max(...sets.map((s) => s.weight));
  const atLoad = sets.filter((s) => s.weight === load);
  const ranges = atLoad.map((s, i) => repRangeForSet(ex.reps, s.si ?? i)).filter(Boolean);
  if (!ranges.length) return null;

  const top = Math.max(...ranges.map((r) => r[1]));
  const bottom = Math.min(...ranges.map((r) => r[0]));
  const step = incrementFor(ex);
  // Total reps against the most the range allows, with one rep of slack — see
  // repProgress in progressStats.js for why this is not per-set ceilings.
  const maxReps = ranges.reduce((a, r) => a + r[1], 0);
  const doneReps = atLoad.reduce((a, s) => a + s.reps, 0);
  const short = Math.max(0, maxReps - doneReps);
  // The load has to have been CARRIED for every programmed set, not merely topped
  // on the sets that got there. A ramped session — 12 @ 80 kg, then 12 and 11 @
  // 100 — puts only two sets at the top load, and 23 of a possible 24 read as
  // "you have this weight" off two working sets. Robbie found it on the leg press:
  // "when lower weight is recorded than the new calibrated weight it skews the
  // suggested increase formula". He is right, and it inflates every exercise he
  // ramps into rather than starting flat.
  const carried = atLoad.length >= (ex.sets ?? atLoad.length);
  const capped = atCeiling(ex, load);
  const upNext = nextLoadFor(ex, load);

  // Earned an increase, but this is already the heaviest safe weight. Say so plainly
  // instead of suggesting a load he does not have.
  if (short <= 1 && carried && capped) {
    return {
      verdict: 'ceiling',
      load,
      nextLoad: null,
      topOfRange: top,
      done: doneReps,
      max: maxReps,
      note:
        `${doneReps} of ${maxReps} reps at ${load} kg — the top of your range at the heaviest weight you can ` +
        `safely use here. No increase to make: keep the reps clean, or slow the lowering to keep it working.`,
    };
  }

  if (short <= 1 && carried && step > 0) {
    const nextLoad = upNext;
    const bestReps = Math.max(...atLoad.map((s) => s.reps));
    const jumpPct = ((nextLoad - load) / load) * 100;
    const expect = expectedReps(load, bestReps, nextLoad);
    // On light loads the smallest step the gym owns is still a big RELATIVE jump —
    // 2 kg on a 12 kg dumbbell is 17%, and the reps fall accordingly. Saying so is
    // the difference between an expected dip and looking like a bad session.
    const undershoots = expect < bottom;
    return {
      verdict: 'add',
      load,
      nextLoad,
      topOfRange: top,
      done: doneReps,
      max: maxReps,
      expect,
      jumpPct,
      note:
        `${doneReps} of ${maxReps} reps at ${load} kg — you have this weight. ` +
        `${nextLoad} kg is ${article(Math.round(jumpPct))} ${Math.round(jumpPct)}% step, so expect about ${expect} reps` +
        (undershoots
          ? `. That is under your ${bottom}-${top} range and it is meant to be — it will take a session or two to climb back.`
          : `, still inside ${bottom}-${top}.`),
    };
  }
  // A session that topped its range on a ramp needs the load carrying for the full
  // set count before it counts, and saying so is more useful than a bare rep total.
  if (short <= 1 && !carried) {
    return {
      verdict: 'reps',
      load,
      nextLoad: upNext,
      topOfRange: top,
      done: doneReps,
      max: maxReps,
      setsAtLoad: atLoad.length,
      setsWanted: ex.sets,
      note:
        `${doneReps} of ${maxReps} reps at ${load} kg, but only ${atLoad.length} of ${ex.sets} sets were at that ` +
        `weight. Carry ${load} kg for all ${ex.sets} before adding — a lighter opening set flatters the total.`,
    };
  }

  return {
    verdict: 'reps',
    load,
    nextLoad: upNext,
    topOfRange: top,
    done: doneReps,
    max: maxReps,
    setsAtLoad: atLoad.length,
    setsWanted: ex.sets,
    note: `${doneReps} of ${maxReps} reps at ${load} kg. ${short} more${
      upNext != null ? ` and it is ${upNext} kg` : ''
    }.`,
  };
}
