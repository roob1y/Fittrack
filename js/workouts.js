// ══════════════════════════════════════════
//  workouts.js
//  Handles week overview, day detail,
//  exercise rendering, and set tracking.
// ══════════════════════════════════════════

let currentDayId = null;

// ── Week Overview ──────────────────────────
function renderWeekOverview() {
  document.getElementById('weekOverview').style.display = '';
  document.getElementById('dayDetail').style.display = 'none';
  document.getElementById('weekBadge').textContent = 'Week ' + state.weekNum;

  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';

  PROGRAM.forEach(day => {
    const done = !!state.completedDays[day.id];
    const progress = getDayProgress(day.id, day.exercises);
    const card = document.createElement('div');
    card.className = 'day-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="day-label">${day.label}</div>
      <div class="day-focus">${day.focus}</div>
      <div class="day-bar"><div class="day-bar-fill" style="width:${progress}%"></div></div>
    `;
    card.onclick = () => openDay(day.id);
    grid.appendChild(card);
  });
}

function getDayProgress(dayId, exercises) {
  let total = 0, done = 0;
  exercises.forEach((ex, ei) => {
    for (let s = 0; s < ex.sets; s++) {
      total++;
      const key = `${dayId}_${ei}_${s}`;
      if (state.setData[key]?.done) done++;
    }
  });
  return total ? Math.round((done / total) * 100) : 0;
}

// ── Day Detail ─────────────────────────────
function openDay(dayId) {
  currentDayId = dayId;
  const day = PROGRAM.find(d => d.id === dayId);

  document.getElementById('weekOverview').style.display = 'none';
  document.getElementById('dayDetail').style.display = '';
  document.getElementById('detailTitle').textContent = day.focus.toUpperCase();
  document.getElementById('detailFocus').textContent = day.label + ' · ' + day.exercises.length + ' exercises';
  document.getElementById('saveDayBtn').textContent = state.completedDays[dayId] ? 'UNDO COMPLETE' : 'MARK DAY COMPLETE';

  renderExercises(day);
}

function goBack() {
  document.getElementById('weekOverview').style.display = '';
  document.getElementById('dayDetail').style.display = 'none';
  renderWeekOverview();
}

// ── Exercises ──────────────────────────────
function renderExercises(day) {
  const list = document.getElementById('exerciseList');
  list.innerHTML = '';

  day.exercises.forEach((ex, ei) => {
    const repsArr = buildRepsArray(ex);
    const card = document.createElement('div');
    card.className = 'exercise-card';

    card.innerHTML = `
      <div class="exercise-header" onclick="toggleEx(this)">
        <div>
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-meta">${ex.sets} sets · ${ex.reps}${ex.note ? ' · ' + ex.note : ''}</div>
        </div>
        <div class="exercise-toggle">+</div>
      </div>
      <div class="sets-table">
        <div class="col-header">
          <span>SET</span><span>REPS</span><span>KG</span><span></span>
        </div>
        ${repsArr.map((rep, si) => {
          const key = `${day.id}_${ei}_${si}`;
          const saved = state.setData[key] || {};
          return `
          <div class="set-row">
            <div class="set-label">S${si + 1}</div>
            <input class="set-input" type="number" inputmode="numeric" placeholder="${rep}" value="${saved.reps || ''}"
              onchange="saveSetData('${day.id}',${ei},${si},'reps',this.value)">
            <input class="set-input" type="number" inputmode="decimal" placeholder="${ex.defaultWeight || 'kg'}" value="${saved.weight || ''}"
              onchange="saveSetData('${day.id}',${ei},${si},'weight',this.value)">
            <button class="check-btn ${saved.done ? 'done' : ''}" onclick="toggleSet('${day.id}',${ei},${si},this)">✓</button>
          </div>`;
        }).join('')}
      </div>
    `;
    list.appendChild(card);
  });
}

function buildRepsArray(ex) {
  const parts = ex.reps.split('/');
  if (parts.length >= ex.sets) return parts.slice(0, ex.sets);
  const arr = [];
  for (let i = 0; i < ex.sets; i++) arr.push(parts[i] || parts[parts.length - 1]);
  return arr;
}

function toggleEx(header) {
  const table = header.nextElementSibling;
  const tog = header.querySelector('.exercise-toggle');
  table.classList.toggle('open');
  tog.classList.toggle('open');
}

// ── Set Tracking ───────────────────────────
function saveSetData(dayId, ei, si, field, val) {
  const key = `${dayId}_${ei}_${si}`;
  if (!state.setData[key]) state.setData[key] = {};
  state.setData[key][field] = val;
  saveState();
}

function toggleSet(dayId, ei, si, btn) {
  const key = `${dayId}_${ei}_${si}`;
  if (!state.setData[key]) state.setData[key] = {};
  state.setData[key].done = !state.setData[key].done;
  btn.classList.toggle('done');
  saveState();
}

// ── Complete Day ───────────────────────────
function saveDay() {
  if (!currentDayId) return;
  const alreadyDone = !!state.completedDays[currentDayId];
  if (alreadyDone) {
    delete state.completedDays[currentDayId];
    saveState();
    showToast('Day marked incomplete');
  } else {
    state.completedDays[currentDayId] = true;
    saveState();
    showToast('Day complete! 💪');
  }
  setTimeout(goBack, 800);
}
