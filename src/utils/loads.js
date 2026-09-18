// ══════════════════════════════════════════
//  loads.js
//  What the muscles actually moved.
// ══════════════════════════════════════════
//
// An assisted chin/dip machine works BACKWARDS from every other machine: the
// number on the stack is a counterweight helping you up, so MORE of it means LESS
// work. Logging that number raw makes the progress graph run in reverse as you get
// stronger — which is exactly what the older `ppl` data did, leaving a Pull-Ups
// "personal best" of 62 that was really an e1RM computed from an assist figure.
//
// So assisted exercises store TWO values:
//   assist  - what you read off the machine, the reproducible measurement
//   weight  - bodyweight minus assist, the effective load
//
// Storing both is deliberate. Every existing consumer — PB detection, the strength
// graph, tonnage, the CSV — already reads `weight`, and they all stay correct
// without knowing assisted exercises exist. `assist` is the provenance.

const STALE_DAYS = 14;

export const isAssisted = (ex) => ex?.assisted === true;

// Bodyweight as of a date, from the log. Returns the nearest entry at or before
// the date, falling back to the earliest entry if the log only starts later.
// `stale` is the honest part: a load computed from a weigh-in months old is a
// guess wearing a measurement's clothes.
export function bodyweightAt(weightLog, dateStr) {
  const entries = Object.entries(weightLog ?? {})
    .map(([date, kg]) => ({ date, kg: Number(kg) }))
    .filter((e) => Number.isFinite(e.kg) && e.kg > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!entries.length) return null;

  const target = String(dateStr ?? '');
  let pick = null;
  for (const e of entries) {
    if (!target || e.date <= target) pick = e;
    else break;
  }
  // Log starts after the date asked for — use the earliest rather than nothing,
  // but it is still flagged by age below.
  if (!pick) pick = entries[0];

  const ageDays = target ? Math.round((new Date(target).getTime() - new Date(pick.date).getTime()) / 86400000) : 0;
  return { kg: pick.kg, date: pick.date, ageDays, stale: Math.abs(ageDays) > STALE_DAYS };
}

// bodyweight - assist, never below zero.
export function effectiveFromAssist(bodyweightKg, assistKg) {
  const bw = Number(bodyweightKg);
  const a = Number(assistKg);
  if (!Number.isFinite(bw) || bw <= 0) return null;
  if (!Number.isFinite(a) || a < 0) return null;
  return Math.max(0, Math.round((bw - a) * 10) / 10);
}

// The inverse, for migrating entries that stored the effective load.
export function assistFromEffective(bodyweightKg, effectiveKg) {
  const bw = Number(bodyweightKg);
  const eff = Number(effectiveKg);
  if (!Number.isFinite(bw) || bw <= 0) return null;
  if (!Number.isFinite(eff) || eff < 0) return null;
  return Math.max(0, Math.round((bw - eff) * 10) / 10);
}
