// ══════════════════════════════════════════
//  slots.js
//  One TILE per slot: the day list's unit of "a thing to do".
// ══════════════════════════════════════════
//
// Two entries in a day can be the same movement done on different equipment —
// the two leg presses, where the plate-loaded and the selectorised machine are
// not interchangeable on the numbers (sled weight and lever ratio differ, so
// the same figure is a different load) but ARE interchangeable in the session:
// he does whichever is free, never both.
//
// They stay SEPARATE exercises so each keeps its own history — that is the
// whole point of the split, and nothing here changes it. What this module does
// is stop the day list rendering them as two things to do. Entries sharing a
// `slot` collapse into one tile carrying both as `options`, and the ⇄ button
// picks which one the tile is showing.
//
// The choice is stored per week+day rather than held in component state,
// because it has to survive leaving the screen mid-session, and because a
// finished session should still open on the machine it was actually done on.

import { exerciseKeyPart, setKey } from './setKeys';

// Programme order, with slot-mates folded into the first one's position.
// An exercise with no `slot` is a tile with a single option, so callers can
// treat every tile the same way.
export function dayTiles(day) {
  const tiles = [];
  const bySlot = new Map();
  for (const ex of day?.exercises ?? []) {
    if (ex.slot && bySlot.has(ex.slot)) {
      bySlot.get(ex.slot).options.push(ex);
      continue;
    }
    const tile = { slot: ex.slot ?? null, options: [ex] };
    if (ex.slot) bySlot.set(ex.slot, tile);
    tiles.push(tile);
  }
  return tiles;
}

// `week9_legs-v2_leg-press` — which machine this tile is showing that session.
export function slotChoiceKey(weekNum, dayId, slot) {
  return `week${weekNum}_${dayId}_${slot}`;
}

// Has anything actually been entered for this exercise in this week's session?
// Counts a set as logged on any value the user could have typed, not just
// `done` — a weight entered on a set not yet ticked is still his data.
export function loggedSetCount(setData, weekNum, dayId, ex) {
  let n = 0;
  for (let si = 0; si < (ex.sets ?? 0); si++) {
    const d = setData?.[setKey(weekNum, dayId, ex, si)];
    if (d && (d.done || d.weight || d.reps || d.assist)) n++;
  }
  return n;
}

// Can this exercise be done with the equipment the user has ticked — either as
// itself or via its own alternative? Mirrors `resolveExercise` in DayDetail: an
// exercise with a usable alternative still renders as something to do.
export function isUsable(ex, equipment) {
  const has = (req) => !req || req.length === 0 || req.every((e) => equipment?.includes(e));
  return has(ex.equipment) || (ex.alternative ? has(ex.alternative.equipment) : false);
}

// Which option a tile shows, in priority order:
//
//   1. what he explicitly picked with ⇄ for this week+day;
//   2. whichever option already has sets logged this session — so opening a
//      finished day shows the machine it was done on, and a swap made before
//      this field existed still reads correctly;
//   3. whichever he used most recently in an earlier week;
//   4. the first option in programme order.
//
// Deterministic given the data, so the tile cannot change under him mid-set.
//
// An explicit choice wins outright. Everything below it prefers an option his
// equipment can actually do: collapsing two entries into one tile must not hide
// the only doable one behind the ⇄ and leave the tile reading "no alternative
// available for your equipment".
export function pickOption(tile, { weekNum, dayId, setData, slotChoices, equipment }) {
  let options = tile.options;
  if (options.length === 1) return options[0];

  const stored = tile.slot ? slotChoices?.[slotChoiceKey(weekNum, dayId, tile.slot)] : null;
  if (stored) {
    const match = options.find((o) => exerciseKeyPart(o) === stored);
    if (match) return match;
  }

  if (equipment) {
    const usable = options.filter((o) => isUsable(o, equipment));
    if (usable.length) options = usable;
  }

  let best = null;
  let bestCount = 0;
  for (const o of options) {
    const n = loggedSetCount(setData, weekNum, dayId, o);
    if (n > bestCount) {
      best = o;
      bestCount = n;
    }
  }
  if (best) return best;

  for (let w = weekNum - 1; w >= 1; w--) {
    for (const o of options) {
      if (loggedSetCount(setData, w, dayId, o) > 0) return o;
    }
  }
  return options[0];
}

// The exercises a day actually asks for, one per slot. Set counts, progress
// bars and duration estimates must use this rather than `day.exercises`, or a
// Legs day can never reach 100% — three of its sets belong to a machine he was
// never going to touch.
export function activeExercises(day, ctx) {
  return dayTiles(day).map((tile) => pickOption(tile, ctx));
}
