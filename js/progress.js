// ══════════════════════════════════════════
//  progress.js
//  Handles stats overview and weekly log.
//  Future: strength graphs go here.
// ══════════════════════════════════════════

function renderProgress() {
  const doneCount = Object.keys(state.completedDays).length;
  const mealDays = Object.values(state.mealLog);
  const totalMeals = mealDays.reduce((s, d) => s + d.length, 0);
  const totalCals = mealDays.reduce((s, d) => s + d.reduce((a, m) => a + m.cal, 0), 0);
  const avgCal = mealDays.length ? Math.round(totalCals / mealDays.length) : 0;

  document.getElementById('statWorkouts').textContent = doneCount;
  document.getElementById('statStreak').textContent = calcStreak();
  document.getElementById('statMeals').textContent = totalMeals;
  document.getElementById('statCal').textContent = avgCal || '—';

  const logList = document.getElementById('weekLogList');
  logList.innerHTML = '';

  PROGRAM.forEach(day => {
    const done = !!state.completedDays[day.id];
    const row = document.createElement('div');
    row.className = 'week-log-row';
    row.innerHTML = `
      <div>
        <div class="wl-day">${day.label}</div>
        <div class="wl-focus">${day.focus}</div>
      </div>
      <div class="wl-badge ${done ? 'done' : 'skip'}">${done ? '✓ Done' : 'Pending'}</div>
    `;
    logList.appendChild(row);
  });
}

function calcStreak() {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const str = d.toISOString().slice(0, 10);
    if (state.mealLog[str] && state.mealLog[str].length > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
