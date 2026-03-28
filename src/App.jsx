import React, { useState, useEffect } from 'react';
import useStore from './store/useStore';
import WorkoutsView from './components/Workouts/WorkoutsView';
import CalendarView from './components/Calendar/CalendarView';
import WeightView from './components/Weight/WeightView';
import ProgressView from './components/Progress/ProgressView';
import SettingsView from './components/Settings/SettingsView';
import { registerBackButton } from './hooks/useBackButton';
import { getCurrentWeek } from './utils/week';
import { StatusBar } from '@capacitor/status-bar';

export default function App() {
  const [currentView, setCurrentView] = useState('workouts');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsClosing, setSettingsClosing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarClosing, setCalendarClosing] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionDisplay, setSessionDisplay] = useState('0:00');

  const equipment = useStore((s) => s.equipment);
  const programmeStartDate = useStore((s) => s.programmeStartDate);

  const weekNum = getCurrentWeek(programmeStartDate);

  useEffect(() => {
    StatusBar.getInfo()
      .then((info) => {
        console.log('raw height:', info.height, 'dpr:', window.devicePixelRatio);
        document.documentElement.style.setProperty('--sat', `${info.height}px`);
        document.documentElement.style.setProperty('--sab', '80px');
        console.log(
          'screen height:',
          window.screen.height,
          'inner height:',
          window.innerHeight,
          'outer height:',
          window.outerHeight,
        );
      })
      .catch((e) => console.error('statusbar error:', e.message));
  }, []);

  // Session timer
  useEffect(() => {
    if (!sessionStart) {
      setSessionDisplay('0:00');
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = String(elapsed % 60).padStart(2, '0');
      setSessionDisplay(hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}:${secs}` : `${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Top-level back button
  useEffect(() => {
    const cleanup = registerBackButton(() => {
      if (settingsOpen) {
        closeSettings();
        return;
      }
      if (calendarOpen) {
        closeCalendar();
        return;
      }
    });
    return cleanup;
  }, [settingsOpen, calendarOpen]);

  function closeCalendar() {
    setCalendarClosing(true);
    setTimeout(() => {
      setCalendarOpen(false);
      setCalendarClosing(false);
    }, 280);
  }

  function closeSettings() {
    setSettingsClosing(true);
    setTimeout(() => {
      setSettingsOpen(false);
      setSettingsClosing(false);
    }, 280);
  }

  if (!equipment && !settingsOpen) {
    return (
      <div className="view active">
        <SettingsView onEquipmentSaved={() => {}} />
      </div>
    );
  }

  return (
    <>
      <header>
        <div className="logo">
          <span style={{ color: 'var(--accent)' }}>Fit</span>
          <span style={{ color: 'var(--text)' }}>TRACK</span>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {sessionStart && (
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '28px',
                color: 'var(--accent)',
              }}
            >
              {sessionDisplay}
            </div>
          )}
          <div
            className="week-badge"
            onClick={() => setCalendarOpen(true)}
            style={{ cursor: 'pointer', padding: '10px 20px', fontSize: '15px', fontWeight: 600 }}
          >
            Week {weekNum}
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="nav">
        {['workouts', 'weight', 'progress'].map((view) => (
          <button
            key={view}
            className={`nav-btn${currentView === view ? ' active' : ''}`}
            onClick={() => setCurrentView(view)}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      <div className="view active">
        {currentView === 'workouts' && <WorkoutsView onSessionStart={setSessionStart} />}
        {currentView === 'weight' && <WeightView />}
        {currentView === 'progress' && <ProgressView />}
      </div>

      {/* Settings bottom sheet */}
      {settingsOpen && (
        <>
          <div
            onClick={closeSettings}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80 }}
          />
          <div
            className={`bottom-sheet${settingsClosing ? ' closing' : ''}`}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              borderRadius: '20px 20px 0 0',
              zIndex: 90,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: `0 20px calc(var(--sab, 0px) + 40px)`,
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                background: 'var(--border)',
                borderRadius: '2px',
                margin: '12px auto 20px',
              }}
            />
            <SettingsView onEquipmentSaved={() => setSettingsOpen(false)} />
          </div>
        </>
      )}

      {/* Calendar bottom sheet */}
      {calendarOpen && (
        <>
          <div
            onClick={closeCalendar}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80 }}
          />
          <div
            className={`bottom-sheet${calendarClosing ? ' closing' : ''}`}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              borderRadius: '20px 20px 0 0',
              zIndex: 90,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: `0 20px calc(var(--sab, 0px) + 40px)`,
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                background: 'var(--border)',
                borderRadius: '2px',
                margin: '12px auto 20px',
              }}
            />
            <CalendarView />
          </div>
        </>
      )}
    </>
  );
}
