// ══════════════════════════════════════════
//  health.js
//  Health Connect, wrapped so it can never break a workout.
// ══════════════════════════════════════════
//
// Chain: Galaxy Fit 3 → Samsung Health (phone) → Health Connect → here.
// Requires Samsung Health 6.22.5+ with Health Connect permission granted inside
// Samsung Health itself, which is separate from the permission sheet this asks for.
//
// EVERY function returns a value and never throws. On the web build the plugin's
// methods throw `unimplemented`, and on device a denied permission or a missing
// Health Connect app throws too — none of which is a reason for the app to fall
// over mid-session. Logging a set must work identically whether or not any of
// this is connected, so callers get null and carry on.
//
// Health Connect is a store that Samsung Health syncs to periodically, NOT a live
// feed. Heart rate for a session that just finished is often not there yet, which
// is why sessions record their time window and get filled in later rather than
// being read once at the final whistle.

import { Health } from '@capgo/capacitor-health';

// `restingHeartRate` was removed 7 Sep. Samsung Health does not sync it: it is
// absent from their published list of Health Connect data types, the permission
// showed granted and every read returned zero rows, and the whole chain was traced
// end to end on 29 Aug — plugin, request, grant, read. Asking for a permission
// that can never return anything made FitTrack look broken rather than Samsung
// look incomplete. If it is ever wanted, derive it from the lowest rolling
// 10-minute average inside the sleep window and label it FitTrack's own estimate.
export const READ_TYPES = ['heartRate', 'sleep', 'weight'];

async function safe(label, fn, fallback = null) {
  try {
    return await fn();
  } catch (err) {
    // `unimplemented` on web is expected and not worth shouting about.
    if (!/unimplemented|not available|not implemented/i.test(String(err?.message ?? err))) {
      console.warn(`[FitTrack] health: ${label} failed —`, err?.message ?? err);
    }
    return fallback;
  }
}

// { available, platform?, reason? } — never throws, even on web.
export async function healthAvailable() {
  return safe('isAvailable', () => Health.isAvailable(), {
    available: false,
    reason: 'Health Connect could not be reached.',
  });
}

// Which of READ_TYPES are actually granted. Null means we could not ask at all.
export async function healthPermissions() {
  return safe('checkAuthorization', () => Health.checkAuthorization({ read: READ_TYPES }));
}

// Opens the Health Connect permission sheet. `requestHistoryAccess` matters:
// without READ_HEALTH_DATA_HISTORY, Health Connect caps reads at roughly the last
// 30 days, which would silently truncate the bodyweight backfill.
export async function requestHealthAccess() {
  return safe('requestAuthorization', () =>
    Health.requestAuthorization({ read: READ_TYPES, requestHistoryAccess: true }),
  );
}

export async function openHealthSettings() {
  return safe('openHealthConnectSettings', () => Health.openHealthConnectSettings());
}

const iso = (msValue) => new Date(msValue).toISOString();

// How many samples each read will take at most. These are caps, not counts —
// a read that comes back holding exactly this many has been TRUNCATED, and the
// true figure is higher. Anything reporting a sample count to a human has to say
// so, or the cap gets mistaken for the measurement.
export const SAMPLE_LIMITS = {
  heartRate: 5000,
  sleep: 200,
  weight: 1000,
};

// Raw samples over an arbitrary window. This is the reason this plugin was chosen
// over the alternatives: with no workout started on the watch there is no exercise
// session to read, so heart rate has to come from samples bounded by FitTrack's own
// session start and end.
// ⚠ `ascending: true` matters to every caller that reads a wide window: the cap
// keeps the FIRST `limit` samples in time order, so a truncated read loses the
// NEWEST data, not the oldest. Anything deriving "most recent" from a read that
// might be capped is therefore reading the newest sample that happened to fit.
// See probeHealthData in healthSync.js for how to get the real one.
async function readSamples(dataType, startMs, endMs, limit = SAMPLE_LIMITS[dataType] ?? 5000) {
  const res = await safe(`readSamples(${dataType})`, () =>
    Health.readSamples({ dataType, startDate: iso(startMs), endDate: iso(endMs), limit, ascending: true }),
  );
  return res?.samples ?? [];
}

export const readHeartRate = (startMs, endMs) => readSamples('heartRate', startMs, endMs);
export const readSleep = (startMs, endMs) => readSamples('sleep', startMs, endMs);
export const readWeight = (startMs, endMs) => readSamples('weight', startMs, endMs);
