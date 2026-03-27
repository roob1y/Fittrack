// ══════════════════════════════════════════
//  ui.js
//  Shared UI utilities used across all modules.
// ══════════════════════════════════════════

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

var currentView = 'workouts';

function showView(v) {
  settingsOpen = false;
  currentView = v;
  document
    .querySelectorAll('.view')
    .forEach((el) => el.classList.remove('active'));
  document
    .querySelectorAll('.nav-btn')
    .forEach((el) => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  document
    .querySelectorAll('.nav-btn')
    [['workouts', 'calendar', 'progress'].indexOf(v)].classList.add('active');

  if (v === 'workouts') renderWeekOverview();
  if (v === 'calendar') renderCalendar();
  if (v === 'progress') renderProgress();
}

function showModal(title, body, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').textContent = body;
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modalConfirm').onclick = () => {
    onConfirm();
    closeModal();
  };
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}
