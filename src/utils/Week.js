// week.js
// Calculates the current programme week from the start date.
// Week 1 starts on programmeStartDate, new week every 7 days.

export function getCurrentWeek(programmeStartDate) {
  if (!programmeStartDate) return 1;
  const start = new Date(programmeStartDate);
  const today = new Date();
  const diffMs = today - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}
