// ══════════════════════════════════════════
//  timer.js
//  Handles rest timer and session timer.
// ══════════════════════════════════════════

const COMPOUND_EXERCISES = [
  'Deadlifts',
  'Squats',
  'Bench Press',
  'Front Barbell Squat',
  'Straight-Legged Deadlifts',
  'Bent Over Rows',
  'Bulgarian Split Squats',
];

let restInterval = null;
let restSecondsLeft = 0;
let restTotalSeconds = 0;
let sessionInterval = null;
let sessionSeconds = 0;

function startSessionTimer() {
  sessionSeconds = 0;
  clearInterval(sessionInterval);
  sessionInterval = setInterval(() => {
    sessionSeconds++;
    updateSessionDisplay();
  }, 1000);
}

function updateSessionDisplay() {
  const mins = Math.floor(sessionSeconds / 60);
  const secs = sessionSeconds % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;
  const headerEl = document.getElementById('headerSessionTimer');
  if (headerEl) headerEl.textContent = display;
}

function stopSessionTimer() {
  clearInterval(sessionInterval);
  return Math.round(sessionSeconds / 60);
}

function getRestTime(ex) {
  if (ex.superset) return 90;
  const isCompound = COMPOUND_EXERCISES.some((name) => ex.name.includes(name));
  return isCompound ? 120 : 60;
}

function startRestTimer(ex) {
  clearRestTimer();
  restTotalSeconds = getRestTime(ex);
  restSecondsLeft = restTotalSeconds;

  document.getElementById('restTimer').style.display = 'block';
  updateRestTimerUI();

  restInterval = setInterval(() => {
    restSecondsLeft--;
    updateRestTimerUI();
    if (restSecondsLeft <= 0) {
      clearRestTimer();
      showToast('Rest complete — next set!');
    }
  }, 1000);
}

function updateRestTimerUI() {
  document.getElementById('restTimerCount').textContent = restSecondsLeft;
  const pct = (restSecondsLeft / restTotalSeconds) * 100;
  document.getElementById('restTimerBar').style.width = pct + '%';
}

function clearRestTimer() {
  clearInterval(restInterval);
  restInterval = null;
  const el = document.getElementById('restTimer');
  if (el) el.style.display = 'none';
}

function skipRest() {
  clearRestTimer();
  showToast('Rest skipped!');
}
