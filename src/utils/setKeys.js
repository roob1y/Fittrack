// ══════════════════════════════════════════
//  setKeys.js
//  The single place storage keys are built.
// ══════════════════════════════════════════
//
// `setData` and `exerciseNotes` used to be keyed by the exercise's INDEX within
// the day — `week1_legs-v2_2_0`. Inserting or reordering an exercise silently
// rebound every set logged after it: when Romanian Deadlifts went in at Legs
// position 2, hack squat numbers surfaced under Romanian Deadlifts and every
// exercise below shifted with them. Nothing errored; the data just quietly
// meant something else.
//
// Keys now carry a stable identifier instead: `ex.id` when program.js supplies
// one, otherwise a slug of `ex.name`. Insert, reorder and delete freely — the
// only change that still needs care is RENAMING an exercise, which moves its
// slug. Pin the old slug with an explicit `id` on that exercise to keep its
// history:
//
//     { id: 'chest-flyes', name: 'Cable Chest Flyes', ... }
//
// Always pass the exercise as it appears in program.js, never the resolved
// substitute from `resolveExercise` — swapping to an alternative has to stay in
// the same slot, or a session logged on the machine version lands somewhere
// different from one logged on the free-weight version.

export function slugify(name) {
  const slug = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'unknown';
}

// The stable segment identifying one exercise inside a day.
// Must never be all digits — that is how the migration tells an un-migrated
// index key from an already-migrated one.
export function exerciseKeyPart(ex) {
  if (!ex) return 'unknown';
  if (ex.id) return slugify(ex.id);
  return slugify(ex.name);
}

// `week3_push-v2` — completed/skipped days, notes, session times, workout dates.
export function dayKey(weekNum, dayId) {
  return `week${weekNum}_${dayId}`;
}

// `week3_push-v2_bench-press` — the per-exercise note for a day.
export function exerciseNoteKey(weekNum, dayId, ex) {
  return `week${weekNum}_${dayId}_${exerciseKeyPart(ex)}`;
}

// `push-v2_bench-press` — an exercise held at its current weight. Not week-scoped:
// holding is a standing decision about the exercise ("my shoulder needs this light
// for a while"), not something re-taken every cycle. Day id is included because an
// exercise slug is only guaranteed unique within its day.
export function holdKey(dayId, ex) {
  return `${dayId}_${exerciseKeyPart(ex)}`;
}

// `week3_push-v2_bench-press_1` — one logged set.
export function setKey(weekNum, dayId, ex, setIndex) {
  return `week${weekNum}_${dayId}_${exerciseKeyPart(ex)}_${setIndex}`;
}
