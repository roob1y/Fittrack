// ══════════════════════════════════════════
//  dateRange.js
//  Scoping the Progress screens to a stretch of calendar time.
// ══════════════════════════════════════════
//
// Requested 7 Sep: "being able to select the months, weeks or days of workouts
// might be useful."
//
// Note that this is CALENDAR time, deliberately, and that is the point of it.
// Everywhere else the app counts in `currentWeek`, which is one pass through the
// programme rather than seven days — he trains the split roughly 2.5 times a
// calendar week, so "week 9" and "the week of the 27th" are different spans.
// Filtering on the session's own date is the only way to ask "what did I do last
// month" and get an answer that means what it says.

export const RANGES = [
  { id: '14d', label: '14 days', days: 14 },
  { id: '1m', label: '1 month', days: 30 },
  { id: '3m', label: '3 months', days: 91 },
  { id: 'all', label: 'All', days: null },
];

export const DEFAULT_RANGE = 'all';

export function rangeById(id) {
  return RANGES.find((r) => r.id === id) ?? RANGES[RANGES.length - 1];
}

// The earliest date the range admits, as an ISO day string, or null for "all".
// Anchored on today rather than on the newest session: if he has not trained for
// three weeks, "14 days" should show an empty fortnight, not silently slide back
// to whenever he last went.
export function rangeStart(id, today = new Date()) {
  const { days } = rangeById(id);
  if (!days) return null;
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Filter anything carrying an ISO date. Items without a date are kept — a missing
// date is a data gap, and silently dropping rows would hide it.
export function withinRange(items, id, key = 'date', today = new Date()) {
  const from = rangeStart(id, today);
  if (!from) return items;
  return items.filter((it) => !it?.[key] || it[key] >= from);
}
