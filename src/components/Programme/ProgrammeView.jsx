import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { getCurrentWeek } from '../../utils/week';

const PROGRAMME_ICONS = {
  '5day': '📅',
  ppl: '🔄',
};

const PROGRAMME_COLOURS = {
  '5day': 'var(--accent2)',
  ppl: 'var(--accent)',
};

export default function ProgrammeView() {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const setActiveProgramme = useStore((s) => s.setActiveProgramme);
  const programmeData = useStore((s) => s.programmeData);
  const [confirmId, setConfirmId] = useState(null);

  const activeProgramme = PROGRAMMES[activeProgrammeId];

  function handleSwitch(id) {
    if (id === activeProgrammeId) return;
    setConfirmId(id);
  }

  function confirmSwitch() {
    setActiveProgramme(confirmId);
    setConfirmId(null);
  }

  function getStats(progId) {
    const slice = programmeData[progId];
    if (!slice) return { workouts: 0, week: 1 };
    const workouts = Object.keys(slice.completedDays || {}).length;
    const week = getCurrentWeek(slice.programmeStartDate);
    return { workouts, week };
  }

  return (
    <div>
      <div className="section-title" style={{ marginTop: '4px' }}>
        PROGRAMME
      </div>

      {/* Active programme banner */}
      <div
        style={{
          background: 'var(--card)',
          border: `1px solid ${PROGRAMME_COLOURS[activeProgrammeId]}`,
          borderRadius: 'var(--radius)',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: PROGRAMME_COLOURS[activeProgrammeId],
            letterSpacing: '1.5px',
            marginBottom: '6px',
          }}
        >
          ACTIVE PROGRAMME
        </div>
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '28px',
            letterSpacing: '1px',
            marginBottom: '4px',
          }}
        >
          {PROGRAMME_ICONS[activeProgrammeId]} {activeProgramme.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
          {activeProgramme.shortDescription}
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
          {(() => {
            const stats = getStats(activeProgrammeId);
            return (
              <>
                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '26px',
                      color: PROGRAMME_COLOURS[activeProgrammeId],
                    }}
                  >
                    {stats.workouts}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>WORKOUTS</div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '26px',
                      color: PROGRAMME_COLOURS[activeProgrammeId],
                    }}
                  >
                    {stats.week}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>CURRENT WEEK</div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '26px',
                      color: PROGRAMME_COLOURS[activeProgrammeId],
                    }}
                  >
                    {activeProgramme.days.length}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>DAYS / WEEK</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Day breakdown */}
      <div className="section-title" style={{ fontSize: '20px', marginBottom: '10px' }}>
        DAYS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        {activeProgramme.days.map((day, i) => (
          <div
            key={day.id}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '0.5px' }}>
                {day.label} — {day.focus}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {day.exercises.length} exercises
              </div>
            </div>
            <div style={{ fontSize: '20px' }}>{['💪', '🏋️', '🦵', '🔥', '⚡'][i] ?? '💪'}</div>
          </div>
        ))}
      </div>

      {/* Switch programme */}
      <div className="section-title" style={{ fontSize: '20px', marginBottom: '10px' }}>
        SWITCH PROGRAMME
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.values(PROGRAMMES).map((prog) => {
          const isActive = prog.id === activeProgrammeId;
          const stats = getStats(prog.id);
          return (
            <div
              key={prog.id}
              onClick={() => handleSwitch(prog.id)}
              style={{
                background: 'var(--card)',
                border: `1px solid ${isActive ? PROGRAMME_COLOURS[prog.id] : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '16px',
                cursor: isActive ? 'default' : 'pointer',
                opacity: isActive ? 1 : 0.85,
                transition: 'border-color 0.2s, opacity 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '0.5px' }}>
                      {PROGRAMME_ICONS[prog.id]} {prog.name}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: PROGRAMME_COLOURS[prog.id],
                          background: `${PROGRAMME_COLOURS[prog.id]}22`,
                          padding: '2px 8px',
                          borderRadius: '20px',
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {prog.shortDescription}
                  </div>
                  {stats.workouts > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                      {stats.workouts} workout{stats.workouts !== 1 ? 's' : ''} logged · Week {stats.week}
                    </div>
                  )}
                </div>
                {!isActive && (
                  <div
                    style={{
                      marginLeft: '12px',
                      padding: '8px 16px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Switch
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmId && (
        <>
          <div
            onClick={() => setConfirmId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '480px',
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px',
              zIndex: 101,
            }}
          >
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', marginBottom: '10px' }}>
              Switch to {PROGRAMMES[confirmId]?.name}?
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Your current programme data is saved and will be waiting for you if you switch back. Your new programme
              starts fresh from where you left off.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmId(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '20px',
                  letterSpacing: '1px',
                  color: '#0d0d0f',
                  cursor: 'pointer',
                }}
              >
                SWITCH PROGRAMME
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
