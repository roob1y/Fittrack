// Week.js
// Week is now manually controlled by the user via the store.
// getCurrentWeek is kept for legacy call sites but should be replaced with
// the currentWeek value from useStore directly.

export function getCurrentWeek(programmeStartDate) {
  // Deprecated: use useStore(s => s.currentWeek) instead.
  // Kept only to avoid import errors in files not yet migrated.
  return 1;
}
