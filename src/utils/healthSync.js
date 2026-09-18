// ══════════════════════════════════════════
//  healthSync.js
//  Filling sessions in, given that the data arrives late.
// ══════════════════════════════════════════
//
// Samsung Health pushes to Health Connect on its own schedule, so the heart rate
// for a session that finished two minutes ago usually is not there yet. Reading
// once when the day is marked complete would leave most sessions permanently blank.
//
// Instead the session records its time WINDOW at completion, and this sweeps back
// over any session that still has a window but no heart rate. It runs on app start
// and from a button in Settings, and it is safe to run as often as you like — a
// session that already has data is skipped.

import useStore from '../store/useStore';
import {
  healthAvailable,
  healthPermissions,
  readHeartRate,
  readSleep,
  SAMPLE_LIMITS,
  readWeight,
} from '../plugins/health';
import {
  summariseHeartRate,
  summariseSleep,
  sleepWindowFor,
  mergeWeightSamples,
  findLikelySessionWindow,
} from './healthMetrics';
import { PROGRAMMES } from '../data/program';
import { dayKey } from './setKeys';

// Give up on a session after this many failed passes. Without a cap, a session
// during which the watch was on charge would be re-queried on every app start
// forever.
const MAX_ATTEMPTS = 8;
// Health Connect will not return data older than ~30 days without history access.
const MAX_AGE_MS = 29 * 24 * 60 * 60 * 1000;

export function needsFill(entry, now = Date.now()) {
  if (!entry?.window?.start || !entry?.window?.end) return false;
  if (entry.hr) return false;
  if ((entry.attempts ?? 0) >= MAX_ATTEMPTS) return false;
  if (now - entry.window.end > MAX_AGE_MS) return false;
  return true;
}

// Returns a short summary of what happened, for the Settings panel.
export async function syncHealthData({ includeWeight = true } = {}) {
  const state = useStore.getState();
  if (!state.healthEnabled) return { ok: false, reason: 'Health sync is off' };

  const avail = await healthAvailable();
  if (!avail?.available) return { ok: false, reason: avail?.reason || 'Health Connect unavailable' };

  const perms = await healthPermissions();
  const granted = new Set(perms?.readAuthorized ?? []);
  if (!granted.size) return { ok: false, reason: 'No Health Connect permissions granted' };

  const progId = state.activeProgrammeId;
  const slice = state.programmeData[progId] ?? {};
  const sessions = Object.entries(slice.sessionHealth ?? {});
  const now = Date.now();

  let filled = 0,
    attempted = 0;
  for (const [key, entry] of sessions) {
    if (!needsFill(entry, now)) continue;
    attempted++;
    const patch = { attempts: (entry.attempts ?? 0) + 1, syncedAt: now };

    if (granted.has('heartRate')) {
      const hr = summariseHeartRate(await readHeartRate(entry.window.start, entry.window.end), { elevatedBpm: 130 });
      if (hr) {
        patch.hr = hr;
        filled++;
      }
    }
    if (granted.has('sleep')) {
      const w = sleepWindowFor(entry.window.start);
      const sleep = summariseSleep(await readSleep(w.start, w.end));
      if (sleep) patch.sleepMinutes = sleep.minutes;
    }
    useStore.getState().saveSessionHealth(key, patch);
  }

  let weightAdded = 0;
  if (includeWeight && granted.has('weight')) {
    const samples = await readWeight(now - MAX_AGE_MS, now);
    const { log, added } = mergeWeightSamples(useStore.getState().weightLog, samples);
    if (added > 0) useStore.getState().setWeightLog(log);
    weightAdded = added;
  }

  useStore.getState().setHealthLastSync(now);
  return {
    ok: true,
    attempted,
    filled,
    weightAdded,
    pending: sessions.filter((s) => needsFill(s[1], now)).length - attempted,
  };
}

// Called when a day is marked complete: records the window so the sweep above has
// something to work with, then makes one optimistic attempt in case the watch has
// already synced.
export async function captureSessionWindow(key, startMs, endMs) {
  const store = useStore.getState();
  if (!store.healthEnabled) return;
  store.saveSessionHealth(key, { window: { start: startMs, end: endMs }, attempts: 0 });
  try {
    await syncHealthData({ includeWeight: false });
  } catch (err) {
    console.warn('[FitTrack] health: capture sync failed —', err?.message ?? err);
  }
}

// ── Backfill for sessions logged before any of this existed ──────────────
//
// Those sessions have no `window`, so the normal sweep skips them forever. But
// Health Connect still holds the raw samples for ~30 days, so the data is not
// actually gone — only FitTrack's record of WHEN the session happened is.
//
// Sleep is per-DAY, so it comes back exactly.
// Heart rate needs a time window, so it is inferred from the session's recorded
// duration and marked `estimated: true`. Anything estimated must be labelled as
// such wherever it is shown — a guessed average presented as measurement is worse
// than no number at all.
export async function backfillSessionHealth() {
  const state = useStore.getState();
  if (!state.healthEnabled) return { ok: false, reason: 'Health sync is off' };

  const avail = await healthAvailable();
  if (!avail?.available) return { ok: false, reason: avail?.reason || 'Health Connect unavailable' };

  const perms = await healthPermissions();
  const granted = new Set(perms?.readAuthorized ?? []);
  if (!granted.size) return { ok: false, reason: 'No Health Connect permissions granted' };

  const progId = state.activeProgrammeId;
  const slice = state.programmeData[progId] ?? {};
  const days = PROGRAMMES[progId]?.days ?? [];
  const now = Date.now();

  let recovered = 0,
    estimated = 0,
    tooOld = 0;

  for (let week = 1; week <= 52; week++) {
    for (const day of days) {
      const key = dayKey(week, day.id);
      const date = slice.workoutDates?.[key];
      if (!date) continue;
      const existing = slice.sessionHealth?.[key];
      if (existing?.hr) continue; // already has real data — never overwrite it

      const dayStart = new Date(`${date}T00:00:00`).getTime();
      if (!Number.isFinite(dayStart)) continue;
      if (now - dayStart > MAX_AGE_MS) {
        tooOld++;
        continue;
      }

      const patch = { backfilledAt: now };

      if (granted.has('sleep')) {
        const w = sleepWindowFor(dayStart + 12 * 3600000);
        const sleep = summariseSleep(await readSleep(w.start, w.end));
        if (sleep) patch.sleepMinutes = sleep.minutes;
      }

      const mins = slice.sessionTimes?.[key];
      if (granted.has('heartRate') && mins > 0 && !existing?.window) {
        const samples = await readHeartRate(dayStart + 5 * 3600000, dayStart + 23 * 3600000);
        const guess = findLikelySessionWindow(samples, mins);
        if (guess) {
          const inWindow = samples.filter((s) => {
            const t = new Date(s.startDate).getTime();
            return t >= guess.start && t <= guess.end;
          });
          const hr = summariseHeartRate(inWindow, { elevatedBpm: 130 });
          if (hr) {
            patch.hr = hr;
            patch.estimated = true;
            patch.window = { start: guess.start, end: guess.end };
            estimated++;
          }
        }
      }

      if (Object.keys(patch).length > 1) {
        useStore.getState().saveSessionHealth(key, patch);
        recovered++;
      }
    }
  }

  useStore.getState().setHealthLastSync(now);
  return { ok: true, recovered, estimated, tooOld };
}

// ── Diagnostic: what does Health Connect actually hold? ──────────────────
//
// The status panel can only report that PERMISSIONS are granted, which is not the
// same as data existing. Samsung Health is a forward-looking writer: it pushes
// data recorded after its Health Connect permission was granted and does not
// reliably backfill what came before. So an empty result here is the expected
// outcome for sessions that predate the connection — not a failure of the sync.
//
// This reads a window of each type and reports raw counts, which is the only way
// to tell "the store is empty" from "the reading code is wrong".
export async function probeHealthData(days = 7) {
  const state = useStore.getState();
  const avail = await healthAvailable();
  if (!avail?.available) return { ok: false, reason: avail?.reason || 'Health Connect unavailable' };

  const perms = await healthPermissions();
  const granted = new Set(perms?.readAuthorized ?? []);
  const now = Date.now();
  const from = now - days * 86400000;

  const readers = {
    heartRate: readHeartRate,
    sleep: readSleep,
    weight: readWeight,
  };

  const found = {};
  for (const [type, read] of Object.entries(readers)) {
    if (!granted.has(type)) {
      found[type] = { granted: false, count: 0, latest: null };
      continue;
    }
    const newestOf = (rows) =>
      rows
        .map((s) => new Date(s?.startDate).getTime())
        .filter((t) => Number.isFinite(t))
        .sort((a, b) => b - a)[0] ?? null;

    const samples = await read(from, now);
    // A count equal to the cap is a floor, not a total — see SAMPLE_LIMITS.
    const cap = SAMPLE_LIMITS[type] ?? Infinity;
    const capped = samples.length >= cap;
    let latest = newestOf(samples);

    // The cap truncates a wide read at the NEW end, because readSamples asks for
    // ascending order and the limit keeps the first N. So on a capped read the
    // newest samples are precisely the missing ones, and the date above is the
    // newest that fitted rather than the newest that exists. It reported
    // "5000+ · latest 05/09/2026" on 7 Sep while that same day's session had
    // already pulled heart rate from a narrow window without trouble — the panel
    // warning that the COUNT was capped and then printing a date the cap invented.
    // Same mistake as bug 14, one field along: a derived value from a truncated
    // read. A short recent window cannot hit the cap, so ask it again.
    if (capped) {
      const recent = newestOf(await read(now - 2 * 86400000, now));
      if (recent != null && (latest == null || recent > latest)) latest = recent;
    }

    found[type] = { granted: true, count: samples.length, capped, latest };
  }

  return { ok: true, days, found, enabled: state.healthEnabled };
}
