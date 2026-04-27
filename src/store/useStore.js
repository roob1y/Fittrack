import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const emptyProgrammeData = () => ({
  completedDays: {},
  skippedDays: {},
  setData: {},
  notes: {},
  exerciseNotes: {},
  sessionTimes: {},
  workoutDates: {},
  programmeStartDate: null,
});

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
      pbs: {},
      pbsAchieved: {},
      weightLog: {},
      weightUnit: 'kg',
      equipment: null,
      quoteTone: 'positive',
      lastSetLoggedAt: null,
      restDurationOverride: null,
      measurementLog: {},
      measurementUnit: 'cm',
      heightCm: null,
      gender: 'male',
      measurementGoals: {},
      barWeights: { '7ft': 20, '5ft': 15 },

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

      saveSessionTime: (key, mins) =>
        get()._updateActive((slice) => ({
          sessionTimes: { ...slice.sessionTimes, [key]: mins },
        })),

      saveWorkoutDate: (key, date) =>
        get()._updateActive((slice) => ({
          workoutDates: { ...slice.workoutDates, [key]: date },
        })),

      setProgrammeStartDate: (date) => get()._updateActive(() => ({ programmeStartDate: date })),

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
        }),
    }),
    {
      name: 'fittrack-store',
    },
  ),
);

export default useStore;
