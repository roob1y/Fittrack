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

  PROGRAM.forEach((day) => {
    const done = !!state.completedDays[`week${state.weekNum}_${day.id}`];
    const skipped = state.skippedDays?.[`week${state.weekNum}_${day.id}`];
    const sessionTime = state.sessionTimes?.[`week${state.weekNum}_${day.id}`];
    const row = document.createElement('div');
    row.className = 'week-log-row';
    row.innerHTML = `
      <div>
        <div class="wl-day">${day.label}</div>
        <div class="wl-focus">${day.focus}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${sessionTime ? `<div style="font-size:12px;color:var(--muted)">${sessionTime} mins</div>` : ''}
        ${sessionTime !== null && sessionTime !== undefined ? `<div style="font-size:12px;color:var(--muted)">${sessionTime} mins</div>` : ''}
      <div class="wl-badge ${done ? 'done' : skipped ? 'skipped' : 'skip'}">${done ? '✓ Done' : skipped ? '⊘ ' + skipped : 'Pending'}</div>
  </div>
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
