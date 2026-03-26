// ══════════════════════════════════════════
//  ui.js
//  Shared UI utilities used across all modules.
// ══════════════════════════════════════════

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  document.querySelectorAll('.nav-btn')[['workouts', 'meals', 'progress'].indexOf(v)].classList.add('active');

  if (v === 'workouts') renderWeekOverview();
  if (v === 'meals')    renderMeals();
  if (v === 'progress') renderProgress();
}
