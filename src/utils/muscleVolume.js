// ══════════════════════════════════════════
//  muscleVolume.js
//  Three different questions about the same sets.
// ══════════════════════════════════════════
//
// Sets per muscle per week is the volume measure the training literature uses,
// and it is the only one that compares Push to Pull honestly — shrugs move 100 kg
// through a few centimetres and would dominate any tonnage chart, while a 12 kg
// lateral raise is brutal and barely registers.
//
// But volume is not strength. Doing eleven sets of biceps a week tells you what
// you asked of the muscle, not what it can now do. So this file computes three
// metrics from the same completed sets, and the UI lets you switch between them:
//
//   sets      — how much work the muscle was asked to do
//   tonnage   — kg moved (weight x reps), same caveat about leverage as above
//   strength  — best estimated 1RM seen that week, and how it has moved since
//               the first week with data
//
// A set counts 1.0 for each PRIMARY muscle and 0.5 for each SECONDARY one under
// sets and tonnage. The half is a convention, not a law — an indirect muscle does
// get real work, but counting it fully would make bench press look like a triceps
// session. STRENGTH ignores secondaries entirely: a bench press says nothing
// trustworthy about what your triceps could lift on their own.

import { setKey, dayKey } from './setKeys';

export const MUSCLE_LABELS = {
  chest: 'Chest',
  'front-delts': 'Front delts',
  'side-delts': 'Side delts',
  'rear-delts': 'Rear delts',
  triceps: 'Triceps',
  biceps: 'Biceps',
  forearms: 'Forearms',
  lats: 'Lats',
  'upper-back': 'Upper back',
  'lower-back': 'Lower back',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
};

export const METRICS = ['sets', 'tonnage', 'strength'];

export const METRIC_INFO = {
  sets: {
    label: 'Sets',
    unit: '',
    note: 'Completed sets per programme cycle — one full pass through Push, Pull and Legs, which is NOT one week. A set counts 1 for each muscle it targets directly and 0.5 for each it works indirectly. This is how much work you asked of the muscle, not how strong it is.',
  },
  tonnage: {
    label: 'Tonnage',
    unit: 'kg',
    note: 'Weight x reps over completed sets, split the same way. Useful within a muscle over time; across muscles it mostly measures leverage, so a shrug will always beat a lateral raise.',
  },
  strength: {
    label: 'Strength',
    unit: '%',
    note: 'Change in best estimated 1RM, using only exercises that train the muscle DIRECTLY and only weights you have trained at least twice — a one-off heavy try is not a baseline. Compares the best recent trained cycles for each muscle against its earliest, so a single light or substituted session cannot erase a real peak. Needs a few weeks before it means much.',
  },
};

export const SECONDARY_WEIGHT = 0.5;

// Epley. Fine at low reps, increasingly optimistic past about 12 — which is why
// this is reported as a percentage change rather than a number of kg.
const e1rm = (w, r) => w * (1 + r / 30);

// Loads that were TRAINED rather than tried, per exercise.
//
// One case matters: Robbie's 25 kg curl on day one. Five reps, never repeated, and
// because estimated 1RM takes the best set it became his biceps baseline — which
// made settling into a workable 20 kg read as -4% when he was in fact +16.7%.
//
// The rule is narrow on purpose. A load is discounted only when it is BOTH used for
// a single set in the whole log AND the heaviest that exercise has ever seen — a
// reach that was never repeated. A first draft simply required two sets at a weight
// and that was too blunt: it threw away his 21 Aug shrugs at 40 and 45 kg, one set
// each, which were ordinary working sets on the way up rather than reaches.
//
// STRENGTH only. Sets and tonnage are untouched — a probe was still real work.
function trainedLoads(days, slice, maxWeeks) {
  const setData = slice?.setData ?? {};
  const counts = new Map();
  const heaviest = new Map();
  for (let week = 1; week <= maxWeeks; week++) {
    for (const day of days ?? []) {
      if (!slice?.workoutDates?.[dayKey(week, day.id)]) continue;
      for (const ex of day.exercises ?? []) {
        for (let si = 0; si < ex.sets; si++) {
          const d = setData[setKey(week, day.id, ex, si)];
          if (!d?.done) continue;
          const w = parseFloat(d.weight);
          if (!(w > 0)) continue;
          const exKey = `${day.id}|${ex.name}`;
          counts.set(`${exKey}|${w}`, (counts.get(`${exKey}|${w}`) ?? 0) + 1);
          heaviest.set(exKey, Math.max(heaviest.get(exKey) ?? 0, w));
        }
      }
    }
  }
  return (dayId, ex, w) => {
    const exKey = `${dayId}|${ex.name}`;
    const once = (counts.get(`${exKey}|${w}`) ?? 0) < 2;
    return !(once && w >= (heaviest.get(exKey) ?? 0));
  };
}

// Which exercise actually got done — a swapped-in alternative trains its own
// muscles, so counting the primary would put volume on the wrong group.
function musclesFor(ex, swappedName) {
  if (swappedName && ex.alternative?.name === swappedName && ex.alternative.muscles) return ex.alternative.muscles;
  return ex.muscles;
}

// Returns one entry per programme CYCLE that has data, oldest first:
//   { week, dates: [], sets, tonnage, strength, totalSets }
// Only COMPLETED sets count.
//
// `week` is the store's counter, and it counts one full pass through the programme
// — not seven days. Robbie trains six days a week, so he completes two of these per
// calendar week and every figure here is per CYCLE, roughly half his weekly volume.
// `dates` is carried out so the UI can work out the real cadence from the log
// instead of assuming one cycle equals one week.
export function weeklyMuscleVolume(days, slice, maxWeeks = 52) {
  const setData = slice?.setData ?? {};
  const isTrained = trainedLoads(days, slice, maxWeeks);
  const out = [];

  for (let week = 1; week <= maxWeeks; week++) {
    const sets = {};
    const tonnage = {};
    const strength = {};
    // Which exercises actually fed each muscle this cycle. A cycle-on-cycle delta
    // is only a training change if both cycles were built from the same movements.
    const contributors = {};
    const dates = [];
    let totalSets = 0;
    let trained = false;

    for (const day of days ?? []) {
      const date = slice?.workoutDates?.[dayKey(week, day.id)];
      if (!date) continue;
      trained = true;
      dates.push(date);
      for (const ex of day.exercises ?? []) {
        let done = 0;
        let load = 0;
        let best = 0;
        for (let si = 0; si < ex.sets; si++) {
          const d = setData[setKey(week, day.id, ex, si)];
          if (!d?.done) continue;
          done++;
          const w = parseFloat(d.weight);
          const r = parseInt(d.reps, 10);
          if (w > 0 && r > 0) {
            load += w * r;
            if (isTrained(day.id, ex, w)) best = Math.max(best, e1rm(w, r));
          }
        }
        if (!done) continue;
        totalSets += done;
        const m = musclesFor(ex);
        for (const g of [...(m?.primary ?? []), ...(m?.secondary ?? [])]) {
          (contributors[g] ??= new Set()).add(ex.name);
        }
        for (const g of m?.primary ?? []) {
          sets[g] = (sets[g] ?? 0) + done;
          tonnage[g] = (tonnage[g] ?? 0) + load;
          if (best > 0) strength[g] = Math.max(strength[g] ?? 0, best);
        }
        for (const g of m?.secondary ?? []) {
          sets[g] = (sets[g] ?? 0) + done * SECONDARY_WEIGHT;
          tonnage[g] = (tonnage[g] ?? 0) + load * SECONDARY_WEIGHT;
        }
      }
    }

    if (trained) out.push({ week, dates: dates.sort(), sets, tonnage, strength, contributors, totalSets });
  }
  return out;
}

// Flattens the weeks into one ordering for display.
//
// sets/tonnage rank by the latest week — the question is "where is the work
// going right now". strength ranks by change instead, because the raw e1RM of a
// leg press and a lateral raise are not on the same scale and sorting by them
// would just list the exercises with the heaviest loads.
export function rankMuscles(weeks, metric = 'sets') {
  if (!weeks.length) return [];
  const key = METRICS.includes(metric) ? metric : 'sets';
  const lastWeek = weeks[weeks.length - 1];
  const prevWeek = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const last = lastWeek[key];
  const prev = prevWeek ? prevWeek[key] : null;

  // Same movements both cycles? Between cycles 7 and 8 Romanian Deadlifts were
  // added to Legs and chin-ups were skipped on Pull, so glutes read +2,145 and
  // biceps -620 — an exercise appearing or vanishing, not a training change. Nine
  // of twelve muscles were affected. A delta across that is not a comparison.
  const sameMovements = (group) => {
    if (!prevWeek) return false;
    const a = [...(prevWeek.contributors?.[group] ?? [])].sort();
    const b = [...(lastWeek.contributors?.[group] ?? [])].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  };
  const all = new Set(weeks.flatMap((w) => Object.keys(w[key])));

  const rows = [...all].map((group) => {
    const series = weeks.map((w) => w[key][group] ?? 0);
    const latest = last[group] ?? 0;

    // Strength compares the first trained cycle against the BEST of the two most
    // recent. Deliberately lopsided.
    //
    // The recent end needs smoothing because one session decides it: chest read
    // 0.0% because the newest cycle happened to be a machine substitution at 45 kg,
    // hiding a genuine 50 kg bench three days earlier. The baseline does not — it is
    // where you started, and a window there quietly eats the progress made in the
    // first fortnight. Smoothing both ends put upper back at 0.0% when shrugs had
    // gone 45 kg to 50 kg, because the second cycle was pulled in as the baseline.
    //
    // Cycles where the muscle was not trained are skipped — those are zeros, not a
    // baseline of zero, which is also why a muscle can appear here without having
    // been trained in the newest cycle.
    const trained = series.filter((v) => v > 0);
    const win = Math.min(2, trained.length);
    const firstSeen = trained.length ? trained[0] : 0;
    const recent = trained.length ? Math.max(...trained.slice(-win)) : 0;
    const changePct = key === 'strength' && firstSeen > 0 ? ((recent - firstSeen) / firstSeen) * 100 : null;
    return {
      group,
      label: MUSCLE_LABELS[group] ?? group,
      latest: key === 'strength' ? recent : latest,
      previous: prev ? (prev[group] ?? 0) : null,
      comparable: sameMovements(group),
      first: firstSeen,
      window: win,
      changePct,
      series,
    };
  });

  if (key === 'strength') {
    return rows
      .filter((r) => r.latest > 0)
      .sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity) || a.label.localeCompare(b.label));
  }
  return rows.sort((a, b) => b.latest - a.latest || a.label.localeCompare(b.label));
}
