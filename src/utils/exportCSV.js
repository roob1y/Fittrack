import { setKey, exerciseNoteKey, dayKey } from './setKeys';
import { buildDataNotes } from './exportFlags';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { PROGRAMMES } from '../data/program';
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
  const activeProgrammeId = store.activeProgrammeId;
  const PROGRAM = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const slice = store.programmeData?.[activeProgrammeId] ?? {};
  const { weightLog, weightUnit } = store;
  const { setData, workoutDates, sessionTimes, notes, exerciseNotes, sessionHealth } = slice;
  const rows = [];

  rows.push(['WORKOUT HISTORY']);
  rows.push([
    'Date',
    'Day',
    'Focus',
    'Exercise',
    'Set',
    'Reps',
    `Weight (${weightUnit})`,
    'Exercise Note',
    'Session Note',
  ]);

  // Notes sit on the row they belong to rather than in a section further down, so the
  // story reads alongside the numbers instead of needing a cross-reference. Each note
  // is written ONCE — on the first set of its exercise, and the first row of its
  // session — because a note repeated down every set is noise, not context.
  const placedNotes = new Set();

  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const dateKey = dayKey(week, day.id);
      const date = workoutDates?.[dateKey];
      if (!date) continue;
      let firstRowOfSession = true;
      day.exercises.forEach((ex) => {
        const repTargets = ex.reps.split('/');
        let firstRowOfExercise = true;
        for (let si = 0; si < ex.sets; si++) {
          const key = setKey(week, day.id, ex, si);
          const saved = setData?.[key];
          if (!saved?.done) continue;
          const repTarget = repTargets[si] ?? repTargets[repTargets.length - 1] ?? ex.reps;
          const displayReps = saved.reps || repTarget || '';
          const displayWeight = saved.weight || (ex.defaultWeight != null ? ex.defaultWeight : '');

          const exNoteKey = exerciseNoteKey(week, day.id, ex);
          const exNote = firstRowOfExercise ? (exerciseNotes?.[exNoteKey] ?? '') : '';
          const sessNote = firstRowOfSession ? (notes?.[dateKey] ?? '') : '';
          if (exNote) placedNotes.add(exNoteKey);
          if (sessNote) placedNotes.add(dateKey);

          rows.push([
            date,
            day.label,
            day.focus,
            ex.name,
            `Set ${si + 1}`,
            displayReps,
            displayWeight,
            exNote,
            sessNote,
          ]);
          firstRowOfExercise = false;
          firstRowOfSession = false;
        }
      });
    }
  }

  rows.push([]);
  rows.push(['SESSION TIMES']);
  rows.push(['Date', 'Day', 'Focus', 'Duration (mins)']);

  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const key = dayKey(week, day.id);
      const date = workoutDates?.[key];
      const mins = sessionTimes?.[key];
      if (!date || mins == null) continue;
      rows.push([date, day.label, day.focus, mins]);
    }
  }

  // A note written against an exercise that was never logged has no row to sit on.
  // Dropping it would lose exactly the notes that matter most — the reason something
  // was skipped — so anything that could not be placed inline is listed here.
  const orphans = [];
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const dKey = dayKey(week, day.id);
      const date = workoutDates?.[dKey];
      if (!date) continue;
      if (notes?.[dKey] && !placedNotes.has(dKey)) {
        orphans.push([date, day.label, day.focus, '(whole session)', notes[dKey]]);
      }
      for (const ex of day.exercises) {
        const nKey = exerciseNoteKey(week, day.id, ex);
        if (exerciseNotes?.[nKey] && !placedNotes.has(nKey)) {
          orphans.push([date, day.label, day.focus, ex.name, exerciseNotes[nKey]]);
        }
      }
    }
  }

  if (orphans.length) {
    rows.push([]);
    rows.push(['NOTES WITH NO LOGGED SETS']);
    rows.push(['Date', 'Day', 'Focus', 'Exercise', 'Note']);
    for (const o of orphans) rows.push(o);
  }

  // Heart rate and recovery from the Fit 3, where Samsung Health has synced it.
  // Its own section rather than more columns on WORKOUT HISTORY: it is per-session,
  // not per-set, and it arrives hours after the sets do.
  const healthRows = [];
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const key = dayKey(week, day.id);
      const date = workoutDates?.[key];
      const h = sessionHealth?.[key];
      if (!date || !h?.hr) continue;
      healthRows.push([
        date,
        day.label,
        day.focus,
        h.hr.avg,
        h.hr.max,
        h.hr.min,
        h.hr.minutesElevated ?? '',
        h.sleepMinutes ?? '',
      ]);
    }
  }
  if (healthRows.length) {
    rows.push([]);
    rows.push(['HEART RATE & RECOVERY (from Samsung Health via Health Connect)']);
    rows.push(['Date', 'Day', 'Focus', 'Avg HR', 'Peak HR', 'Min HR', 'Mins above 130', 'Sleep (mins, night before)']);
    for (const r of healthRows) rows.push(r);
  }

  rows.push([]);
  rows.push(['DATA NOTES — generated, not written by the user']);
  rows.push([
    'Older sessions may predate a programme change, so "no sets logged" there can just mean the exercise did not exist yet.',
  ]);
  rows.push(['Date', 'Day', 'Focus', 'Exercise', 'Observation']);

  const dataNotes = buildDataNotes(PROGRAM, setData, workoutDates);
  if (dataNotes.length === 0) rows.push(['—', '', '', '', 'Nothing flagged']);
  for (const n of dataNotes) rows.push([n.date, n.day, n.focus, n.exercise, n.flag]);

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
