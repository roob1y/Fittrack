// ══════════════════════════════════════════
//  csvSlices.js
//  Three narrow CSVs: one session, one exercise, body stats.
// ══════════════════════════════════════════
//
// The full export answers "everything, ever". These answer one question each, so
// a single session or a single lift can be read (or handed to someone) without
// scrolling past a month of other data.
//
// Pure: rows in, rows out. No Capacitor — exportSlices.js does the
// writing, so everything here can be asserted in node.
//
// Two deliberate differences from exportCSV.js:
//
//   - NO default fallbacks. exportCSV prints `ex.defaultWeight` for a blank weight
//     and the rep TARGET for blank reps, which is how an unlogged chin-up set read
//     "40 kg" on 15 Sep. Here a blank cell means nothing was entered.
//   - An exercise is a FAMILY, not one program.js entry. Slot mates (the two leg
//     presses) and `historyGroup` peers (the crunches on Push and on Pull) are one
//     movement to him, so they export as one timeline with a Variant column saying
//     what was actually done. Storage is untouched; only the reading joins.
//
// A set counts as logged when it was ticked `done`, the same rule the full export
// and DATA NOTES use, so the three can never disagree about what happened.

import { setKey, dayKey, exerciseNoteKey, exerciseKeyPart } from './setKeys';
import {
  seriesFromLog,
  sevenDayAverage,
  weeklyRate,
  lastNDays,
  navyBodyFat,
  MEASUREMENTS,
  cmTo,
  kgTo as bodyKgTo,
  stones,
} from './body';

const MAX_WEEKS = 52;

const round1 = (n) => Math.round(n * 10) / 10;

export function kgTo(kg, unit) {
  const n = Number(kg);
  if (!Number.isFinite(n)) return '';
  return unit === 'lbs' ? round1(n * 2.2046) : round1(n);
}

// Every completed session in the programme, oldest first:
//   { week, day, key, date }
// Ties on a date keep programme day order, so Push reads before Pull.
export function loggedSessions(days, slice) {
  const out = [];
  for (let week = 1; week <= MAX_WEEKS; week++) {
    (days ?? []).forEach((day, order) => {
      const key = dayKey(week, day.id);
      const date = slice?.workoutDates?.[key];
      if (date) out.push({ week, day, key, date, order });
    });
  }
  return out.sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.order - b.order));
}

// Distinct dates with at least one session, newest first, for the picker:
//   [{ date, sessions: [{ week, day, key, date }] }]
export function sessionDates(days, slice) {
  const byDate = new Map();
  for (const s of loggedSessions(days, slice)) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date).push(s);
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([date, sessions]) => ({ date, sessions }));
}

// ── Exercise families ──────────────────────────────────────────────
//
// Union-find over every (day, exercise) in the programme. Two entries join when
// they share a `slot` on the same day, or share a `historyGroup` on any day. The
// lateral raise shows why both are needed: cable ⇄ dumbbell is a slot, and each
// of those runs on Push AND Pull through its own history group — four entries,
// one movement.
//
// Returns [{ id, label, days: [dayLabel...], focus, members: [{ day, ex }] }] in
// programme order. `id` is stable for a given program.js.
export function exerciseFamilies(days) {
  const members = [];
  (days ?? []).forEach((day) => (day.exercises ?? []).forEach((ex) => members.push({ day, ex })));

  const parent = members.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const join = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };

  const firstByTag = new Map();
  members.forEach(({ day, ex }, i) => {
    const tags = [];
    if (ex.slot) tags.push(`slot:${day.id}:${ex.slot}`);
    if (ex.historyGroup) tags.push(`group:${ex.historyGroup}`);
    for (const t of tags) {
      if (firstByTag.has(t)) join(firstByTag.get(t), i);
      else firstByTag.set(t, i);
    }
  });

  const groups = new Map();
  members.forEach((m, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(m);
  });

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, ms]) => {
      const names = [...new Set(ms.map((m) => m.ex.name))];
      const dayLabels = [...new Set(ms.map((m) => m.day.focus || m.day.label))];
      return {
        id: `${ms[0].day.id}:${exerciseKeyPart(ms[0].ex)}`,
        label: names.join(' ⇄ '),
        days: dayLabels,
        focus: ms[0].day.focus || ms[0].day.label,
        members: ms,
      };
    });
}

// ── 1. ONE SESSION ─────────────────────────────────────────────────

// Every set logged on `date`, across however many sessions share that date.
// Duration and the session note sit in a header block — they are per-session,
// and repeating them down every set row is noise. Exercise notes go on the first
// set of their exercise, as in the full export; a note on an exercise with no
// logged sets still gets a row, because that is usually the note saying why.
export function sessionRows(days, slice, date, weightUnit = 'kg') {
  const sessions = loggedSessions(days, slice).filter((s) => s.date === date);
  const setData = slice?.setData ?? {};
  const rows = [];

  for (const s of sessions) {
    if (rows.length) rows.push([]);
    const mins = slice?.sessionTimes?.[s.key];
    rows.push(['SESSION']);
    rows.push(['Date', 'Day', 'Focus', 'Duration (mins)', 'Session Note']);
    rows.push([s.date, s.day.label, s.day.focus, mins ?? '', slice?.notes?.[s.key] ?? '']);
    rows.push([]);

    const assistedHere = s.day.exercises.some((ex) => ex.assisted);
    rows.push(['SETS']);
    rows.push([
      'Exercise',
      'Done on',
      'Set',
      'Reps',
      `Weight (${weightUnit})`,
      ...(assistedHere ? [`Assist (${weightUnit})`, `Effective load (${weightUnit})`] : []),
      'Exercise Note',
    ]);

    for (const ex of s.day.exercises) {
      const note = slice?.exerciseNotes?.[exerciseNoteKey(s.week, s.day.id, ex)] ?? '';
      let first = true;
      for (let si = 0; si < ex.sets; si++) {
        const d = setData[setKey(s.week, s.day.id, ex, si)];
        if (!d?.done) continue;
        rows.push([
          ex.name,
          d.via || '',
          `Set ${si + 1}`,
          d.reps ?? '',
          ...loadCells(ex, d, assistedHere),
          first ? note : '',
        ]);
        first = false;
      }
      if (first && note) {
        rows.push([ex.name, '', '(no sets logged)', '', '', ...(assistedHere ? ['', ''] : []), note]);
      }
    }
  }
  return rows;
}

// Weight / assist / effective cells for one set. On an assisted exercise the
// number he typed is the ASSIST, and `weight` is the effective load the app
// derived from it and bodyweight on the day — so the Weight column stays blank
// rather than showing a figure he never entered. Done via the alternative (a lat
// pulldown in place of assisted chin-ups) it is an ordinary load again.
function loadCells(ex, d, withAssistCols) {
  const assistedSet = ex.assisted && !d.via;
  if (!withAssistCols) return [d.weight ?? ''];
  if (assistedSet) return ['', d.assist ?? '', d.weight ?? ''];
  return [d.weight ?? '', '', ''];
}

// ── 2. ONE EXERCISE ────────────────────────────────────────────────

// Every set of one family, oldest first. `Variant` is what was actually done:
// the alternative's name when the set carries `via`, otherwise the programme
// entry's own name — so "Leg Press (Plates)" and "Leg Press (Machine)" rows can
// be told apart at a glance.
export function exerciseRows(days, slice, family, weightUnit = 'kg') {
  const setData = slice?.setData ?? {};
  const assisted = family.members.some((m) => m.ex.assisted);
  const rows = [];
  rows.push([`EXERCISE — ${family.label}`]);
  rows.push([
    'Date',
    'Day',
    'Variant',
    'Set',
    'Reps',
    `Weight (${weightUnit})`,
    ...(assisted ? [`Assist (${weightUnit})`, `Effective load (${weightUnit})`] : []),
    'Exercise Note',
  ]);

  const memberDays = new Set(family.members.map((m) => m.day.id));
  const sessions = loggedSessions(days, slice).filter((s) => memberDays.has(s.day.id));

  for (const s of sessions) {
    for (const { day, ex } of family.members) {
      if (day.id !== s.day.id) continue;
      const note = slice?.exerciseNotes?.[exerciseNoteKey(s.week, day.id, ex)] ?? '';
      let first = true;
      for (let si = 0; si < ex.sets; si++) {
        const d = setData[setKey(s.week, day.id, ex, si)];
        if (!d?.done) continue;
        rows.push([
          s.date,
          day.focus || day.label,
          d.via || ex.name,
          `Set ${si + 1}`,
          d.reps ?? '',
          ...loadCells(ex, d, assisted),
          first ? note : '',
        ]);
        first = false;
      }
      if (first && note) {
        rows.push([
          s.date,
          day.focus || day.label,
          ex.name,
          '(no sets logged)',
          '',
          '',
          ...(assisted ? ['', ''] : []),
          note,
        ]);
      }
    }
  }
  return rows;
}

// ── 3. BODY STATS ──────────────────────────────────────────────────
//
// Everything the Body tab holds, with the per-date calculations it shows
// alongside. Everything is stored metric (kg, cm) and converted here to the
// display units — weights to the weight unit, tape to the measurement unit.
//
// Calculations are only put on a row when they are a fact about THAT date:
//   - 7-day average — mean of the weigh-ins in the 7 days ending that day, blank
//     with fewer than two (one reading is not an average);
//   - Navy body fat — as of each tape date, from the most recent waist / neck
//     (and hips) at or before it, exactly as the Body tab reads "latest";
//   - fat mass and everything-else mass on each scan.
// Rates are over a window, not a date, so they live in the SUMMARY block, with
// the window named.

const RATE_WINDOWS = [
  ['last 30 days', 30],
  ['last 90 days', 90],
  ['all readings', 0],
];

export function bodyRows(store) {
  const wu = store?.weightUnit === 'lbs' ? 'lbs' : 'kg';
  const mu = store?.measurementUnit === 'in' ? 'in' : 'cm';
  const w = (kg) => (kg == null ? '' : round1(bodyKgTo(kg, wu)));
  const cm = (v) => (v == null ? '' : round1(cmTo(v, mu)));

  const weights = seriesFromLog(store?.weightLog);
  const tapeLog = store?.measurementLog ?? {};
  const tapeDates = Object.keys(tapeLog)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  const scans = Object.entries(store?.bodyScans ?? {})
    .filter(([d]) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));

  const navyAt = (date) => {
    const upTo = Object.fromEntries(Object.entries(tapeLog).filter(([d]) => d <= date));
    return navyBodyFat({ gender: store?.gender, heightCm: store?.heightCm, measurementLog: upTo }).value;
  };

  const rows = [];

  // SUMMARY
  rows.push(['SUMMARY — calculated, as of the latest reading']);
  rows.push(['Measure', 'Value', 'Detail']);
  const latest = weights[weights.length - 1];
  if (latest) {
    rows.push(['Latest weight', w(latest.value), `${wu}, ${latest.date} (${stones(latest.value)})`]);
    const avg = sevenDayAverage(weights);
    if (avg) rows.push(['7-day average', w(avg.value), `${wu}, ${avg.count} readings`]);
    // A wider window holding the same readings says nothing new — skip it rather
    // than print the same rate three times.
    let prevCount = 0;
    for (const [label, days] of RATE_WINDOWS) {
      const win = lastNDays(weights, days);
      if (win.length === prevCount) continue;
      prevCount = win.length;
      const rate = weeklyRate(win);
      if (rate != null) rows.push([`Weekly change, ${label}`, w(rate), `${wu} per week, ${win.length} readings`]);
    }
  } else {
    rows.push(['Latest weight', '', 'no weigh-ins logged']);
  }
  if (store?.weightGoalKg) {
    rows.push([
      'Goal weight',
      w(store.weightGoalKg),
      latest ? `${wu}, ${w(latest.value - store.weightGoalKg)} to go` : wu,
    ]);
  }
  const navyNow = navyBodyFat({ gender: store?.gender, heightCm: store?.heightCm, measurementLog: tapeLog });
  rows.push([
    'Body fat, US Navy tape estimate',
    navyNow.value ?? '',
    navyNow.value != null ? `%, tape from ${navyNow.asOf}` : `needs ${navyNow.missing.join(', ')}`,
  ]);
  if (store?.heightCm) rows.push(['Height', cm(store.heightCm), mu]);

  // WEIGHT
  rows.push([]);
  rows.push(['BODY WEIGHT LOG']);
  rows.push(['Date', `Weight (${wu})`, `7-day average (${wu})`]);
  weights.forEach((e, i) => {
    const avg = sevenDayAverage(weights.slice(0, i + 1));
    rows.push([e.date, w(e.value), avg ? w(avg.value) : '']);
  });

  // TAPE
  if (tapeDates.length) {
    rows.push([]);
    rows.push(['TAPE MEASUREMENTS']);
    rows.push(['Date', ...MEASUREMENTS.map((m) => `${m.label} (${mu})`), 'Navy body fat (%)']);
    for (const date of tapeDates) {
      rows.push([date, ...MEASUREMENTS.map((m) => cm(tapeLog[date]?.[m.key])), navyAt(date) ?? '']);
    }
  }

  // SCANS
  if (scans.length) {
    rows.push([]);
    rows.push(['BODY COMPOSITION SCANS (Boditrax)']);
    rows.push([
      'Date',
      `Scan weight (${wu})`,
      'Body fat (%)',
      `Muscle (${wu})`,
      `Fat mass (${wu})`,
      `Everything else (${wu})`,
    ]);
    for (const [date, s] of scans) {
      const fatKg = s?.weightKg && s?.fatPct ? (s.weightKg * s.fatPct) / 100 : null;
      rows.push([
        date,
        w(s?.weightKg),
        s?.fatPct ?? '',
        w(s?.muscleKg),
        w(fatKg),
        fatKg != null ? w(s.weightKg - fatKg) : '',
      ]);
    }
  }

  return rows;
}

// ── CSV text ───────────────────────────────────────────────────────

export function toCSV(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(','),
    )
    .join('\n');
}

export function fileSlug(s) {
  return exerciseKeyPart({ name: s });
}
