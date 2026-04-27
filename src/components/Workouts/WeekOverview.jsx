import React from 'react';
import useStore from '../../store/useStore';
import MuscleIcon from './MuscleIcon';
import { getDailyQuote } from '../../data/quotes';
import { getCurrentWeek } from '../../utils/week';
import { PROGRAMMES } from '../../data/program';

export default function WeekOverview({ onSelectDay }) {
  const quoteTone = useStore((s) => s.quoteTone);
  const programmeStartDate = useStore((s) => s.programmeData[s.activeProgrammeId]?.programmeStartDate ?? null);
  const completedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.completedDays ?? {});
  const skippedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.skippedDays ?? {});
  const setData = useStore((s) => s.programmeData[s.activeProgrammeId]?.setData ?? {});
  const workoutDates = useStore((s) => s.programmeData[s.activeProgrammeId]?.workoutDates ?? {});

  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const PROGRAM = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const trainedToday = Object.values(workoutDates || {}).some((d) => d === todayStr);
  const weekNum = getCurrentWeek(programmeStartDate);

  const nextDayId = trainedToday
    ? null
    : PROGRAM.find((d) => {
        const k = `week${weekNum}_${d.id}`;
        return !completedDays[k] && !skippedDays?.[k];
      })?.id;

  function getDayProgress(dayId, exercises) {
    let total = 0,
      done = 0;
    exercises.forEach((ex, ei) => {
      for (let s = 0; s < ex.sets; s++) {
        total++;
        const key = `week${weekNum}_${dayId}_${ei}_${s}`;
        if (setData[key]?.done) done++;
      }
    });
    return total ? Math.round((done / total) * 100) : 0;
  }

  function estimateDuration(day) {
    let minutes = 0;
    day.exercises.forEach((ex) => {
      const isCompound = [
        'Deadlifts',
        'Squats',
        'Bench Press',
        'Front Barbell Squat',
        'Straight-Legged Deadlifts',
      ].some((name) => ex.name.includes(name));
      const restTime = isCompound ? 3 : 1.25;
      const setTime = 0.75;
      const transitionTime = 1.5;
      if (ex.superset) {
        minutes += ex.sets * (setTime + setTime + restTime);
      } else {
        minutes += ex.sets * (setTime + restTime);
      }
      minutes += transitionTime;
    });
    return Math.round(minutes);
  }

  return (
    <div>
      {(() => {
        const quote = getDailyQuote(quoteTone);
        if (!quote) return null;
        return (
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--accent)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Today's motivation
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{quote}"
            </div>
          </div>
        );
      })()}

      {(() => {
        const today = new Date();
        let daysSinceLastWorkout = null;
        for (let i = 1; i <= 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const str = d.toISOString().slice(0, 10);
          const trained = Object.values(workoutDates || {}).some((date) => date === str);
          if (trained) {
            daysSinceLastWorkout = i;
            break;
          }
        }
        if (!daysSinceLastWorkout || daysSinceLastWorkout < 2 || trainedToday) return null;
        const nudges = {
          hardcore: `${daysSinceLastWorkout} days without training. Weakness is a choice. Make a different one.`,
          positive: `It's been ${daysSinceLastWorkout} days — no worries, today is a great day to get back at it!`,
          stoic: `${daysSinceLastWorkout} days have passed without action. Return to the work. That is all.`,
          off: null,
        };
        const nudge = nudges[quoteTone];
        if (!nudge) return null;
        return (
          <div
            style={{
              background: 'rgba(255,77,109,0.06)',
              border: '1px solid rgba(255,77,109,0.2)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '20px' }}>🔥</div>
            <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>{nudge}</div>
          </div>
        );
      })()}

      <div className="section-title" style={{ marginTop: '4px' }}>
        THIS WEEK
      </div>
      <div className="week-grid">
        {PROGRAM.map((day) => {
          const doneKey = `week${weekNum}_${day.id}`;
          const done = !!completedDays[doneKey];
          const skipped = !!skippedDays?.[doneKey];
          const progress = getDayProgress(day.id, day.exercises);

          return (
            <div
              key={day.id}
              className={`day-card${done ? ' done' : skipped ? ' skipped' : day.id === nextDayId ? ' next' : ''}`}
              onClick={() => onSelectDay(day.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px 30px',
              }}
            >
              <div
                style={{
                  width: '60%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '2px',
                  paddingLeft: '4px',
                  paddingTop: '4px',
                }}
              >
                <div className="day-label">{day.label}</div>
                <div className="day-focus">{day.focus}</div>
                <div className="day-focus">~{estimateDuration(day)} mins</div>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <MuscleIcon dayId={day.id} />
              </div>
              <div
                style={{
                  width: '3px',
                  height: '80px',
                  background: 'var(--border)',
                  borderRadius: '2px',
                  marginTop: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${progress}%`,
                    background: 'var(--accent)',
                    borderRadius: '2px',
                    transition: 'height 0.4s ease',
                  }}
                />
              </div>
              {done && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(200,241,53,0.15)',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '20px',
                  }}
                >
                  Done
                </div>
              )}
              {skipped && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255,77,109,0.1)',
                    color: 'var(--red)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '20px',
                  }}
                >
                  Skipped
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
