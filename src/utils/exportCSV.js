// exportCSV.js
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { PROGRAM } from '../data/program';
import { Share } from '@capacitor/share';

function convertWeight(kg, unit) {
  if (unit === 'lbs') return Math.round(kg * 2.2046 * 10) / 10;
  return Math.round(kg * 10) / 10;
}

function showToast(msg) {
  const existing = document.getElementById('export-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'export-toast';
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1e1e24',
    color: '#f0f0f5',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: '9999',
    border: '1px solid #2a2a35',
    whiteSpace: 'normal',
    textAlign: 'center',
    maxWidth: '280px',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

export async function exportCSV(store) {
  const { setData, workoutDates, sessionTimes, weightLog, weightUnit } = store;
  const rows = [];

  rows.push(['WORKOUT HISTORY']);
  rows.push(['Date', 'Day', 'Focus', 'Exercise', 'Set', 'Reps', `Weight (${weightUnit})`]);

  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const dateKey = `week${week}_${day.id}`;
      const date = workoutDates?.[dateKey];
      if (!date) continue;
      day.exercises.forEach((ex, ei) => {
        const repTargets = ex.reps.split('/');
        for (let si = 0; si < ex.sets; si++) {
          const setKey = `week${week}_${day.id}_${ei}_${si}`;
          const saved = setData?.[setKey];
          if (!saved?.done) continue;
          const repTarget = repTargets[si] ?? repTargets[repTargets.length - 1] ?? ex.reps;
          const displayReps = saved.reps || repTarget || '';
          const displayWeight = saved.weight || (ex.defaultWeight != null ? ex.defaultWeight : '');
          rows.push([date, day.label, day.focus, ex.name, `Set ${si + 1}`, displayReps, displayWeight]);
        }
      });
    }
  }

  rows.push([]);
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
  rows.push(['BODY WEIGHT LOG']);
  rows.push(['Date', `Weight (${weightUnit})`]);

  const sortedDates = Object.keys(weightLog || {}).sort();
  for (const date of sortedDates) {
    rows.push([date, convertWeight(weightLog[date], weightUnit)]);
  }

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(','),
    )
    .join('\n');

  const filename = `fittrack-export-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.writeFile({
        path: filename,
        data: csv,
        directory: Directory.Cache,
        encoding: 'utf8',
      });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      await Share.share({ title: filename, url: uri, dialogTitle: 'Save or share your export' });
    } catch (e) {
      showToast('Export failed — storage permission may be needed');
      console.error('CSV export error:', e);
    }
  } else {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
