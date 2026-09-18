import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { setKey } from '../../utils/setKeys';
import { dayKey } from '../../utils/setKeys';
import { PROGRAMMES } from '../../data/program';
import { EMPTY } from '../../store/shape';
import { activeExercises } from '../../utils/slots';

export default function WorkoutSummaryScreen({ dayId, weekNum, mins, noteKey, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const setData = useStore((s) => s.programmeData[s.activeProgrammeId]?.setData ?? EMPTY);
  const sessionHealth = useStore((s) => s.programmeData[s.activeProgrammeId]?.sessionHealth ?? EMPTY);
  const healthEnabled = useStore((s) => s.healthEnabled);
  const pbs = useStore((s) => s.pbs);
  const notes = useStore((s) => s.programmeData[s.activeProgrammeId]?.notes ?? EMPTY);
  const saveNote = useStore((s) => s.saveNote);
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slotChoices = useStore((s) => s.programmeData[s.activeProgrammeId]?.slotChoices ?? EMPTY);
  const equipment = useStore((s) => s.equipment);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  const day = PROGRAMMES[activeProgrammeId]?.days.find((d) => d.id === dayId);
  if (!day) return null;

  // Health Connect usually has not synced by the time this screen appears, so an
  // absent reading is the normal case and is shown as pending rather than as zero.
  const health = sessionHealth?.[dayKey(weekNum, dayId)];

  // Sets completed vs total — one exercise per slot, or a Legs session counts the
  // sets of a leg press he was never going to touch and can never read 100%.
  let totalSets = 0;
  let completedSets = 0;
  activeExercises(day, { weekNum, dayId, setData, slotChoices, equipment }).forEach((ex) => {
    for (let si = 0; si < ex.sets; si++) {
      totalSets++;
      const key = setKey(weekNum, dayId, ex, si);
      if (setData[key]?.done) completedSets++;
    }
  });

  // PBs scan every programme entry, including the slot option not on show — a PB
  // set on the plate-loaded machine still counts if he swapped tiles afterwards.
  const sessionPBs = [];
  day.exercises.forEach((ex) => {
    for (let si = 0; si < ex.sets; si++) {
      const key = setKey(weekNum, dayId, ex, si);
      const saved = setData[key];
      if (!saved?.done || !saved?.weight || !saved?.reps) continue;
      const currentE1rm = parseFloat(saved.weight) * (1 + parseInt(saved.reps) / 30);
      const pbE1rm = pbs[ex.name];
      if (pbE1rm && currentE1rm >= pbE1rm) {
        if (!sessionPBs.find((p) => p.exercise === ex.name)) {
          sessionPBs.push({
            exercise: ex.name,
            weight: parseFloat(saved.weight),
            reps: parseInt(saved.reps),
          });
        }
      }
    }
  });

  const setsPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const overTarget = mins > 60;
  const hasTime = mins > 0;

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  return (
    // Full screen backdrop
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 200,
        overflowY: 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          padding: 'calc(var(--sat, 0px) + 40px) 20px calc(var(--sab, 0px) + 40px)',
          minHeight: '100%',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--accent)',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Session complete
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '52px',
              letterSpacing: '2px',
              color: 'var(--text)',
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            {day.focus.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {day.label} · Week {weekNum}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {/* Time */}
          <div
            style={{
              background: 'var(--card)',
              border: `1px solid ${overTarget ? 'var(--red)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '20px 16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              TIME
            </div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '44px',
                color: hasTime ? (overTarget ? 'var(--red)' : 'var(--accent)') : 'var(--border)',
                lineHeight: 1,
              }}
            >
              {hasTime ? mins : '0'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>mins</div>
            <div style={{ fontSize: '11px', marginTop: '8px', color: overTarget ? 'var(--red)' : 'var(--accent)' }}>
              {hasTime ? (overTarget ? '↑ Over 60 min' : '✓ Within target') : 'No timer data'}
            </div>
          </div>

          {/* Sets */}
          <div
            style={{
              background: 'var(--card)',
              border: `1px solid ${setsPercent === 100 ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '20px 16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              SETS
            </div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '44px',
                color: 'var(--accent)',
                lineHeight: 1,
              }}
            >
              {completedSets}
              <span style={{ fontSize: '24px', color: 'var(--muted)' }}>/{totalSets}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>completed</div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginTop: '10px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${setsPercent}%`,
                  background: setsPercent === 100 ? 'var(--accent)' : 'var(--accent2)',
                  borderRadius: '2px',
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '11px',
                marginTop: '6px',
                color: setsPercent === 100 ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {setsPercent === 100 ? '✓ All sets done' : `${setsPercent}% complete`}
            </div>
          </div>

          {/* Heart rate from the Fit 3, via Samsung Health -> Health Connect.
            Samsung Health syncs on its own schedule, so straight after a session
            this is normally still pending — say so rather than showing a blank. */}
          {healthEnabled && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                HEART RATE
              </div>
              {health?.hr ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px' }}>
                    <div>
                      <span
                        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '44px', color: 'var(--accent)' }}
                      >
                        {health.hr.avg}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--muted)' }}> avg</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--text)' }}>
                        {health.hr.max}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}> peak</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                    {health.hr.count} readings
                    {health.hr.minutesElevated != null ? ` · ~${health.hr.minutesElevated} min above 130` : ''}
                  </div>
                  {health.sleepMinutes != null && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '10px', lineHeight: 1.6 }}>
                      {`Slept ${Math.floor(health.sleepMinutes / 60)}h ${health.sleepMinutes % 60}m the night before`}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Waiting on Samsung Health to sync. It usually lands within an hour — it will fill itself in, or you
                  can tap Sync now in Settings.
                </div>
              )}
            </div>
          )}
        </div>

        {/* PBs */}
        {sessionPBs.length > 0 && (
          <div
            style={{
              background: 'rgba(255,215,0,0.05)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#ffd700',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              🏆 Personal bests
            </div>
            {sessionPBs.map((pb, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: i < sessionPBs.length - 1 ? '12px' : 0,
                  marginBottom: i < sessionPBs.length - 1 ? '12px' : 0,
                  borderBottom: i < sessionPBs.length - 1 ? '1px solid rgba(255,215,0,0.1)' : 'none',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{pb.exercise}</div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '18px',
                    color: '#ffd700',
                    letterSpacing: '0.5px',
                  }}
                >
                  {pb.weight}kg × {pb.reps}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session notes */}
        <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}
          >
            SESSION NOTES
          </div>
          <textarea
            placeholder="How did you feel? Anything to remember for next time..."
            value={notes[noteKey] || ''}
            onChange={(e) => saveNote(noteKey, e.target.value)}
            style={{
              width: '100%',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              padding: '14px',
              resize: 'none',
              height: '90px',
            }}
          />
        </div>

        {/* Dismiss */}
        <style>{`
        @keyframes celebFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes tapPulse { 0%,100%{opacity:0} 50%{opacity:1} }
      `}</style>
        <div style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', animation: 'tapPulse 1.8s ease-in-out infinite' }}>
            Tap anywhere to continue
          </div>
        </div>
      </div>
    </div>
  );
}
