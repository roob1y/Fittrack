import useStore from './useStore';
import { EMPTY } from './shape';

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
  return useStore((s) => s.programmeData[activeProgrammeId]?.completedDays ?? EMPTY);
}

export function useSkippedDays() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.skippedDays ?? EMPTY);
}

export function useSetData() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.setData ?? EMPTY);
}

export function useNotes() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.notes ?? EMPTY);
}

export function useExerciseNotes() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.exerciseNotes ?? EMPTY);
}

export function useSessionTimes() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.sessionTimes ?? EMPTY);
}

export function useWorkoutDates() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.workoutDates ?? EMPTY);
}

export function useProgrammeStartDate() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  return useStore((s) => s.programmeData[activeProgrammeId]?.programmeStartDate ?? null);
}