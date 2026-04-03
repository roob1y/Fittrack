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
      sessionTimes: {},
      workoutDates: {},
      pbs: {},
      pbsAchieved: {},
      weightLog: {},
      weightUnit: 'kg',
      programmeStartDate: null,
      equipment: null,
      quoteTone: 'positive',

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

      logWeight: (date, kg) =>
        set((state) => ({
          weightLog: { ...state.weightLog, [date]: kg },
        })),

      setWeightUnit: (unit) => set({ weightUnit: unit }),

      setProgrammeStartDate: (date) => set({ programmeStartDate: date }),

      setEquipment: (equipment) => set({ equipment }),

      resetAll: () =>
        set({
          completedDays: {},
          skippedDays: {},
          setData: {},
          notes: {},
          sessionTimes: {},
          workoutDates: {},
          pbs: {},
          pbsAchieved: {},
          weightLog: {},
          weightUnit: 'kg',
          programmeStartDate: null,
          equipment: null,
        }),
    }),
    {
      name: 'fittrack_v1',
    },
  ),
);

export default useStore;
