import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAM } from '../../data/program';

export default function WeekOverview({ onSelectDay }) {
  const weekNum = useStore((s) => s.weekNum);
  const completedDays = useStore((s) => s.completedDays);
  const skippedDays = useStore((s) => s.skippedDays);
  const setData = useStore((s) => s.setData);

  function getDayProgress(dayId, exercises) {
    let total = 0, done = 0;
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
      const isCompound = ['Deadlifts', 'Squats', 'Bench Press', 'Front Barbell Squat', 'Straight-Legged Deadlifts'].some(
        (name) => ex.name.includes(name)
      );
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
      <div className="section-title" style={{ marginTop: '4px' }}>THIS WEEK</div>
      <div className="week-grid">
        {PROGRAM.map((day) => {
          const doneKey = `week${weekNum}_${day.id}`;
          const done = !!completedDays[doneKey];
          const skipped = !!skippedDays?.[doneKey];
          const progress = getDayProgress(day.id, day.exercises);

          return (
            <div
              key={day.id}
              className={`day-card${done ? ' done' : skipped ? ' skipped' : ''}`}
              onClick={() => onSelectDay(day.id)}
            >
              <div className="day-label">{day.label}</div>
              <div className="day-focus">{day.focus} · ~{estimateDuration(day)} mins</div>
              <div className="day-bar">
                <div className="day-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}