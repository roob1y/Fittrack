// ══════════════════════════════════════════
//  healthMetrics.js
//  Pure functions over Health Connect samples.
// ══════════════════════════════════════════
//
// Deliberately free of any plugin import so it can be tested without a device.
// Everything here takes plain sample arrays and returns plain objects; the
// talking-to-Android part lives in plugins/health.js.
//
// A Health Connect sample looks like:
//   { dataType, value, unit, startDate, endDate, sourceName?, sleepState? }
// with ISO date strings.

const ms = (iso) => new Date(iso).getTime();

// Heart rate across a session window. Returns null rather than a zeroed object
// when there is nothing to summarise, so the UI can tell "no data yet" (sync lag,
// watch not worn) from "a real reading of zero".
export function summariseHeartRate(samples, { elevatedBpm } = {}) {
  const bpms = (samples ?? []).map((s) => Number(s?.value)).filter((v) => Number.isFinite(v) && v > 0);
  if (!bpms.length) return null;

  const sum = bpms.reduce((a, b) => a + b, 0);
  const out = {
    avg: Math.round(sum / bpms.length),
    max: Math.round(Math.max(...bpms)),
    min: Math.round(Math.min(...bpms)),
    count: bpms.length,
  };

  // Rough time-above-threshold: each sample stands for the gap until the next one.
  // The Fit 3 samples irregularly, so this is an estimate and named as one.
  if (Number.isFinite(elevatedBpm)) {
    const ordered = (samples ?? [])
      .filter((s) => Number.isFinite(Number(s?.value)) && Number(s.value) > 0)
      .map((s) => ({ t: ms(s.startDate), v: Number(s.value) }))
      .filter((s) => Number.isFinite(s.t))
      .sort((a, b) => a.t - b.t);
    let secs = 0;
    for (let i = 0; i < ordered.length - 1; i++) {
      if (ordered[i].v >= elevatedBpm) secs += Math.min((ordered[i + 1].t - ordered[i].t) / 1000, 300);
    }
    out.minutesElevated = Math.round(secs / 60);
  }
  return out;
}

// Total minutes actually asleep for the night before a session.
// Health Connect emits one sample per sleep STAGE, and 'awake' segments sit inside
// the same session — summing everything would count lying awake as sleep.
const ASLEEP_STATES = new Set(['asleep', 'rem', 'deep', 'light']);

export function summariseSleep(samples) {
  const asleep = (samples ?? []).filter((s) => !s?.sleepState || ASLEEP_STATES.has(s.sleepState));
  if (!asleep.length) return null;
  let minutes = 0;
  for (const s of asleep) {
    const a = ms(s.startDate),
      b = ms(s.endDate);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) minutes += (b - a) / 60000;
  }
  if (minutes <= 0) return null;
  return { minutes: Math.round(minutes), segments: asleep.length };
}

// The window to ask for when looking up "the night before this session":
// 18:00 the previous day through 12:00 on the day of the session. Wide enough for
// a late night or a lie-in, narrow enough not to swallow the night before that.
export function sleepWindowFor(sessionStartMs) {
  const d = new Date(sessionStartMs);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);
  return { start: start.getTime(), end: end.getTime() };
}

// Merge weight samples into the existing log.
//
// The log is { 'YYYY-MM-DD': kg }. Entries Robbie typed himself WIN — a sync must
// never silently overwrite a number he entered, and his log already mixes a gym
// scale with a home one, so quietly replacing values would make that worse rather
// than better. Returns { log, added, skipped } so the UI can say what it did.
export function mergeWeightSamples(existingLog, samples) {
  const log = { ...(existingLog ?? {}) };
  let added = 0,
    skipped = 0;
  const byDate = {};
  for (const s of samples ?? []) {
    const kg = Number(s?.value);
    if (!Number.isFinite(kg) || kg <= 0) continue;
    const t = ms(s.startDate);
    if (!Number.isFinite(t)) continue;
    const date = new Date(t).toISOString().slice(0, 10);
    // keep the latest sample within a day
    if (!byDate[date] || t > byDate[date].t) byDate[date] = { t, kg };
  }
  for (const [date, { kg }] of Object.entries(byDate)) {
    if (log[date] !== undefined) {
      skipped++;
      continue;
    }
    log[date] = Math.round(kg * 10) / 10;
    added++;
  }
  return { log, added, skipped };
}

// ── Backfill: recovering a session window we never recorded ──────────────
//
// Sessions logged before the Health Connect work have no `window`, but Health
// Connect still holds the raw samples for ~30 days. Sleep is per-DAY and can be
// recovered exactly. Heart rate cannot — without a start time
// the best available answer is a guess, so this finds the most plausible block
// and every caller must mark the result `estimated`.
//
// Heuristic: slide a window of the session's known duration across the day's
// samples and take the one with the highest mean. During a lifting session heart
// rate sits elevated for the whole block, so that is usually the training period —
// but a run, a stressful meeting or a brisk walk would win instead. Treat the
// output as a hint, never as measurement.
export function findLikelySessionWindow(samples, durationMinutes) {
  const pts = (samples ?? [])
    .map((s) => ({ t: new Date(s?.startDate).getTime(), v: Number(s?.value) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v) && p.v > 0)
    .sort((a, b) => a.t - b.t);

  const span = Number(durationMinutes) * 60000;
  if (pts.length < 6 || !Number.isFinite(span) || span <= 0) return null;
  if (pts[pts.length - 1].t - pts[0].t < span) return null; // day shorter than the session

  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const start = pts[i].t;
    const end = start + span;
    let sum = 0,
      n = 0,
      last = start;
    for (let j = i; j < pts.length && pts[j].t <= end; j++) {
      sum += pts[j].v;
      n++;
      last = pts[j].t;
    }
    // Two guards, both needed. A handful of readings says nothing; and a window
    // whose samples all cluster in one corner is not evidence of a sustained
    // effort across the whole block — without this a sparse burst at the end of
    // the day outscores a genuine hour of training on mean alone.
    if (n < 5) continue;
    if (last - start < span * 0.6) continue;
    const mean = sum / n;
    if (!best || mean > best.mean) best = { start, end, mean, count: n };
  }
  return best;
}
