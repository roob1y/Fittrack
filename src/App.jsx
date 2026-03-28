import React, { useState } from 'react';
import useStore from './store/useStore';
import WorkoutsView from './components/Workouts/WorkoutsView';
import CalendarView from './components/Calendar/CalendarView';
import WeightView from './components/Weight/WeightView';
import ProgressView from './components/Progress/ProgressView';
import SettingsView from './components/Settings/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState('workouts');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsClosing, setSettingsClosing] = useState(false);
  const weekNum = useStore((s) => s.weekNum);
  const saveWeekNum = useStore((s) => s.saveWeekNum);
  const equipment = useStore((s) => s.equipment);

  if (!equipment && !settingsOpen) {
    return (
      <div className="view active">
        <SettingsView onEquipmentSaved={() => {}} />
      </div>
    );
  }

  function closeSettings() {
    setSettingsClosing(true);
    setTimeout(() => {
      setSettingsOpen(false);
      setSettingsClosing(false);
    }, 280);
  }

  function changeWeek(direction) {
    saveWeekNum(Math.max(1, weekNum + direction));
  }

  return (
    <>
      <header>
        <div className="logo">
          <span style={{ color: 'var(--accent)' }}>Fit</span>
          <span style={{ color: 'var(--text)' }}>TRACK</span>
        </div>
        <div className="header-right">
          <div
            id="headerSessionTimer"
            style={{
              display: 'none',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '24px',
              color: 'var(--accent)',
            }}
          >
            0:00
          </div>
          <div className="week-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => changeWeek(-1)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ‹
            </button>
            <span>Week {weekNum}</span>
            <button
              onClick={() => changeWeek(1)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ›
            </button>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="nav">
        {['workouts', 'calendar', 'weight', 'progress'].map((view) => (
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
        {currentView === 'workouts' && <WorkoutsView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'weight' && <WeightView />}
        {currentView === 'progress' && <ProgressView />}
      </div>

      {/* Settings bottom sheet */}
      {settingsOpen && (
        <>
          <div
            onClick={() => closeSettings()}
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
              padding: '0 20px 40px',
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
