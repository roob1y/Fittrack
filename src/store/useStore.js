import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // State
      completedDays: {},
      skippedDays: {},
      setData: {},
      notes: {},
      exerciseNotes: {},
      sessionTimes: {},
      workoutDates: {},
      pbs: {},
      pbsAchieved: {},
      weightLog: {},
      weightUnit: 'kg',
      programmeStartDate: null,
      equipment: null,
      quoteTone: 'positive',
      lastSetLoggedAt: null,
      restDurationOverride: null,
      measurementLog: {},
      measurementUnit: 'cm',
      heightCm: null,
      gender: 'male',

      // Actions
      setQuoteTone: (tone) => set({ quoteTone: tone }),

      saveCompletedDay: (key) =>
        set((state) => ({
          completedDays: { ...state.completedDays, [key]: true },
        })),

      removeCompletedDay: (key) =>
        set((state) => {
          const updated = { ...state.completedDays };
          delete updated[key];
          return { completedDays: updated };
        }),

      saveSkippedDay: (key, reason) =>
        set((state) => ({
          skippedDays: { ...state.skippedDays, [key]: reason },
        })),

      removeSkippedDay: (key) =>
        set((state) => {
          const updated = { ...state.skippedDays };
          delete updated[key];
          return { skippedDays: updated };
        }),

      saveSetData: (key, field, val) =>
        set((state) => ({
          setData: {
            ...state.setData,
            [key]: { ...state.setData[key], [field]: val },
          },
        })),

      saveNote: (key, val) =>
        set((state) => ({
          notes: { ...state.notes, [key]: val },
        })),

      saveExerciseNote: (key, val) =>
        set((state) => ({
          exerciseNotes: { ...state.exerciseNotes, [key]: val },
        })),

      saveSessionTime: (key, mins) =>
        set((state) => ({
          sessionTimes: { ...state.sessionTimes, [key]: mins },
        })),

      saveWorkoutDate: (key, date) =>
        set((state) => ({
          workoutDates: { ...state.workoutDates, [key]: date },
        })),

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

      logWeight: (date, kg) =>
        set((state) => ({
          weightLog: { ...state.weightLog, [date]: kg },
        })),

      setWeightUnit: (unit) => set({ weightUnit: unit }),

      convertSetDataUnits: (fromUnit, toUnit) =>
        set((state) => {
          const factor = fromUnit === 'kg' && toUnit === 'lbs' ? 2.2046 : 1 / 2.2046;
          const converted = {};
          for (const [key, val] of Object.entries(state.setData)) {
            const w = parseFloat(val.weight);
            converted[key] = {
              ...val,
              weight:
                val.weight && !isNaN(w)
                  ? String(Math.round(w * factor * 4) / 4) // round to nearest 0.25
                  : val.weight,
            };
          }
          return { setData: converted };
        }),
      setProgrammeStartDate: (date) => set({ programmeStartDate: date }),

      setEquipment: (equipment) => set({ equipment }),

      setLastSetLoggedAt: (ts) => set({ lastSetLoggedAt: ts }),

      setRestDurationOverride: (overrides) => set({ restDurationOverride: overrides }),

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

      resetAll: () =>
        set({
          completedDays: {},
          skippedDays: {},
          setData: {},
          notes: {},
          exerciseNotes: {},
          sessionTimes: {},
          workoutDates: {},
          pbs: {},
          pbsAchieved: {},
          weightLog: {},
          weightUnit: 'kg',
          programmeStartDate: null,
          equipment: null,
          lastSetLoggedAt: null,
          restDurationOverride: null,
          measurementLog: {},
          measurementUnit: 'cm',
          heightCm: null,
          gender: 'male',
        }),
    }),
    {
      name: 'fittrack-store',
    },
  ),
);

export default useStore;
