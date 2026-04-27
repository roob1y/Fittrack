export function migrateStoreIfNeeded() {
  try {
    const raw = localStorage.getItem('fittrack-store');
    if (!raw) return; // fresh install, nothing to migrate

    const stored = JSON.parse(raw);
    const state = stored?.state;
    if (!state) return;

    // Already migrated — has the new shape
    if (state.programmeData) return;

    console.log('[FitTrack] Migrating store from v1 to v2...');

    // Pull all legacy flat keys
    const slice = {
      completedDays: state.completedDays ?? {},
      skippedDays: state.skippedDays ?? {},
      setData: state.setData ?? {},
      notes: state.notes ?? {},
      exerciseNotes: state.exerciseNotes ?? {},
      sessionTimes: state.sessionTimes ?? {},
      workoutDates: state.workoutDates ?? {},
      programmeStartDate: state.programmeStartDate ?? null,
    };

    // Build new shape
    state.activeProgrammeId = '5day';
    state.programmeData = {
      '5day': slice,
      ppl: {
        completedDays: {},
        skippedDays: {},
        setData: {},
        notes: {},
        exerciseNotes: {},
        sessionTimes: {},
        workoutDates: {},
        programmeStartDate: null,
      },
    };

    // Remove old flat keys — they're now inside programmeData
    const legacyKeys = [
      'completedDays',
      'skippedDays',
      'setData',
      'notes',
      'exerciseNotes',
      'sessionTimes',
      'workoutDates',
      'programmeStartDate',
    ];
    legacyKeys.forEach((k) => delete state[k]);

    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));

    console.log('[FitTrack] Store migration complete.');
  } catch (err) {
    console.error('[FitTrack] Store migration failed:', err);
    // Don't throw — a failed migration is better than a crashed app
  }
}
