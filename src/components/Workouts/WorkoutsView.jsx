import React, { useState, useEffect } from 'react';
import WeekOverview from './WeekOverview';
import WarmupView from './WarmupView';
import DayDetail from './DayDetail';
import { keepScreenAwake, allowScreenSleep } from '../../plugins/keepAwake';
import { registerBackButton } from '../../hooks/useBackButton';
import { getCurrentWeek } from '../../utils/week';
import useStore from '../../store/useStore';

export default function WorkoutsView() {
  const completedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.completedDays ?? {});
  const programmeStartDate = useStore((s) => s.programmeData[s.activeProgrammeId]?.programmeStartDate ?? null);
  const [currentDayId, setCurrentDayId] = useState(null);
  const [phase, setPhase] = useState('overview');

  // Keep screen awake during active workout phases
  useEffect(() => {
    if (phase === 'warmup' || phase === 'workout') {
      keepScreenAwake();
    } else {
      allowScreenSleep();
    }
    return () => allowScreenSleep();
  }, [phase]);

  // Android back button — navigate within the app, never exit
  useEffect(() => {
    const cleanup = registerBackButton(() => {
      if (phase === 'warmup') {
        // Delegate to warmup's internal back handler
        if (window.__warmupGoBack) {
          window.__warmupGoBack();
        } else {
          handleBack();
        }
      } else if (phase === 'workout') {
        handleBack();
      }
      // On overview, do nothing — back button is swallowed, app stays open
    });
    return cleanup;
  }, [phase]);

  function handleSelectDay(dayId) {
    setCurrentDayId(dayId);
    setPhase('warmup');
    window.scrollTo({ top: 0 });
  }

  function handleBack() {
    setCurrentDayId(null);
    setPhase('overview');
    window.scrollTo({ top: 0 });
  }

  return (
    <div>
      {phase === 'overview' && <WeekOverview onSelectDay={handleSelectDay} />}
      {phase === 'warmup' && (
        <>
          <button className="back-btn" onClick={handleBack}>
            ← BACK TO WEEK
          </button>
          <WarmupView
            dayId={currentDayId}
            onBack={handleBack}
            onStartWorkout={() => {
              setPhase('workout');
              // session timer now handled inside DayDetail
            }}
          />
        </>
      )}
      {phase === 'workout' && (
        <>
          <button className="back-btn" onClick={handleBack}>
            ← BACK TO WEEK
          </button>
          <DayDetail dayId={currentDayId} onBack={handleBack} />
        </>
      )}
    </div>
  );
}
