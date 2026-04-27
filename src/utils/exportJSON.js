import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

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

// Global keys that are not programme-specific
const GLOBAL_KEYS = [
  'pbs',
  'pbsAchieved',
  'weightLog',
  'weightUnit',
  'equipment',
  'quoteTone',
  'restDurationOverride',
  'measurementLog',
  'measurementUnit',
  'heightCm',
  'gender',
  'measurementGoals',
  'barWeights',
];

export async function exportJSON(store) {
  const payload = {
    version: 2, // v2 = multi-programme store shape
    exportedAt: new Date().toISOString(),
    data: {
      // Global state
      ...Object.fromEntries(GLOBAL_KEYS.map((k) => [k, store[k]])),
      // Programme state — full nested structure
      activeProgrammeId: store.activeProgrammeId,
      programmeData: store.programmeData,
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const filename = `fittrack-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Cache,
        encoding: 'utf8',
      });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      await Share.share({ title: filename, url: uri, dialogTitle: 'Save your FitTrack backup' });
    } catch (e) {
      showToast('Export failed');
      console.error('JSON export error:', e);
    }
  } else {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
