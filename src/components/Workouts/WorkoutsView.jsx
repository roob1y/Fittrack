import React, { useState, useEffect } from 'react';
import TodayView from '../Today/TodayView';
import Icon from '../ui/Icon';
import WarmupView from './WarmupView';
import DayDetail from './DayDetail';
import { keepScreenAwake, allowScreenSleep } from '../../plugins/keepAwake';
import { registerBackButton } from '../../hooks/useBackButton';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { EMPTY } from '../../store/shape';

export default function WorkoutsView() {
  const completedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.completedDays ?? EMPTY);
  const currentWeek = useStore((s) => s.currentWeek);
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const resetDaySession = useStore((s) => s.resetDaySession);
  const [currentDayId, setCurrentDayId] = useState(null);
  const [phase, setPhase] = useState('overview');
  const [showExitModal, setShowExitModal] = useState(false);

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
    const isDone = !!completedDays[`week${currentWeek}_${dayId}`];
    setPhase(isDone ? 'workout' : 'warmup');
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  function handleBack(skipConfirm = false) {
    if (!skipConfirm && phase === 'workout') {
      const isDone = !!completedDays[`week${currentWeek}_${currentDayId}`];
      if (isDone) {
        setCurrentDayId(null);
        setPhase('overview');
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        return;
      }
      setShowExitModal(true);
      return;
    }
    setCurrentDayId(null);
    setPhase('overview');
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  function confirmExit() {
    setShowExitModal(false);
    setCurrentDayId(null);
    setPhase('overview');
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  function confirmReset() {
    resetDaySession(currentWeek, currentDayId, PROGRAMMES[activeProgrammeId]);
    setShowExitModal(false);
    setCurrentDayId(null);
    setPhase('overview');
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  return (
    <div>
      {phase === 'overview' && <TodayView onSelectDay={handleSelectDay} />}
      {phase === 'warmup' && (
        <>
          <button className="back-btn" onClick={() => handleBack()}>
            <Icon name="arrowLeft" size={16} /> Back to today
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
          <button className="back-btn" onClick={() => handleBack()}>
            <Icon name="arrowLeft" size={16} /> Back to today
          </button>
          <DayDetail dayId={currentDayId} onBack={handleBack} />
        </>
      )}

      {showExitModal && (
        <>
          <div className="scrim" onClick={() => setShowExitModal(false)} />
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="display display-md" style={{ marginBottom: 8 }}>
              Leave workout?
            </div>
            <div className="meta-2" style={{ marginBottom: 20, lineHeight: 1.5 }}>
              Your sets are saved. You can pick up where you left off.
            </div>
            <div className="row" style={{ gap: 10, marginBottom: 10 }}>
              <button className="btn btn-primary grow" style={{ fontSize: 16 }} onClick={() => setShowExitModal(false)}>
                Keep going
              </button>
              <button className="btn btn-ghost grow" onClick={confirmExit}>
                Leave
              </button>
            </div>
            {!completedDays[`week${currentWeek}_${currentDayId}`] && (
              <button className="btn btn-danger btn-block" onClick={confirmReset}>
                Leave &amp; reset session
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
