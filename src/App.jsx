import React, { useState, useEffect } from 'react';
import useStore from './store/useStore';
import WorkoutsView from './components/Workouts/WorkoutsView';
import BodyView from './components/Body/BodyView';
import ProgressView from './components/Progress/ProgressView';
import SettingsView from './components/Settings/SettingsView';
import ProgrammeView from './components/Programme/ProgrammeView';
import RankChip from './components/Ranks/RankChip';
import Icon from './components/ui/Icon';
import { registerBackButton } from './hooks/useBackButton';

const TABS = [
  { id: 'workouts', label: 'Today', icon: 'home' },
  { id: 'progress', label: 'Progress', icon: 'trend' },
  { id: 'body', label: 'Body', icon: 'body' },
  { id: 'programme', label: 'Programme', icon: 'calendar' },
];

export default function App() {
  const [currentView, setCurrentView] = useState('workouts');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsClosing, setSettingsClosing] = useState(false);
  // Deep link into a Progress sub-screen (the rank chip opens Ranks).
  const [progressScreen, setProgressScreen] = useState(null);

  const equipment = useStore((s) => s.equipment);

  useEffect(() => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [currentView]);

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

  function openRanks() {
    setProgressScreen('ranks');
    setCurrentView('progress');
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
      <header className="app-header">
        <div className="wordmark">
          Fit<b>Track</b>
        </div>
        <div className="header-right">
          <RankChip onClick={openRanks} />
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <Icon name="settings" size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="view active">
        {currentView === 'workouts' && <WorkoutsView />}
        {currentView === 'body' && <BodyView />}
        {currentView === 'progress' && (
          <ProgressView initialScreen={progressScreen} onScreenConsumed={() => setProgressScreen(null)} />
        )}
        {currentView === 'programme' && <ProgrammeView />}
      </div>

      {settingsOpen && (
        <>
          <div className="scrim" onClick={closeSettings} />
          <div className={`bottom-sheet${settingsClosing ? ' closing' : ''}`}>
            <div className="sheet-handle" />
            <SettingsView onEquipmentSaved={() => setSettingsOpen(false)} />
          </div>
        </>
      )}

      <nav className="bottom-nav">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`bottom-nav-btn${currentView === id ? ' active' : ''}`}
            onClick={() => setCurrentView(id)}
          >
            <Icon name={icon} size={22} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
