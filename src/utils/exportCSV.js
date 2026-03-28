// exportCSV.js
// Generates and downloads a CSV file from FitTrack store data.

import { PROGRAM } from '../data/program';

function convertWeight(kg, unit) {
  if (unit === 'lbs') return Math.round(kg * 2.2046 * 10) / 10;
  return Math.round(kg * 10) / 10;
}

export function exportCSV(store) {
  const { setData, workoutDates, sessionTimes, weightLog, weightUnit, pbs } = store;

  const rows = [];

  // ── Workout History ──────────────────────────────────
  rows.push(['WORKOUT HISTORY']);
  rows.push(['Date', 'Day', 'Focus', 'Exercise', 'Set', 'Reps', 'Weight (kg)']);

  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const dateKey = `week${week}_${day.id}`;
      const date = workoutDates?.[dateKey];
      if (!date) continue;

      day.exercises.forEach((ex, ei) => {
        for (let si = 0; si < ex.sets; si++) {
          const setKey = `week${week}_${day.id}_${ei}_${si}`;
          const saved = setData?.[setKey];
          if (!saved?.done) continue;
          rows.push([
            date,
            day.label,
            day.focus,
            ex.name,
            `Set ${si + 1}`,
            saved.reps || '',
            saved.weight || '',
          ]);
        }
      });
    }
  }

  rows.push([]);

  // ── Session Times ────────────────────────────────────
  rows.push(['SESSION TIMES']);
  rows.push(['Date', 'Day', 'Focus', 'Duration (mins)']);

  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const key = `week${week}_${day.id}`;
      const date = workoutDates?.[key];
      const mins = sessionTimes?.[key];
      if (!date || mins == null) continue;
      rows.push([date, day.label, day.focus, mins]);
    }
  }

  rows.push([]);

  // ── Body Weight Log ──────────────────────────────────
  rows.push(['BODY WEIGHT LOG']);
  rows.push(['Date', `Weight (${weightUnit})`]);

  const sortedDates = Object.keys(weightLog || {}).sort();
  for (const date of sortedDates) {
    rows.push([date, convertWeight(weightLog[date], weightUnit)]);
  }

  // Build CSV string
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    )
    .join('\n');

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fittrack-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
