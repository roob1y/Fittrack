import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PROGRAMMES } from '../data/program';
import { setKey, dayKey } from '../utils/setKeys';
import { migrationsHaveRun } from '../utils/migrateStore';
import { emptyProgrammeData } from './shape';

// If this fires, something imported the store before src/bootstrap.js ran. The
// store is about to hydrate from un-migrated localStorage and the app will look
// empty. Fix the import order in main.jsx rather than the migration.
if (typeof localStorage !== 'undefined' && !migrationsHaveRun) {
  console.error('[FitTrack] Store created before migrations ran — check that main.jsx imports ./bootstrap first.');
}

const useStore = create(
  persist(
    (set, get) => ({
      // ── Programme selection ──────────────────────────────────────────
      activeProgrammeId: '5day',
      programmeData: {
        '5day': emptyProgrammeData(),
        ppl: emptyProgrammeData(),
      },

      // ── Global state ─────────────────────────────────────────────────
      currentWeek: 1,
      pbs: {},
      pbsAchieved: {},
      weightLog: {},
      weightUnit: 'kg',
      equipment: null,
      quoteTone: 'positive',
      // Which calendar range the Progress screens are scoped to (see
      // utils/dateRange.js). A plain string, so a store persisted before this
      // field existed reads `undefined` and the selector's `?? DEFAULT_RANGE`
      // returns a stable primitive — the `?? {}` identity trap of bug 22 only
      // bites on object and array literals.
      progressRange: 'all',
      lastSetLoggedAt: null,
      restDurationOverride: null,
      measurementLog: {},
      measurementUnit: 'cm',
      heightCm: null,
      gender: 'male',
      measurementGoals: {},
      barWeights: { '7ft': 20, '5ft': 15 },
      activeSessionStart: null,
      healthEnabled: false,
      healthLastSync: null,

      // ── Programme actions ────────────────────────────────────────────
      setActiveProgramme: (id) =>
        set((state) => ({
          activeProgrammeId: id,
          programmeData: {
            ...state.programmeData,
            [id]: state.programmeData[id] ?? emptyProgrammeData(),
          },
        })),

      _updateActive: (updater) =>
        set((state) => {
          const id = state.activeProgrammeId;
          const slice = state.programmeData[id] ?? emptyProgrammeData();
          return {
            programmeData: {
              ...state.programmeData,
              [id]: { ...slice, ...updater(slice) },
            },
          };
        }),

      // ── Workout actions ──────────────────────────────────────────────
      saveCompletedDay: (key) =>
        get()._updateActive((slice) => ({
          completedDays: { ...slice.completedDays, [key]: true },
        })),

      removeCompletedDay: (key) =>
        get()._updateActive((slice) => {
          const updated = { ...slice.completedDays };
          delete updated[key];
          return { completedDays: updated };
        }),

      saveSkippedDay: (key, reason) =>
        get()._updateActive((slice) => ({
          skippedDays: { ...slice.skippedDays, [key]: reason },
        })),

      removeSkippedDay: (key) =>
        get()._updateActive((slice) => {
          const updated = { ...slice.skippedDays };
          delete updated[key];
          return { skippedDays: updated };
        }),

      saveSetData: (key, field, val) =>
        get()._updateActive((slice) => ({
          setData: {
            ...slice.setData,
            [key]: { ...slice.setData[key], [field]: val },
          },
        })),

      saveNote: (key, val) =>
        get()._updateActive((slice) => ({
          notes: { ...slice.notes, [key]: val },
        })),

      saveExerciseNote: (key, val) =>
        get()._updateActive((slice) => ({
          exerciseNotes: { ...slice.exerciseNotes, [key]: val },
        })),

      // Hold an exercise at its current weight, or release it. Records the date so a
      // hold set months ago is visibly old rather than silently permanent.
      toggleHeldExercise: (key) =>
        get()._updateActive((slice) => {
          const held = { ...(slice.heldExercises ?? {}) };
          if (held[key]) delete held[key];
          else held[key] = { since: new Date().toISOString().slice(0, 10) };
          return { heldExercises: held };
        }),

      // Which exercise a shared slot is showing for one week+day — the two leg
      // presses, where he does whichever machine is free. Stored rather than held
      // in component state so it survives leaving the screen mid-session, and so a
      // finished day reopens on the machine it was actually done on.
      setSlotChoice: (key, exerciseKey) =>
        get()._updateActive((slice) => ({
          slotChoices: { ...(slice.slotChoices ?? {}), [key]: exerciseKey },
        })),

      // Merge a patch into one session's health record; never blows away what is
      // already there, since heart rate and sleep can arrive on different passes.
      saveSessionHealth: (key, patch) =>
        get()._updateActive((slice) => ({
          sessionHealth: {
            ...(slice.sessionHealth ?? {}),
            [key]: { ...(slice.sessionHealth?.[key] ?? {}), ...patch },
          },
        })),

      setHealthEnabled: (on) => set({ healthEnabled: !!on }),
      setHealthLastSync: (ts) => set({ healthLastSync: ts }),
      // Used by the weight sync, which merges rather than replaces — see
      // mergeWeightSamples in healthMetrics.js.
      setWeightLog: (weightLog) => set({ weightLog }),

      saveSessionTime: (key, mins) =>
        get()._updateActive((slice) => ({
          sessionTimes: { ...slice.sessionTimes, [key]: mins },
        })),

      saveWorkoutDate: (key, date) =>
        get()._updateActive((slice) => ({
          workoutDates: { ...slice.workoutDates, [key]: date },
        })),

      setProgrammeStartDate: (date) => get()._updateActive(() => ({ programmeStartDate: date })),

      setCurrentWeek: (week) => set({ currentWeek: Math.max(1, week) }),

      setActiveSessionStart: (ts) => set({ activeSessionStart: ts }),
      clearActiveSessionStart: () => set({ activeSessionStart: null }),

      resetDaySession: (weekNum, dayId, programme) => {
        // Wipe all set data, completed/skipped status, workout date and session time for a day
        get()._updateActive((slice) => {
          const setData = { ...slice.setData };
          const exercises = programme?.days?.find((d) => d.id === dayId)?.exercises ?? [];
          exercises.forEach((ex) => {
            for (let si = 0; si < ex.sets; si++) {
              delete setData[setKey(weekNum, dayId, ex, si)];
            }
          });
          const dKey = dayKey(weekNum, dayId);
          const completedDays = { ...slice.completedDays };
          delete completedDays[dKey];
          const skippedDays = { ...slice.skippedDays };
          delete skippedDays[dKey];
          const workoutDates = { ...slice.workoutDates };
          delete workoutDates[dKey];
          const sessionTimes = { ...slice.sessionTimes };
          delete sessionTimes[dKey];
          const sessionHealth = { ...(slice.sessionHealth ?? {}) };
          delete sessionHealth[dKey];
          return { setData, completedDays, skippedDays, workoutDates, sessionTimes, sessionHealth };
        });
        // Clear this day's PB badges, then roll the PB values back to whatever the
        // remaining logged sets support. Without this a reset leaves both the trophy
        // and an inflated all-time best behind.
        const exercises = programme?.days?.find((d) => d.id === dayId)?.exercises ?? [];
        set((state) => {
          const pbsAchieved = { ...state.pbsAchieved };
          exercises.forEach((ex) => {
            delete pbsAchieved[`week${weekNum}_${dayId}_${ex.name}`];
            if (ex.alternative?.name) delete pbsAchieved[`week${weekNum}_${dayId}_${ex.alternative.name}`];
          });
          return { pbsAchieved };
        });
        exercises.forEach((ex) => {
          get().recomputePB(ex.name);
          if (ex.alternative?.name) get().recomputePB(ex.alternative.name);
        });
        set({ activeSessionStart: null, lastSetLoggedAt: null });
      },

      // ── PB actions ───────────────────────────────────────────────────
      savePB: (key, value) =>
        set((state) => {
          const updated = { ...state.pbs };
          if (value === null) delete updated[key];
          else updated[key] = value;
          return { pbs: updated };
        }),

      savePBAchieved: (key) =>
        set((state) => ({
          pbsAchieved: { ...state.pbsAchieved, [key]: true },
        })),

      clearPBAchieved: (key) =>
        set((state) => {
          const updated = { ...state.pbsAchieved };
          delete updated[key];
          return { pbsAchieved: updated };
        }),

      // Recompute an exercise's PB from every logged set across all programmes.
      // Needed because `pbs` is an all-time best keyed on exercise name — unticking
      // or resetting a session must roll it back, or one mistaken entry poisons PB
      // detection permanently.
      recomputePB: (exerciseName) =>
        set((state) => {
          let best = 0;
          for (const [progId, slice] of Object.entries(state.programmeData ?? {})) {
            const days = PROGRAMMES[progId]?.days ?? [];
            const sd = slice?.setData ?? {};
            for (const day of days) {
              day.exercises.forEach((ex) => {
                if (ex.name !== exerciseName && ex.alternative?.name !== exerciseName) return;
                for (let week = 1; week <= 52; week++) {
                  for (let si = 0; si < ex.sets; si++) {
                    const d = sd[setKey(week, day.id, ex, si)];
                    if (!d?.done || !d?.weight || !d?.reps) continue;
                    const e1rm = parseFloat(d.weight) * (1 + parseInt(d.reps) / 30);
                    if (e1rm > best) best = e1rm;
                  }
                }
              });
            }
          }
          const pbs = { ...state.pbs };
          if (best > 0) pbs[exerciseName] = best;
          else delete pbs[exerciseName];
          return { pbs };
        }),

      clearAllPBs: () => set({ pbs: {}, pbsAchieved: {} }),

      // ── Weight log ───────────────────────────────────────────────────
      logWeight: (date, kg) =>
        set((state) => ({
          weightLog: { ...state.weightLog, [date]: kg },
        })),

      setWeightUnit: (unit) => set({ weightUnit: unit }),

      convertSetDataUnits: (fromUnit, toUnit) => {
        const factor = fromUnit === 'kg' && toUnit === 'lbs' ? 2.2046 : 1 / 2.2046;
        set((state) => {
          const updatedProgrammeData = {};
          for (const [progId, slice] of Object.entries(state.programmeData)) {
            const converted = {};
            for (const [key, val] of Object.entries(slice.setData || {})) {
              const w = parseFloat(val.weight);
              converted[key] = {
                ...val,
                weight: val.weight && !isNaN(w) ? String(Math.round(w * factor * 4) / 4) : val.weight,
              };
            }
            updatedProgrammeData[progId] = { ...slice, setData: converted };
          }
          return { programmeData: updatedProgrammeData };
        });
      },

      // ── Equipment ────────────────────────────────────────────────────
      setEquipment: (equipment) => set({ equipment }),
      setBarWeights: (barWeights) => set({ barWeights }),

      // ── Settings ─────────────────────────────────────────────────────
      setQuoteTone: (tone) => set({ quoteTone: tone }),
      setLastSetLoggedAt: (ts) => set({ lastSetLoggedAt: ts }),
      setRestDurationOverride: (overrides) => set({ restDurationOverride: overrides }),

      // ── Measurements ─────────────────────────────────────────────────
      logMeasurement: (date, field, value) =>
        set((state) => ({
          measurementLog: {
            ...state.measurementLog,
            [date]: { ...state.measurementLog[date], [field]: value },
          },
        })),

      setMeasurementUnit: (unit) => set({ measurementUnit: unit }),
      setHeight: (cm) => set({ heightCm: cm }),
      setProgressRange: (id) => set({ progressRange: id }),

      setGender: (gender) => set({ gender }),

      setMeasurementGoal: (key, value) =>
        set((state) => ({
          measurementGoals: { ...state.measurementGoals, [key]: value },
        })),

      // ── Reset ────────────────────────────────────────────────────────
      resetAll: () =>
        set({
          activeProgrammeId: '5day',
          programmeData: {
            '5day': emptyProgrammeData(),
            ppl: emptyProgrammeData(),
          },
          pbs: {},
          pbsAchieved: {},
          weightLog: {},
          weightUnit: 'kg',
          equipment: null,
          lastSetLoggedAt: null,
          restDurationOverride: null,
          measurementLog: {},
          measurementUnit: 'cm',
          heightCm: null,
          gender: 'male',
          measurementGoals: {},
          activeSessionStart: null,
          currentWeek: 1,
          healthEnabled: false,
          healthLastSync: null,
        }),
    }),
    {
      name: 'fittrack-store',
    },
  ),
);

export default useStore;
