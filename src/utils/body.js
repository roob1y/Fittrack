// Pure helpers for the Body tab: series, rates, unit conversion, the Navy
// tape estimate. Nothing here touches the store, so it can be tested in node.
//
// Everything is stored metric (kg, cm) and converted only for display.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86400000;

// Today as YYYY-MM-DD in local time. toISOString() is UTC, which files a
// weigh-in made before 1 am BST under yesterday.
export function localToday(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fmtDay(s) {
  if (!s) return '';
  return `${parseInt(s.slice(8, 10), 10)} ${MONTHS[parseInt(s.slice(5, 7), 10) - 1]}`;
}

export const dayMs = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));

export function daysBetween(a, b) {
  return Math.round((dayMs(b) - dayMs(a)) / DAY);
}

export function addDays(s, n) {
  return new Date(dayMs(s) + n * DAY).toISOString().slice(0, 10);
}

// { '2026-09-11': 88 } → [{ date, value }] sorted, junk dropped.
export function seriesFromLog(log) {
  return Object.entries(log ?? {})
    .map(([date, v]) => ({ date, value: Number(v) }))
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(e.value) && e.value > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

// measurementLog is { date: { waist: 90, chest: 104 } } — one field out of it.
export function seriesFromMeasurements(measurementLog, field) {
  const flat = {};
  for (const [date, day] of Object.entries(measurementLog ?? {})) {
    if (day?.[field] != null) flat[date] = day[field];
  }
  return seriesFromLog(flat);
}

// Entries within `days` of the latest one (not of today — a three-week gap in
// weigh-ins should still show the last month of readings, not an empty chart).
export function lastNDays(series, days) {
  if (!days || !series.length) return series;
  const end = series[series.length - 1].date;
  return series.filter((e) => daysBetween(e.date, end) < days);
}

// kg per week. Least squares over the readings when there are three or more —
// daily weigh-ins swing ±1 kg on water, and first-to-last would chase that noise.
// Null when the readings span under a week: a rate from two days means nothing.
export function weeklyRate(series) {
  if (series.length < 2) return null;
  const span = daysBetween(series[0].date, series[series.length - 1].date);
  if (span < 7) return null;
  if (series.length === 2) return ((series[1].value - series[0].value) / span) * 7;
  const xs = series.map((e) => daysBetween(series[0].date, e.date));
  const ys = series.map((e) => e.value);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den ? (num / den) * 7 : null;
}

// Mean of the readings in the 7 days ending at the latest one. Needs at least
// two, or it is just the latest reading with a different label.
export function sevenDayAverage(series) {
  if (!series.length) return null;
  const recent = lastNDays(series, 7);
  if (recent.length < 2) return null;
  return { value: recent.reduce((a, e) => a + e.value, 0) / recent.length, count: recent.length };
}

export const round1 = (v) => Math.round(v * 10) / 10;

export function kgTo(kg, unit) {
  return unit === 'lbs' ? kg * 2.2046 : kg;
}
export function toKg(v, unit) {
  return unit === 'lbs' ? v / 2.2046 : v;
}
export function cmTo(cm, unit) {
  return unit === 'in' ? cm / 2.54 : cm;
}
export function toCm(v, unit) {
  return unit === 'in' ? v * 2.54 : v;
}

// 88 kg → "13 st 12 lb". His goal is set in stones, so the hero shows both.
export function stones(kg) {
  const lb = Math.round(kg * 2.20462);
  return `${Math.floor(lb / 14)} st ${lb % 14} lb`;
}

export function cmToFtIn(cm) {
  const totalIn = Math.round(cm / 2.54);
  return { ft: Math.floor(totalIn / 12), inches: totalIn % 12 };
}

// US Navy circumference method. Uses each measurement's most recent reading,
// not only the latest date's — logging chest alone on a new day should not
// blank the estimate.
export function navyBodyFat({ gender, heightCm, measurementLog }) {
  const latest = (f) => {
    const s = seriesFromMeasurements(measurementLog, f);
    return s.length ? s[s.length - 1] : null;
  };
  const waist = latest('waist');
  const neck = latest('neck');
  const hips = latest('hips');
  const need = gender === 'female' ? ['waist', 'neck', 'hips'] : ['waist', 'neck'];
  const have = { waist, neck, hips };
  const missing = [...(heightCm ? [] : ['height']), ...need.filter((k) => !have[k])];
  if (missing.length) return { value: null, missing };
  let bf;
  if (gender === 'female') {
    const x = waist.value + hips.value - neck.value;
    if (x <= 0) return { value: null, missing: [] };
    bf = 495 / (1.29579 - 0.35004 * Math.log10(x) + 0.221 * Math.log10(heightCm)) - 450;
  } else {
    const x = waist.value - neck.value;
    if (x <= 0) return { value: null, missing: [] };
    bf = 495 / (1.0324 - 0.19077 * Math.log10(x) + 0.15456 * Math.log10(heightCm)) - 450;
  }
  const dates = need.map((k) => have[k].date).sort();
  return { value: round1(bf), missing: [], asOf: dates[dates.length - 1] };
}

// Which way is good for a measurement. Waist and hips: down, during a cut.
// Chest, shoulders, arms: up — the stated goal. Neck and thigh: no opinion.
export const MEASUREMENTS = [
  { key: 'waist', label: 'Waist', good: 'down' },
  { key: 'chest', label: 'Chest', good: 'up' },
  { key: 'shoulders', label: 'Shoulders', good: 'up' },
  { key: 'arms', label: 'Upper arm', good: 'up' },
  { key: 'legs', label: 'Thigh', good: null },
  { key: 'hips', label: 'Hips', good: 'down' },
  { key: 'neck', label: 'Neck', good: null },
];

// 'good' | 'bad' | null for a change. With a goal set, good means toward it;
// without one, the measurement's default direction decides.
export function changeTone(delta, { goal = null, latest = null, good = null } = {}) {
  if (delta == null || Math.abs(delta) < 0.05) return null;
  if (goal != null && latest != null) {
    const before = latest - delta;
    return Math.abs(goal - latest) < Math.abs(goal - before) ? 'good' : 'bad';
  }
  if (!good) return null;
  return (good === 'up') === delta > 0 ? 'good' : 'bad';
}

export function signed(v, digits = 1) {
  if (v == null) return '—';
  const r = Number(v.toFixed(digits));
  if (r === 0) return '0';
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(digits)}`;
}

// Parse a typed number; null for empty, junk, zero or negative.
export function parsePositive(str) {
  const v = parseFloat(String(str ?? '').replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : null;
}
