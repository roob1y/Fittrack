import { useMemo } from 'react';
import useStore from '../store/useStore';
import { PROGRAMMES } from '../data/program';
import { bodyweightAt } from '../utils/loads';
import { rankBoard } from '../utils/ranks';

// The whole rank board for the active programme, memoised on the slice.
// Bodyweight is the latest weigh-in — every score leans on it, which is why the
// Body tab keeps nagging for a fresh one.
export default function useRankBoard() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const weightLog = useStore((s) => s.weightLog);
  return useMemo(() => {
    const days = PROGRAMMES[activeProgrammeId]?.days ?? [];
    const bw = bodyweightAt(weightLog, new Date().toISOString().slice(0, 10));
    return { board: rankBoard(days, slice, bw?.kg ?? null), bodyweight: bw };
  }, [activeProgrammeId, slice, weightLog]);
}
