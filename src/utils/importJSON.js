const BACKUP_KEYS = [
  'completedDays',
  'skippedDays',
  'setData',
  'notes',
  'exerciseNotes',
  'sessionTimes',
  'workoutDates',
  'pbs',
  'pbsAchieved',
  'weightLog',
  'weightUnit',
  'programmeStartDate',
  'equipment',
  'quoteTone',
];

export function importJSON(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.data || typeof parsed.data !== 'object') {
        onError('Invalid backup file.');
        return;
      }
      // Write each key directly into the Zustand persist storage
      const raw = localStorage.getItem('fittrack-store') || localStorage.getItem('fittrack_v1');
      const existing = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      BACKUP_KEYS.forEach((k) => {
        if (parsed.data[k] !== undefined) {
          existing.state[k] = parsed.data[k];
        }
      });
      localStorage.setItem('fittrack-store', JSON.stringify(existing));
      localStorage.removeItem('fittrack_v1');
      onSuccess();
    } catch {
      onError('Could not read backup file.');
    }
  };
  reader.onerror = () => onError('File read failed.');
  reader.readAsText(file);
}
