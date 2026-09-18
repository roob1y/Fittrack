// The shape of the store's per-programme data, and the empty object every
// selector should fall back to. Both live here rather than in useStore.js so
// that migrateStore.js can import them: bootstrap.js runs the migrations before
// anything reaches useStore.js, and this module imports nothing, so pulling it
// in cannot trip that ordering.

export const emptyProgrammeData = () => ({
  completedDays: {},
  skippedDays: {},
  setData: {},
  notes: {},
  exerciseNotes: {},
  sessionTimes: {},
  workoutDates: {},
  // Per-session Health Connect data, keyed like the rest by dayKey. Holds the
  // session's time window so it can be filled in later — Samsung Health syncs to
  // Health Connect on its own schedule, so heart rate is usually not there yet at
  // the moment the day is marked complete.
  sessionHealth: {},
  // Exercises deliberately held at their current weight, keyed by holdKey(). The
  // app suggests a weight increase whenever the reps say you have earned one; it
  // cannot know that a rotator cuff wants a few more weeks at 14 kg. This is where
  // that decision lives — a user judgement, so the store rather than program.js.
  //   { [holdKey]: { since: '2026-08-31' } }
  heldExercises: {},
  // Which exercise a shared `slot` is showing, keyed by slotChoiceKey(). Two
  // entries sharing a slot are one thing to do on either of two machines — the
  // leg presses — and this records which one he picked that session.
  //   { 'week9_legs-v2_leg-press': 'leg-press-machine' }
  slotChoices: {},
  programmeStartDate: null,
});

// One shared object for `?? EMPTY` fallbacks in selectors. Never write to it.
//
// `useStore((s) => s.programmeData[id]?.heldExercises ?? {})` reads as harmless
// and is not: the literal is a NEW object on every call, so when the key is
// genuinely missing the selector never returns the same value twice. zustand v5
// reads selectors through useSyncExternalStore, which compares snapshots with
// Object.is, so a fresh identity means "the store changed" — React re-renders,
// the selector runs, the snapshot differs again, and the component loops until
// it throws React error #185. That is what a brand-new slice field did to every
// store persisted before it existed: a black Workouts screen.
export const EMPTY = {};
