import React, { useState, useEffect } from 'react';
import useStore from './store/useStore';
import WorkoutsView from './components/Workouts/WorkoutsView';
import WeightView from './components/Weight/WeightView';
import ProgressView from './components/Progress/ProgressView';
import SettingsView from './components/Settings/SettingsView';
import { registerBackButton } from './hooks/useBackButton';
import { getCurrentWeek } from './utils/week';

export default function App() {
  const [currentView, setCurrentView] = useState('workouts');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsClosing, setSettingsClosing] = useState(false);

  const equipment = useStore((s) => s.equipment);
  const programmeStartDate = useStore((s) => s.programmeStartDate);

  const weekNum = getCurrentWeek(programmeStartDate);

  // Top-level back button
  useEffect(() => {
    const cleanup = registerBackButton(() => {
      if (settingsOpen) {
        closeSettings();
        return;
      }
    });
    return cleanup;
  }, [settingsOpen]);

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
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '28px',
              color: 'var(--accent)',
            }}
          ></div>
          <div
            className="week-badge"
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
              width="22"
              height="22"
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
            onClick={() => {
              setCurrentView(view);
              window.scrollTo({ top: 0 });
            }}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      <div className="view active">
        {currentView === 'workouts' && <WorkoutsView />}
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
    </>
  );
}
