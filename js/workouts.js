// ══════════════════════════════════════════
//  workouts.js
//  Handles week overview, day detail,
//  exercise rendering, and set tracking.
// ══════════════════════════════════════════

let currentDayId = null;
let sessionStartTime = null;
let sessionTimer = null;

function estimateDuration(day) {
  let minutes = 0;
  day.exercises.forEach((ex) => {
    const isCompound = [
      'Deadlifts',
      'Squats',
      'Bench Press',
      'Front Barbell Squat',
      'Straight-Legged Deadlifts',
    ].some((name) => ex.name.includes(name));
    const restTime = isCompound ? 3 : 1.25; // minutes between sets
    const setTime = 0.75; // minutes per set
    const transitionTime = 1.5; // minutes to set up and move to next exercise

    if (ex.superset) {
      // Supersets flow straight into second movement, rest only after both
      minutes += ex.sets * (setTime + setTime + restTime);
    } else {
      minutes += ex.sets * (setTime + restTime);
    }

    minutes += transitionTime; // transition to next exercise
  });

  return Math.round(minutes);
}

function changeWeek(direction) {
  state.weekNum = Math.max(1, state.weekNum + direction);
  saveState();
  document.getElementById('weekBadge').textContent = 'Week ' + state.weekNum;
  if (currentDayId) {
    document.getElementById('dayNotes').value =
      state.notes?.[`week${state.weekNum}_${currentDayId}`] || '';
    document.getElementById('saveDayBtn').textContent = state.completedDays[
      `week${state.weekNum}_${currentDayId}`
    ]
      ? 'UNDO COMPLETE'
      : 'MARK DAY COMPLETE';
    const skipped = state.skippedDays?.[`week${state.weekNum}_${currentDayId}`];
    document.getElementById('skipDayBtn').textContent = skipped
      ? 'UNSKIP DAY'
      : 'SKIP DAY';
    document.getElementById('skipDayBtn').className =
      'skip-day-btn' + (skipped ? ' skipped' : '');
  } else {
    renderWeekOverview();
  }
  if (currentView === 'progress') renderProgress();
}

// ── Week Overview ──────────────────────────
function renderWeekOverview() {
  if (settingsOpen) {
    returnFromSettings();
    return;
  }

  if (!checkEquipmentProfile()) return;
  document.getElementById('weekOverview').style.display = '';
  document.getElementById('dayDetail').style.display = 'none';
  document.getElementById('weekBadge').textContent = 'Week ' + state.weekNum;

  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';

  PROGRAM.forEach((day) => {
    const done = !!state.completedDays[`week${state.weekNum}_${day.id}`];
    const progress = getDayProgress(day.id, day.exercises);
    const card = document.createElement('div');
    card.className = 'day-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="day-label">${day.label}</div>
      <div class="day-focus">${day.focus} · ~${estimateDuration(day)} mins</div>
      <div class="day-bar"><div class="day-bar-fill" style="width:${progress}%"></div></div>
    `;
    card.onclick = () => openDay(day.id);
    grid.appendChild(card);
  });
}

function getDayProgress(dayId, exercises) {
  let total = 0,
    done = 0;
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
  sessionStartTime = Date.now();
  startSessionTimer();
  currentDayId = dayId;
  const day = PROGRAM.find((d) => d.id === dayId);

  document.getElementById('weekOverview').style.display = 'none';
  document.getElementById('dayDetail').style.display = '';
  document.getElementById('detailTitle').textContent = day.focus.toUpperCase();
  document.getElementById('detailFocus').textContent =
    day.label + ' · ' + day.exercises.length + ' exercises';
  document.getElementById('equipmentList').innerHTML = day.equipment
    .map((e) => `<span class="equip-tag">${e}</span>`)
    .join('');
  document.getElementById('saveDayBtn').textContent = state.completedDays[
    `week${state.weekNum}_${dayId}`
  ]
    ? 'UNDO COMPLETE'
    : 'MARK DAY COMPLETE';

  document.getElementById('dayNotes').value =
    state.notes?.[`week${state.weekNum}_${dayId}`] || '';

  const skipped = state.skippedDays?.[`week${state.weekNum}_${dayId}`];
  document.getElementById('skipDayBtn').textContent = skipped
    ? 'UNSKIP DAY ' + `(${skipped})`
    : 'SKIP DAY';
  document.getElementById('skipDayBtn').className =
    'skip-day-btn' + (skipped ? ' skipped' : '');
  document.getElementById('headerSessionTimer').style.display = 'block';

  renderExercises(day);
  sessionStartTime = Date.now();
}

function goBack() {
  document.getElementById('weekOverview').style.display = '';
  document.getElementById('dayDetail').style.display = 'none';
  document.getElementById('headerSessionTimer').style.display = 'none';
  stopSessionTimer();
  renderWeekOverview();
}

function getBarWeight(ex) {
  if (ex.equipment?.includes('Barbell (7ft)')) return 10;
  if (ex.equipment?.includes('Barbell (5ft)')) return 7.5;
  return null;
}

// ── Exercises ──────────────────────────────
function renderExercises(day) {
  const list = document.getElementById('exerciseList');
  list.innerHTML = '';

  day.exercises.forEach((ex, ei) => {
    const resolvedEx = resolveExercise(ex);
    const repsArr = buildRepsArray(resolvedEx);
    const card = document.createElement('div');
    card.className =
      'exercise-card' +
      (resolvedEx.status === 'unavailable' ? ' unavailable' : '');

    card.innerHTML = `
  <div class="exercise-header" onclick="toggleEx(this)">
    <div>
      <div class="exercise-name" style="color:${resolvedEx.status === 'unavailable' ? 'var(--muted)' : 'var(--text)'}">
        ${resolvedEx.name}${resolvedEx.superset ? ' + ' + resolvedEx.superset.name : ''}
      </div>
      <div class="exercise-meta">
        ${
          resolvedEx.status === 'unavailable'
            ? '⚠ No alternative available for your equipment'
            : `${resolvedEx.sets} sets · ${resolvedEx.reps}${resolvedEx.superset ? ' → ' + resolvedEx.superset.reps : ''}${resolvedEx.note ? ' · ' + resolvedEx.note : ''}`
        }
        ${resolvedEx.status === 'alternative' ? ' · <span style="color:var(--accent)">Substituted</span>' : ''}
      </div>
    </div>
    <div class="exercise-toggle" style="${resolvedEx.status === 'unavailable' ? 'opacity:0.3' : ''}">+</div>
  </div>
    <div class="sets-table">
      ${
        getBarWeight(resolvedEx)
          ? `
  <div style="font-size:11px;color:var(--muted);margin-bottom:8px">
    🏋️ Includes ${getBarWeight(resolvedEx)}kg bar weight
  </div>`
          : ''
      }
<div class="col-header">
  <span>SET</span><span>REPS</span><span>KG</span><span></span>
</div>
      ${repsArr
        .map((rep, si) => {
          const key = `${day.id}_${ei}_${si}`;
          const saved = state.setData[key] || {};
          const ssKey = `${day.id}_${ei}_${si}_ss`;
          const ssSaved = state.setData[ssKey] || {};
          return `
        <div class="set-row" style="${resolvedEx.superset ? 'margin-bottom:4px' : ''}">
          <div class="set-label">S${si + 1}</div>
          <input class="set-input" type="number" inputmode="numeric" placeholder="${rep}" value="${saved.reps || ''}"
            onchange="saveSetData('${day.id}',${ei},${si},'reps',this.value)">
          <div style="display:flex;flex-direction:column;gap:2px">
  <input class="set-input" type="number" inputmode="decimal" placeholder="${resolvedEx.defaultWeight || 'kg'}" value="${saved.weight || ''}"
    onchange="saveSetData('${day.id}',${ei},${si},'weight',this.value);updateTotalWeight(this, ${getBarWeight(resolvedEx) || 0})"
    oninput="updateTotalWeight(this, ${getBarWeight(resolvedEx) || 0})">
  <div class="total-weight" style="font-size:10px;color:var(--accent);text-align:center">
    ${saved.weight ? `= ${parseFloat(saved.weight) + (getBarWeight(resolvedEx) || 0)}kg total` : ''}
  </div>
</div>
          <button class="check-btn ${saved.done ? 'done' : ''}" onclick="toggleSet('${day.id}',${ei},${si},this)">✓</button>
        </div>
        ${
          resolvedEx.superset
            ? `
        <div class="set-row" style="margin-bottom:12px;opacity:0.75">
          <div class="set-label" style="font-size:10px;color:var(--accent)">↳</div>
          <div class="set-input" style="display:flex;align-items:center;justify-content:center;opacity:0.5;cursor:default">
            Failure
          </div>
          <div class="set-input" style="display:flex;align-items:center;justify-content:center;opacity:0.5;cursor:default">
            ${saved.weight || resolvedEx.defaultWeight || '—'}
          </div>
          <button class="check-btn ${ssSaved.done ? 'done' : ''}" onclick="toggleSet('${day.id}',${ei},${si},this,'${ssKey}')">✓</button>
        </div>`
            : ''
        }`;
        })
        .join('')}
    </div>
  `;
    list.appendChild(card);
  });
}

function updateTotalWeight(input, barWeight) {
  if (!barWeight) return;
  const val = parseFloat(input.value);
  const totalEl = input.parentElement.querySelector('.total-weight');
  if (totalEl) {
    totalEl.textContent = val ? `= ${val + barWeight}kg total` : '';
  }
}

function buildRepsArray(ex) {
  const parts = ex.reps.split('/');
  if (parts.length >= ex.sets) return parts.slice(0, ex.sets);
  const arr = [];
  for (let i = 0; i < ex.sets; i++)
    arr.push(parts[i] || parts[parts.length - 1]);
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

  if (state.setData[key].done) {
    const day = PROGRAM.find((d) => d.id === dayId);
    const ex = day?.exercises[ei];
    if (ex) startRestTimer(resolveExercise(ex));
  }

  // Check if logged weight is lower than default
  if (state.setData[key].done) {
    const day = PROGRAM.find((d) => d.id === dayId);
    const ex = day?.exercises[ei];
    if (!ex) return;
    const resolvedEx = resolveExercise(ex);
    const loggedWeight = parseFloat(state.setData[key].weight);
    const defaultWeight = resolvedEx.defaultWeight;
    if (loggedWeight && defaultWeight && loggedWeight < defaultWeight) {
      showModal(
        'UPDATE DEFAULT WEIGHT?',
        `You logged ${loggedWeight}kg but the default is ${defaultWeight}kg. Update the default to ${loggedWeight}kg?`,
        () => {
          ex.defaultWeight = loggedWeight;
          showToast(`Default updated to ${loggedWeight}kg`);
          openDay(dayId);
        },
      );
    }
  }
}

// ── Complete Day ───────────────────────────
function saveDay() {
  const mins = stopSessionTimer();
  if (!currentDayId) return;
  const key = `week${state.weekNum}_${currentDayId}`;
  const alreadyDone = !!state.completedDays[key];
  if (alreadyDone) {
    delete state.completedDays[key];
    delete state.sessionTimes[key];
    saveState();
    showToast('Day marked incomplete');
  } else {
    state.completedDays[key] = true;
    if (!state.workoutDates) state.workoutDates = {};
    state.workoutDates[key] = todayStr();
    if (!state.sessionTimes) state.sessionTimes = {};
    const mins = Math.round((Date.now() - sessionStartTime) / 60000);
    state.sessionTimes[key] = mins;
    saveState();
    showToast(`Day complete! 💪 ${mins} mins`);
  }
  setTimeout(goBack, 800);
}

function skipDay() {
  if (!currentDayId) return;
  const key = `week${state.weekNum}_${currentDayId}`;
  const alreadySkipped = state.skippedDays?.[key];

  if (alreadySkipped) {
    delete state.skippedDays[key];
    saveState();
    showToast('Skip removed');
    setTimeout(goBack, 800);
    return;
  }

  const reasons = ['Rest day', 'Illness', 'No time', 'Other'];
  const reason = prompt(
    'Reason for skipping?\n\n1. Rest day\n2. Illness\n3. No time\n4. Other',
  );
  if (!reason) return;
  const reasonText = reasons[parseInt(reason) - 1] || 'Other';
  if (!state.workoutDates) state.workoutDates = {};
  state.workoutDates[key] = todayStr();
  if (!state.skippedDays) state.skippedDays = {};
  state.skippedDays[key] = reasonText;
  saveState();
  showToast('Day skipped — ' + reasonText);
  setTimeout(goBack, 800);
}

function saveNotes(val) {
  if (!state.notes) state.notes = {};
  const key = `week${state.weekNum}_${currentDayId}`;
  state.notes[key] = val;
  saveState();
}
