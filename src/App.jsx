import React, { useState } from 'react';
import useStore from './store/useStore';

import WorkoutsView from './components/Workouts/WorkoutsView';
import ProgressView from './components/Progress/ProgressView';
import WeightView from './components/Weight/WeightView';
import CalendarView from './components/Calendar/CalendarView';
import SettingsView from './components/Settings/SettingsView';

export default function App() {
  const weekNum = useStore((s) => s.weekNum);
  const saveWeekNum = useStore((s) => s.saveWeekNum);
  const equipment = useStore((s) => s.equipment);
  const [currentView, setCurrentView] = useState(equipment ? 'workouts' : 'settings');
  
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
            onClick={() => setCurrentView('settings')}
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
        {currentView === 'settings' && <SettingsView onEquipmentSaved={() => setCurrentView('workouts')} />}
      </div>
    </>
  );
}
