// ── Key lists ─────────────────────────────────────────────────────────

const GLOBAL_KEYS = [
  'pbs',
  'pbsAchieved',
  'weightLog',
  'weightUnit',
  'equipment',
  'quoteTone',
  'restDurationOverride',
  'measurementLog',
  'measurementUnit',
  'heightCm',
  'gender',
  'measurementGoals',
  'barWeights',
];

// Keys that used to live at the top level in v1 backups,
// and now belong inside programmeData['5day']
const LEGACY_PROGRAMME_KEYS = [
  'completedDays',
  'skippedDays',
  'setData',
  'notes',
  'exerciseNotes',
  'sessionTimes',
  'workoutDates',
  'programmeStartDate',
];

// ── Migration: v1 flat backup → v2 nested structure ──────────────────

function migrateV1ToV2(data) {
  const programmeSlice = {};
  LEGACY_PROGRAMME_KEYS.forEach((k) => {
    if (data[k] !== undefined) {
      programmeSlice[k] = data[k];
    }
  });

  return {
    activeProgrammeId: '5day',
    programmeData: {
      '5day': {
        completedDays: programmeSlice.completedDays ?? {},
        skippedDays: programmeSlice.skippedDays ?? {},
        setData: programmeSlice.setData ?? {},
        notes: programmeSlice.notes ?? {},
        exerciseNotes: programmeSlice.exerciseNotes ?? {},
        sessionTimes: programmeSlice.sessionTimes ?? {},
        workoutDates: programmeSlice.workoutDates ?? {},
        programmeStartDate: programmeSlice.programmeStartDate ?? null,
      },
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
    },
  };
}

// ── Main import ───────────────────────────────────────────────────────

export function importJSON(file, onSuccess, onError) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);

      if (!parsed.data || typeof parsed.data !== 'object') {
        onError('Invalid backup file.');
        return;
      }

      const raw = localStorage.getItem('fittrack-store');
      const existing = raw ? JSON.parse(raw) : { state: {}, version: 0 };

      const data = parsed.data;
      const backupVersion = parsed.version ?? 1;

      // ── Restore global keys (same in v1 and v2) ──
      GLOBAL_KEYS.forEach((k) => {
        if (data[k] !== undefined) {
          existing.state[k] = data[k];
        }
      });

      if (backupVersion >= 2) {
        // ── v2 backup: restore programme data as-is ──
        if (data.activeProgrammeId) {
          existing.state.activeProgrammeId = data.activeProgrammeId;
        }
        if (data.programmeData) {
          // Merge: preserve any programme slots not in the backup,
          // restore all slots that are in the backup
          existing.state.programmeData = {
            ...(existing.state.programmeData ?? {}),
            ...data.programmeData,
          };
        }
      } else {
        // ── v1 backup: migrate flat keys into programmeData['5day'] ──
        const migrated = migrateV1ToV2(data);
        existing.state.activeProgrammeId = migrated.activeProgrammeId;
        existing.state.programmeData = {
          ...(existing.state.programmeData ?? {}),
          ...migrated.programmeData,
        };
      }

      localStorage.setItem('fittrack-store', JSON.stringify(existing));
      onSuccess();
    } catch (err) {
      console.error('Import error:', err);
      onError('Could not read backup file.');
    }
  };

  reader.onerror = () => onError('File read failed.');
  reader.readAsText(file);
}
