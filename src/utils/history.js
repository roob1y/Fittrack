// ══════════════════════════════════════════
//  history.js
//  One exercise, more than one day.
// ══════════════════════════════════════════
//
// The weighted-crunch finisher is on Push AND on Pull. It is the same movement
// with the same dumbbell, but set keys carry the day id, so the app kept two
// separate histories and the Pull tile pre-filled 10 kg the day after he had gone
// up to 16 kg on Push:
//
//   "I went up in kg yesterday and it doesnt show here. Maybe because they're on
//    seperate days, but still these should be connected as they are the same
//    exercise."
//
// He is right. What is NOT right is merging the storage: he trains Push and Pull
// inside the same programme week, so a shared key would have 4 Sep's Pull sets
// land on top of 3 Sep's Push sets and destroy one of them. Storage stays keyed by
// day — nothing moves, no migration.
//
// What widens is the LOOKUP. Exercises tagged with the same `historyGroup` in
// program.js are read as one timeline: pre-fills, the weight suggestion and the
// progress graphs all see every session on every day that carries the group.
//
// The group is explicit rather than inferred from a matching name or slug. Two
// exercises sharing a slug across days by accident would otherwise merge silently,
// which is the same shape as every other bug in this app's history: a derived
// value drifting from the thing it mirrors, failing quietly.

import { setKey, dayKey } from './setKeys';

// [{ dayId, ex }] for every day carrying this exercise's history group, the
// exercise's own day first. A single entry when it has no group — so callers can
// treat the grouped and ungrouped cases identically.
export function historyPeers(days, dayId, ex) {
  const self = [{ dayId, ex }];
  if (!ex?.historyGroup || !days) return self;
  const peers = [];
  for (const day of days) {
    for (const other of day.exercises ?? []) {
      if (other === ex && day.id === dayId) continue;
      if (other.historyGroup === ex.historyGroup) peers.push({ dayId: day.id, ex: other });
    }
  }
  return self.concat(peers);
}

// Every logged session of this exercise across its whole group, oldest first:
//   { week, dayId, ex, date, entries: { [si]: savedSet } }
//
// Unlike `sessionsFor` in progressStats.js this keeps sets that were ticked
// without reps, because a pre-fill wants the last weight he touched even when he
// forgot to record how many times he lifted it.
export function groupSessions(days, slice, dayId, ex, maxWeeks = 52) {
  const setData = slice?.setData ?? {};
  const out = [];
  for (const peer of historyPeers(days, dayId, ex)) {
    for (let week = 1; week <= maxWeeks; week++) {
      const date = slice?.workoutDates?.[dayKey(week, peer.dayId)];
      if (!date) continue;
      const entries = {};
      let any = false;
      for (let si = 0; si < (peer.ex.sets ?? 0); si++) {
        const d = setData[setKey(week, peer.dayId, peer.ex, si)];
        if (!d) continue;
        entries[si] = d;
        any = true;
      }
      if (any) out.push({ week, dayId: peer.dayId, ex: peer.ex, date, entries });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Sessions strictly before the one being logged. Dated by the day's own
// `workoutDates` entry where there is one; an in-progress session has no date
// yet, so it falls back to "an earlier week of this same day".
function priorSessions(days, slice, dayId, ex, weekNum) {
  const here = slice?.workoutDates?.[dayKey(weekNum, dayId)] ?? null;
  return groupSessions(days, slice, dayId, ex).filter((s) => {
    if (s.dayId === dayId && s.week === weekNum) return false;
    return here ? s.date < here : true;
  });
}

// The value to pre-fill for one set: what he last put in that box, anywhere in the
// group. Prefers the matching set index, then any set in that session — he does
// not always start on set 1, and a session's load is usually the same throughout.
//
// `via` is the exercise the CURRENT session is being done on (null = the
// programmed one). Only sets logged on the same exercise pre-fill: a Smith
// machine weight must not land in the barbell box, and vice versa.
export function lastLoggedValue(days, slice, dayId, ex, si, field, weekNum, via = null) {
  const sessions = priorSessions(days, slice, dayId, ex, weekNum);
  const same = (d) => d && (d.via ?? null) === (via ?? null);
  for (let i = sessions.length - 1; i >= 0; i--) {
    const { entries } = sessions[i];
    const exact = entries[si];
    if (same(exact) && exact[field]) return exact[field];
    for (const key of Object.keys(entries)) {
      const d = entries[key];
      if (same(d) && d?.[field]) return d[field];
    }
  }
  return null;
}

// The heaviest weight carried in the most recent session of the group — the
// "· 42.5kg last used" line on the tile.
export function lastUsedBestWeight(days, slice, dayId, ex, weekNum, via = null) {
  const sessions = priorSessions(days, slice, dayId, ex, weekNum);
  for (let i = sessions.length - 1; i >= 0; i--) {
    const ws = Object.values(sessions[i].entries)
      .filter((d) => d && (d.via ?? null) === (via ?? null))
      .map((d) => parseFloat(d?.weight))
      .filter((w) => w > 0);
    if (ws.length) return Math.max(...ws);
  }
  return null;
}
