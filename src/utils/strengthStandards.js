// ══════════════════════════════════════════
//  strengthStandards.js
//  Where a lift sits against other people.
// ══════════════════════════════════════════
//
// Requested 8 Sep: a score "related to the average strength of a person of my
// size". Two scales, shown side by side, because they answer different questions
// and the gap between them is the most informative thing here:
//
//   LOGGED     percentile among people who log lifts to Strength Level
//              (48.7M lifts, Mar 2015 – Mar 2026). Beginner = stronger than 5%,
//              Novice 20%, Intermediate 50%, Advanced 80%, Elite 95%.
//   UNTRAINED  what a man that size lifts having never trained.
//
// They are NOT the same population and the difference is not small: a 63 kg bench
// at 90 kg bodyweight is simultaneously "the average untrained man" and "the 5th
// percentile of gym-app users". Anyone who logs their lifts to a strength app is a
// heavily self-selected group. Reporting only the logged scale would tell him he is
// weaker than he is; reporting only the untrained scale would flatter him.
//
// ⚠ FOUR THINGS THAT MAKE A STANDARD WRONG, the first three of which have already
// bitten this project once:
//
//   1. DUMBBELL STANDARDS ARE PER HAND. Robbie logs PAIR TOTALS. Every dumbbell
//      comparison halves his logged weight first. Getting this backwards is the
//      same error as the corrected-backup doubling and the per-hand lateral raises.
//   2. MACHINES AND CABLES HAVE NO PORTABLE STANDARD. A cable stack number means
//      something different on every machine — his own has a hidden 1.5 kg plate and
//      two leg presses that disagree with each other. Those lifts score `null`.
//      Never guess one.
//   3. EPLEY IS UNRELIABLE ABOVE ~12 REPS, so the reps used are CAPPED AT 12.
//      Robbie spotted the consequence on 8 Sep — "are you taking into
//      consideration the amount of reps and sets". Reps feed the estimate, and his
//      lifts have different rep targets by design, so the high-rep ones were being
//      systematically flattered: shrugs and lateral raises, both programmed at
//      12-15, were his top two scores off 15-rep sets, while bench at 6-8 got no
//      such boost. Part of that ranking was the rep scheme rather than strength.
//      Capping under-claims rather than over-claims and puts every lift on the
//      same footing; sets above the cap still come back `approx: true`.
//
//   4. A BODYWEIGHT LIFT IS SCORED IN ADDED WEIGHT, NOT TOTAL LOAD. The published
//      chin-up table is what you hang off a belt: +36 kg at Intermediate, and a
//      NEGATIVE figure means you still need assistance. Robbie's assisted chin-ups
//      store the effective load (bodyweight minus the stack), so the comparable
//      number is that load's e1RM MINUS bodyweight — which is negative for him
//      today, and correctly so. Scoring the total load against that table instead
//      would have read 76 kg against a +36 kg threshold and called him Elite.
//      `bodyweightRelative: true` marks those; their thresholds can be zero or
//      negative, which is why the sub-Beginner branch of the bar maths does not
//      divide by the first threshold.
//
// Tables are the published figures at 85 / 90 / 95 kg, interpolated linearly for
// bodyweights between them and clamped outside. Sourced 8 Sep 2026 from
// strengthlevel.com (chin-up and Romanian deadlift added 15 Sep, cross-checked
// against the same tables in lb so a mistyped row could not pass silently); the
// untrained bench multiple from the ExRx-aligned figures at strengthmath.com.
// Machine and cable tables were added 18 Sep at Robbie's request ("I really want
// there to be one") — Strength Level publishes standards for far more lifts than
// its index shows. They ARE community data for that machine type, so they are
// real standards, but a stack number still means something different on every
// machine, so every one of them carries `proxy` naming the table it was scored
// on and comes back `approx: true`. Bodyweight-rep lifts (push-ups, inverted rows)
// use `repsBased` tables: the value is the best set's rep count, not a 1RM.
// **Anything still not listed here has no standard — say so rather than estimate.**
//
// ⚠ THE HACK SQUAT IS SCORED ON PLATES ONLY, AND HERE IS THE EVIDENCE. Strength
// Level's hack squat page never says whether the community logs the carriage or
// only the plates, and the answer is worth a whole level to Robbie: his 100 kg of
// plates is 148 kg with the 48 kg sled he measured on 12 Sep. The published tables
// settle it. If the figures included a fixed carriage, hack squat minus back squat
// would be roughly constant across the levels. At 90 kg bodyweight it is not:
//
//   level         squat   hack   difference   ratio
//   Beginner         87     74          -13    0.85
//   Novice          115    115            0    1.00
//   Intermediate    148    168          +20    1.14
//   Advanced        186    232          +46    1.25
//   Elite           226    302          +76    1.34
//
// A constant offset would show a flat difference column. Instead the RATIO is what
// behaves, climbing 0.85 → 1.34 — the shape you get from plates on a ~45° sled,
// where roughly 0.7x of the plate weight reaches the legs, so a confident lifter
// loads about 1.4x their squat. The Beginner row clinches it: 74 kg including a
// 48 kg carriage would mean a 5th-percentile lifter putting 26 kg of plates on a
// machine while back-squatting 87 kg. Nobody does that. And nobody knows their
// carriage weight anyway — Robbie did not until 12 Sep ("I only counted the
// weights i added"), which is exactly what everyone logging to that site is doing.
//
// So `sledWeight` in program.js stays OUT of this comparison. It is the honest
// description of what he pressed; the standard compares log against log. If that
// turns out to be wrong, the fix is to add the sled before scoring — one line in
// scoreExercise — not to change the table.

export const LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
export const PERCENTILES = { Beginner: 5, Novice: 20, Intermediate: 50, Advanced: 80, Elite: 95 };

// perHand: the published numbers are for ONE dumbbell, so a pair total is halved
// before comparison. bodyweights: the rows the table was read off.
const T = (perHand, rows) => ({ perHand, bodyweights: [85, 90, 95], rows });

export const STANDARDS = {
  'Bench Press': {
    ...T(false, [
      [60, 80, 104, 130, 158],
      [65, 85, 109, 137, 165],
      [69, 90, 115, 143, 172],
    ]),
    // ExRx-aligned bodyweight multiples: untrained 0.7x, novice 1.0x, intermediate 1.5x.
    untrained: 0.7,
  },
  'Seated Dumbbell Shoulder Press': T(true, [
    [16, 24, 33, 44, 56],
    [18, 25, 35, 46, 59],
    [19, 27, 37, 48, 61],
  ]),
  'Dumbbell Lateral Raises': T(true, [
    [6, 10, 17, 26, 35],
    [6, 11, 18, 27, 37],
    [6, 12, 19, 28, 38],
  ]),
  'Dumbbell Shrugs': T(true, [
    [18, 30, 46, 66, 88],
    [20, 32, 49, 69, 91],
    [21, 34, 51, 72, 94],
  ]),
  'Dumbbell Curls': T(true, [
    [9, 15, 23, 33, 44],
    [9, 16, 24, 34, 45],
    [10, 16, 25, 35, 47],
  ]),
  // ADDED WEIGHT, not total load — see note 4 in the header. A negative threshold
  // is the table's own way of saying "you are not doing one unassisted yet".
  'Assisted Chin-Ups': {
    ...T(false, [
      [0, 16, 35, 56, 77],
      [0, 17, 36, 57, 79],
      [-1, 17, 37, 58, 80],
    ]),
    bodyweightRelative: true,
  },
  // Barbell only. The machine entry is a different lift with its own history and
  // no portable standard — the machine carries the bar path, which is most of
  // what makes the barbell version hard.
  'Romanian Deadlifts (Barbell)': T(false, [
    [70, 98, 132, 171, 213],
    [75, 104, 139, 179, 221],
    [80, 110, 145, 186, 230],
  ]),
  // Plates only — the reasoning is in the header. The one machine lift with a
  // standard here, and only because the published table could be shown to use the
  // same convention he does.
  'Hack Squats': T(false, [
    [69, 109, 161, 223, 291],
    [74, 115, 168, 232, 302],
    [79, 121, 176, 241, 312],
  ]),

  // ── Added 18 Sep 2026, strengthlevel.com, male kg tables at 85/90/95 ──────
  // Machine and cable lifts: real community tables, but stacks differ, so `proxy`.
  // Dumbbell tables are per hand as ever; pair totals are halved in scoreExercise.

  // Push
  'Smith Machine Chest Press': {
    ...T(false, [
      [57, 76, 100, 126, 154],
      [61, 81, 105, 132, 161],
      [65, 85, 110, 138, 167],
    ]),
    proxy: 'Smith machine bench press',
  },
  'Incline Dumbbell Press': T(true, [
    [23, 32, 42, 53, 65],
    [25, 33, 44, 55, 68],
    [27, 35, 46, 58, 71],
  ]),
  'Chest Flyes': {
    ...T(false, [
      [46, 67, 93, 124, 158],
      [49, 71, 98, 130, 164],
      [52, 74, 102, 135, 170],
    ]),
    proxy: 'machine chest fly',
  },
  'Shoulder Press (Machine)': {
    ...T(false, [
      [32, 53, 81, 114, 152],
      [35, 57, 86, 120, 158],
      [38, 61, 90, 125, 164],
    ]),
    proxy: 'machine shoulder press',
  },
  'Cable Tricep Pushdowns': {
    ...T(false, [
      [23, 39, 59, 83, 111],
      [25, 41, 62, 87, 115],
      [27, 43, 65, 90, 118],
    ]),
    proxy: 'tricep pushdown',
  },
  'Cable Overhead Tricep Extensions': {
    ...T(false, [
      [16, 29, 46, 67, 91],
      [18, 31, 48, 70, 94],
      [19, 33, 51, 73, 98],
    ]),
    proxy: 'cable overhead tricep extension',
  },
  // A dumbbell held to the chest is not a cable stack, but both are loaded trunk
  // flexion and the cable crunch is the only weighted-crunch table published.
  'Optional Finisher — Weighted Crunches': {
    ...T(false, [
      [27, 46, 70, 100, 133],
      [29, 48, 73, 103, 136],
      [30, 50, 75, 106, 140],
    ]),
    proxy: 'cable crunch',
  },

  // Pull
  // Bodyweight reps: the table is reps in one set, so the value is his best set.
  'Inverted Barbell Rows': {
    ...T(false, [
      [0, 9, 19, 32, 45],
      [0, 9, 19, 31, 44],
      [0, 9, 19, 30, 43],
    ]),
    repsBased: true,
    proxy: 'inverted row (reps)',
  },
  // Transcribed 19 Sep from strengthlevel.com/strength-standards/seated-cable-row/kg
  // (711k lifts). A stack number is still machine-specific, hence ≈.
  'Seated Cable Row': {
    ...T(false, [
      [50, 69, 91, 117, 145],
      [53, 72, 96, 122, 150],
      [56, 76, 100, 127, 155],
    ]),
    proxy: 'seated cable row',
  },
  'Dumbbell Rear Delt Flys': T(true, [
    [4, 10, 18, 30, 44],
    [4, 10, 19, 31, 45],
    [5, 11, 20, 32, 47],
  ]),
  'Crossbody Hammer Curls': T(true, [
    [12, 18, 25, 34, 44],
    [12, 19, 27, 36, 46],
    [13, 20, 28, 37, 48],
  ]),
  'Incline Bench Curls': T(true, [
    [10, 15, 21, 27, 34],
    [11, 16, 22, 28, 36],
    [12, 17, 22, 29, 37],
  ]),

  // Legs
  'Leg Press (Plates)': {
    ...T(false, [
      [118, 173, 243, 324, 412],
      [127, 184, 255, 338, 429],
      [135, 194, 268, 353, 444],
    ]),
    proxy: 'sled leg press',
  },
  'Leg Press (Machine)': {
    ...T(false, [
      [82, 126, 183, 251, 325],
      [87, 133, 191, 260, 335],
      [92, 139, 198, 269, 345],
    ]),
    proxy: 'horizontal leg press',
  },
  // Decided 18 Sep: the machine RDL scores on the barbell table. He is moving to a
  // barbell RDL anyway, and one history on one standard beats two half-histories.
  'Romanian Deadlifts (Machine)': {
    ...T(false, [
      [70, 98, 132, 171, 213],
      [75, 104, 139, 179, 221],
      [80, 110, 145, 186, 230],
    ]),
    proxy: 'barbell Romanian deadlift',
  },
  'Leg Extensions': {
    ...T(false, [
      [51, 76, 108, 145, 186],
      [53, 79, 111, 149, 191],
      [56, 82, 115, 154, 196],
    ]),
    proxy: 'leg extension',
  },
  'Leg Curls': {
    ...T(false, [
      [41, 61, 86, 116, 148],
      [44, 64, 90, 120, 152],
      [46, 67, 93, 123, 157],
    ]),
    proxy: 'seated leg curl',
  },
  // Both calf entries score on the sled table — see the note on the leg-press one.
  'Calf Press': {
    ...T(false, [
      [92, 146, 217, 301, 394],
      [100, 156, 229, 315, 410],
      [108, 166, 240, 329, 426],
    ]),
    proxy: 'sled press calf raise',
  },

  // ── Alternatives in the v2 programme, so a substituted session still scores ──
  // (A substitution logs under the primary's key today, so these are used only
  // when an alternative is promoted to its own exercise. Resistance Band
  // Pushdowns has no table anywhere — a band has no load number to compare.)
  'Goblet Squats': T(false, [
    [16, 28, 43, 61, 82],
    [17, 29, 44, 63, 84],
    [18, 30, 46, 65, 86],
  ]),
  'Dumbbell Romanian Deadlifts': T(true, [
    [20, 32, 46, 63, 82],
    [22, 34, 48, 66, 85],
    [23, 35, 51, 69, 88],
  ]),
  'Barbell Back Squat': T(false, [
    [81, 108, 140, 177, 216],
    [87, 115, 148, 186, 226],
    [93, 121, 156, 194, 235],
  ]),
  'Chest Supported Row': {
    ...T(false, [
      [51, 77, 110, 148, 191],
      [54, 81, 115, 155, 198],
      [58, 86, 120, 161, 205],
    ]),
    proxy: 'machine row',
  },
  'Lat Pulldowns': {
    ...T(false, [
      [50, 67, 88, 112, 137],
      [52, 70, 92, 116, 142],
      [55, 73, 95, 120, 146],
    ]),
    proxy: 'lat pulldown',
  },
  'Cable Rear Delt Fly': {
    ...T(false, [
      [3, 11, 23, 41, 62],
      [4, 12, 25, 42, 64],
      [4, 12, 26, 44, 66],
    ]),
    proxy: 'cable reverse fly',
  },
  'Barbell Curls': T(false, [
    [23, 35, 49, 65, 84],
    [25, 36, 51, 68, 87],
    [26, 38, 53, 71, 89],
  ]),
  'Barbell Shrugs': T(false, [
    [59, 92, 135, 185, 241],
    [65, 99, 143, 195, 253],
    [70, 106, 151, 205, 264],
  ]),
  'Incline Dumbbell Flys': T(true, [
    [11, 18, 27, 38, 51],
    [12, 19, 29, 40, 53],
    [13, 21, 30, 42, 55],
  ]),
  'Cable Lateral Raise': {
    ...T(false, [
      [3, 9, 17, 28, 40],
      [4, 9, 18, 29, 41],
      [4, 10, 18, 29, 43],
    ]),
    proxy: 'cable lateral raise',
  },
  'Barbell Overhead Press': T(false, [
    [36, 49, 66, 85, 106],
    [38, 53, 70, 90, 111],
    [41, 56, 74, 94, 115],
  ]),
  // Published per dumbbell in one hand; a single bell in both hands scores on it
  // as a proxy rather than not at all.
  'Dumbbell Overhead Tricep Extension': {
    ...T(false, [
      [7, 13, 23, 35, 49],
      [7, 14, 24, 37, 51],
      [8, 15, 26, 38, 53],
    ]),
    proxy: 'dumbbell tricep extension',
  },
  // He does this on the selectorised leg press, not a 45° plate sled (18 Sep).
  // Scored first on the machine calf raise table, which called 140 kg × 15
  // Intermediate — he said that was plainly inflated, and he is right: a calf
  // press on a leg press has a tiny range of motion and the whole stack goes,
  // which is exactly the population behind Strength Level's "sled press calf
  // raise" table (the same movement, logged as plates on an angled sled). That
  // table runs ~50% heavier and reads him as Novice. It is the closer match in
  // MOVEMENT even though his load is a stack rather than plates; if the machine
  // ever changes, this is the line to revisit.
  'Calf Press on Leg Press': {
    ...T(false, [
      [92, 146, 217, 301, 394],
      [100, 156, 229, 315, 410],
      [108, 166, 240, 329, 426],
    ]),
    proxy: 'sled press calf raise',
  },
};

const lerp = (a, b, t) => a + (b - a) * t;

// The five level thresholds at a given bodyweight, in the table's own units.
export function thresholdsFor(exName, bodyweightKg) {
  const std = STANDARDS[exName];
  if (!std || !(bodyweightKg > 0)) return null;
  const [lo, mid, hi] = std.bodyweights;
  const bw = Math.min(hi, Math.max(lo, bodyweightKg));
  const [rLo, rMid, rHi] = std.rows;
  const [from, to, t] = bw <= mid ? [rLo, rMid, (bw - lo) / (mid - lo)] : [rMid, rHi, (bw - mid) / (hi - mid)];
  return from.map((v, i) => Math.round(lerp(v, to[i], t) * 10) / 10);
}

// Epley, the same estimator the rest of the app uses, with the rep cap above.
const REP_CAP = 12;
const e1rm = (w, r) => w * (1 + Math.min(r, REP_CAP) / 30);

// Score one exercise from its sessions.
//
//   { value, unit, level, nextLevel, toNext, percentile, approx, bodyweightRatio,
//     untrainedRatio, setsAtValue, setsProgrammed }
//
// SETS are deliberately NOT folded into the score: the published standards are
// 1RM figures, so adding set count would produce a number that no longer means
// the same thing as the thing it is compared against. They are reported beside it
// instead — holding a load for all three sets is a different achievement from
// touching it once, and the screen should say which one happened.
//
// `value` is in the STANDARD's units — per hand for dumbbells — so it can be shown
// beside the thresholds without the reader having to convert anything.
export function scoreExercise(ex, sessions, bodyweightKg) {
  const std = STANDARDS[ex?.name];
  if (!std || !(bodyweightKg > 0)) return null;

  let best = 0;
  let approx = false;
  let bestSession = null;
  let bestRaw = 0;
  let bestReps = 0;
  for (const s of sessions ?? []) {
    for (const set of s.sets ?? []) {
      if (!(set.reps > 0)) continue;
      if (std.repsBased) {
        // Bodyweight-rep tables: the best single set's reps, no estimator, no cap.
        if (set.reps > best) {
          best = set.reps;
          bestSession = s;
          bestRaw = set.weight ?? null;
          bestReps = set.reps;
        }
        continue;
      }
      if (!(set.weight > 0)) continue;
      const w = std.perHand ? set.weight / 2 : set.weight;
      const est = e1rm(w, set.reps);
      if (est > best) {
        best = est;
        approx = set.reps > REP_CAP;
        bestSession = s;
        bestRaw = set.weight;
        bestReps = set.reps;
      }
    }
  }
  if (!(best > 0)) return null;
  if (std.proxy) approx = true;

  // How much of that session was carried at the load the score came from.
  const setsAtValue = std.repsBased
    ? (bestSession?.sets ?? []).filter((x) => x.reps > 0).length
    : (bestSession?.sets ?? []).filter((x) => x.weight === bestRaw && x.reps > 0).length;

  const th = thresholdsFor(ex.name, bodyweightKg);
  // A bodyweight lift is published as ADDED weight, so the comparable figure is
  // the estimated 1RM of the whole load minus what he weighs. Negative means he is
  // still taking assistance, which is the table's own convention — not an error.
  // Both are monotone in the estimate, so the best set is the same set either way.
  const value = Math.round((std.bodyweightRelative ? best - bodyweightKg : best) * 10) / 10;

  let level = null;
  let idx = -1;
  for (let i = 0; i < th.length; i++) if (value >= th[i]) idx = i;
  if (idx >= 0) level = LEVELS[idx];
  const nextLevel = idx + 1 < LEVELS.length ? LEVELS[idx + 1] : null;
  const toNext = nextLevel ? Math.round((th[idx + 1] - value) * 10) / 10 : null;

  // A continuous 0-100 for the bar: 0 at nothing, 100 at Elite, level bands evenly
  // spaced between so the gaps read as equal steps rather than as raw kilos.
  const band = 100 / LEVELS.length;
  // Below the first threshold there is no band to interpolate inside, so the bar
  // runs from "moved nothing" up to Beginner. For a bodyweight lift that floor is
  // MINUS bodyweight (an empty bar is zero total load, so minus everything you
  // weigh), not zero — dividing by th[0] here would be a divide by zero, because
  // Beginner on the chin-up table IS zero added weight.
  const floor = std.bodyweightRelative ? -bodyweightKg : 0;
  const band0 = th[0] - floor;
  let pct;
  if (idx < 0) pct = band0 > 0 ? ((value - floor) / band0) * band : 0;
  else if (idx === LEVELS.length - 1) pct = 100;
  else pct = (idx + 1) * band + ((value - th[idx]) / (th[idx + 1] - th[idx])) * band;

  return {
    value,
    unit: std.repsBased ? 'reps' : std.bodyweightRelative ? 'kg added' : std.perHand ? 'kg per hand' : 'kg',
    proxy: std.proxy ?? null,
    repsBased: !!std.repsBased,
    // The set the score came from, in the standard's units, so the screen can show
    // "from 10 kg × 15" next to an estimated 14 kg — the estimate on its own reads
    // like a weight he never lifted.
    from: {
      weight: bestRaw == null ? null : std.perHand ? bestRaw / 2 : bestRaw,
      reps: bestReps,
      date: bestSession?.date ?? null,
    },
    bodyweightRelative: !!std.bodyweightRelative,
    thresholds: th,
    level,
    nextLevel,
    toNext,
    score: Math.max(0, Math.min(100, Math.round(pct))),
    percentile: level ? PERCENTILES[level] : null,
    approx,
    setsAtValue,
    setsProgrammed: ex.sets ?? null,
    bodyweightRatio: std.repsBased ? null : Math.round((best / bodyweightKg) * 100) / 100,
    untrainedRatio: std.untrained ?? null,
  };
}
