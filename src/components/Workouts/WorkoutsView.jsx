import React, { useState } from 'react';
import WeekOverview from './WeekOverview';
import WarmupView from './WarmupView';
import DayDetail from './DayDetail';

export default function WorkoutsView() {
  const [currentDayId, setCurrentDayId] = useState(null);
  const [phase, setPhase] = useState('overview');

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
          <WarmupView dayId={currentDayId} onStartWorkout={() => setPhase('workout')} />
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
