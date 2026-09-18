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
// **Anything not listed here has no standard yet — that is the honest state, not
// an oversight to be filled in by estimating.**
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
  for (const s of sessions ?? []) {
    for (const set of s.sets ?? []) {
      if (!(set.weight > 0) || !(set.reps > 0)) continue;
      const w = std.perHand ? set.weight / 2 : set.weight;
      const est = e1rm(w, set.reps);
      if (est > best) {
        best = est;
        approx = set.reps > REP_CAP;
        bestSession = s;
        bestRaw = set.weight;
      }
    }
  }
  if (!(best > 0)) return null;

  // How much of that session was carried at the load the score came from.
  const setsAtValue = (bestSession?.sets ?? []).filter((x) => x.weight === bestRaw && x.reps > 0).length;

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
    unit: std.bodyweightRelative ? 'kg added' : std.perHand ? 'kg per hand' : 'kg',
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
    bodyweightRatio: Math.round((best / bodyweightKg) * 100) / 100,
    untrainedRatio: std.untrained ?? null,
  };
}
