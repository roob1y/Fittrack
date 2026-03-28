import React, { useState, useEffect } from 'react';
import WeekOverview from './WeekOverview';
import WarmupView from './WarmupView';
import DayDetail from './DayDetail';
import { keepScreenAwake, allowScreenSleep } from '../../plugins/keepAwake';
import { registerBackButton } from '../../hooks/useBackButton';

export default function WorkoutsView({ onSessionStart }) {
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
      if (phase === 'warmup' || phase === 'workout') {
        // Back during warmup or workout → return to week overview
        handleBack();
      }
      // On overview, do nothing — back button is swallowed, app stays open
    });
    return cleanup;
  }, [phase]);

  function handleSelectDay(dayId) {
    setCurrentDayId(dayId);
    setPhase('warmup');
  }

  function handleBack() {
    setCurrentDayId(null);
    setPhase('overview');
    onSessionStart(null); // clear timer
  }

  function handleSelectDay(dayId) {
    setCurrentDayId(dayId);
    setPhase('warmup');
  }

  function handleBack() {
    setCurrentDayId(null);
    setPhase('overview');
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
            onStartWorkout={() => {
              setPhase('workout');
              onSessionStart(Date.now()); // start timer
            }}
          />{' '}
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
