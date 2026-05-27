import React, { useState, useEffect } from 'react';
import WeekOverview from './WeekOverview';
import WarmupView from './WarmupView';
import DayDetail from './DayDetail';
import { keepScreenAwake, allowScreenSleep } from '../../plugins/keepAwake';
import { registerBackButton } from '../../hooks/useBackButton';
import useStore from '../../store/useStore';

export default function WorkoutsView() {
  const completedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.completedDays ?? {});
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
    setPhase('warmup');
    window.scrollTo({ top: 0 });
  }

  function handleBack(skipConfirm = false) {
    if (!skipConfirm && phase === 'workout') {
      setShowExitModal(true);
      return;
    }
    setCurrentDayId(null);
    setPhase('overview');
    window.scrollTo({ top: 0 });
  }

  function confirmExit() {
    setShowExitModal(false);
    setCurrentDayId(null);
    setPhase('overview');
    window.scrollTo({ top: 0 });
  }

  return (
    <div>
      {phase === 'overview' && <WeekOverview onSelectDay={handleSelectDay} />}
      {phase === 'warmup' && (
        <>
          <button className="back-btn" onClick={() => handleBack()}>
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
          <button className="back-btn" onClick={() => handleBack()}>
            ← BACK TO WEEK
          </button>
          <DayDetail dayId={currentDayId} onBack={handleBack} />
        </>
      )}

      {showExitModal && (
        <div
          onClick={() => setShowExitModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: '20px 20px 0 0',
              borderTop: '1px solid var(--border)',
              padding: '24px 24px calc(24px + var(--sab, 0px))',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>
              Leave workout?
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              Your sets are saved. You can pick up where you left off.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowExitModal(false)}
                style={{
                  flex: 1, padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Keep going
              </button>
              <button
                onClick={confirmExit}
                style={{
                  flex: 1, padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--red, #ff4d6d)',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
