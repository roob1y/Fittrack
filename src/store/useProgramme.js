import useStore from './useStore';

// Convenience selectors that always read from the active programme slice.
// Use these everywhere instead of useStore(s => s.completedDays) etc.

export function useProgrammeSlice() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[activeProgrammeId]);
  return slice ?? {
    completedDays: {},
    skippedDays: {},
    setData: {},
    notes: {},
    exerciseNotes: {},
    sessionTimes: {},
    workoutDates: {},
    programmeStartDate: null,
  };
}

// Individual selectors for components that only need one value
export function useCompletedDays() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.completedDays ?? {});
}

export function useSkippedDays() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.skippedDays ?? {});
}

export function useSetData() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.setData ?? {});
}

export function useNotes() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.notes ?? {});
}

export function useExerciseNotes() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.exerciseNotes ?? {});
}

export function useSessionTimes() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.sessionTimes ?? {});
}

export function useWorkoutDates() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.workoutDates ?? {});
}

export function useProgrammeStartDate() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.programmeStartDate ?? null);
}