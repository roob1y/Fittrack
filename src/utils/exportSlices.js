// ══════════════════════════════════════════
//  exportSlices.js
//  Writes the narrow CSVs built in csvSlices.js.
// ══════════════════════════════════════════
//
// Same delivery as exportCSV: the Android share sheet on the phone, a download in
// the browser. The rows come from csvSlices.js, which is pure and tested in node.

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { PROGRAMMES } from '../data/program';
import { localToday } from './body';
import { sessionRows, exerciseRows, bodyRows, exerciseFamilies, toCSV, fileSlug } from './csvSlices';

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

async function writeCSV(rows, filename) {
  const csv = toCSV(rows);
  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.writeFile({ path: filename, data: csv, directory: Directory.Cache, encoding: 'utf8' });
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

function programmeOf(store) {
  const id = store.activeProgrammeId;
  return { days: PROGRAMMES[id]?.days ?? [], slice: store.programmeData?.[id] ?? {} };
}

export function exportSessionCSV(store, date) {
  const { days, slice } = programmeOf(store);
  return writeCSV(sessionRows(days, slice, date, store.weightUnit), `fittrack-session-${date}.csv`);
}

export function exportExerciseCSV(store, familyId) {
  const { days, slice } = programmeOf(store);
  const family = exerciseFamilies(days).find((f) => f.id === familyId);
  if (!family) {
    showToast('That exercise is no longer in the programme');
    return Promise.resolve();
  }
  const name = fileSlug(family.members[0].ex.name);
  return writeCSV(exerciseRows(days, slice, family, store.weightUnit), `fittrack-exercise-${name}-${localToday()}.csv`);
}

export function exportBodyCSV(store) {
  return writeCSV(bodyRows(store), `fittrack-body-${localToday()}.csv`);
}
