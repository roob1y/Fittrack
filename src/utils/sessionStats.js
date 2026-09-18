// Per-session training load, for charting alongside the watch metrics.
// Kept separate from healthMetrics.js — this one is about the sets, not the wrist.

import { setKey } from './setKeys';

// Total kg moved in one session: sum of weight x reps over completed sets.
// Bodyweight movements contribute nothing, which is the honest answer — the app
// has no way to know what a push-up cost.
export function sessionTonnage(day, setData, week) {
  let tonnage = 0,
    sets = 0,
    reps = 0;
  for (const ex of day?.exercises ?? []) {
    for (let si = 0; si < ex.sets; si++) {
      const d = setData?.[setKey(week, day.id, ex, si)];
      if (!d?.done) continue;
      sets++;
      const w = parseFloat(d.weight),
        r = parseInt(d.reps);
      if (r > 0) reps += r;
      if (w > 0 && r > 0) tonnage += w * r;
    }
  }
  return { tonnage: Math.round(tonnage), sets, reps };
}
