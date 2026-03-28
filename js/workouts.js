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
    const isCompound = ['Deadlifts', 'Squats', 'Bench Press', 'Front Barbell Squat', 'Straight-Legged Deadlifts'].some(
      (name) => ex.name.includes(name),
    );
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
    document.getElementById('dayNotes').value = state.notes?.[`week${state.weekNum}_${currentDayId}`] || '';
    document.getElementById('saveDayBtn').textContent = state.completedDays[`week${state.weekNum}_${currentDayId}`]
      ? 'UNDO COMPLETE'
      : 'MARK DAY COMPLETE';
    const skipped = state.skippedDays?.[`week${state.weekNum}_${currentDayId}`];
    document.getElementById('skipDayBtn').textContent = skipped ? 'UNSKIP DAY' : 'SKIP DAY';
    document.getElementById('skipDayBtn').className = 'skip-day-btn' + (skipped ? ' skipped' : '');
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
    const skipped = !!state.skippedDays?.[`week${state.weekNum}_${day.id}`];
    card.className = 'day-card' + (done ? ' done' : skipped ? ' skipped' : '');
    card.innerHTML = `
      <div class="day-label">${day.label}</div>
      <div class="day-focus">${day.focus} · ~${estimateDuration(day)} mins</div>
      <div class="day-bar"><div class="day-bar-fill" style="width:${progress}%"></div></div>
    `;
    card.onclick = () => openWarmup(day.id);
    grid.appendChild(card);
  });
}

function getDayProgress(dayId, exercises) {
  let total = 0,
    done = 0;
  exercises.forEach((ex, ei) => {
    for (let s = 0; s < ex.sets; s++) {
      total++;
      const key = `week${state.weekNum}_${dayId}_${ei}_${s}`;
      if (state.setData[key]?.done) done++;
    }
  });
  return total ? Math.round((done / total) * 100) : 0;
}

let warmupTimerInterval = null;

function openWarmup(dayId) {
  const day = PROGRAM.find((d) => d.id === dayId);
  const warmups = WARMUPS[dayId] || [];
  const available = warmups.filter((w) => hasEquipment(w.equipment));

  document.getElementById('weekOverview').style.display = 'none';
  document.getElementById('dayDetail').style.display = '';
  document.getElementById('detailTitle').textContent = 'WARM UP';
  document.getElementById('detailFocus').textContent = day.focus + ' · ' + available.length + ' movements';
  document.getElementById('equipmentList').innerHTML = '';
  document.getElementById('dayNotes').value = '';
  document.getElementById('saveDayBtn').style.display = 'none';
  document.getElementById('skipDayBtn').style.display = 'none';
  document.getElementById('headerSessionTimer').style.display = 'none';
  document.getElementById('dayNotes').style.display = 'none';

  const list = document.getElementById('exerciseList');
  list.innerHTML = '';

  available.forEach((warmup, wi) => {
    if (warmup.type === 'timed') {
      list.appendChild(buildTimedCard(warmup, wi));
    } else {
      list.appendChild(buildRepsCard(warmup, wi));
    }
  });

  const startBtn = document.createElement('button');
  startBtn.className = 'save-day-btn';
  startBtn.textContent = 'START WORKOUT';
  startBtn.onclick = () => {
    clearInterval(warmupTimerInterval);
    document.getElementById('saveDayBtn').style.display = '';
    document.getElementById('skipDayBtn').style.display = '';
    openDay(dayId);
  };
  list.appendChild(startBtn);
}

function startWarmupTimer(wi, duration) {
  clearInterval(warmupTimerInterval);

  let seconds = duration;
  const bar = document.getElementById(`warmup-timer-bar-${wi}`);
  const count = document.getElementById(`warmup-timer-count-${wi}`);
  const timerEl = document.getElementById(`warmup-timer-${wi}`);
  const startBtn = document.getElementById(`warmup-start-btn-${wi}`);

  timerEl.style.display = 'block';
  startBtn.style.display = 'none';

  warmupTimerInterval = setInterval(() => {
    seconds--;
    count.textContent = seconds;
    bar.style.width = (seconds / duration) * 100 + '%';
    if (seconds <= 0) {
      clearInterval(warmupTimerInterval);
      count.textContent = '✓';
      bar.style.width = '0%';
      const stopBtn = timerEl.querySelector('button');
      if (stopBtn) stopBtn.style.display = 'none';
      markWarmupCardDone(wi);
      showToast('Done — next movement!');
    }
  }, 1000);
}

function markWarmupDone(wi, btn) {
  const alreadyDone = btn.dataset.done === 'true';
  if (alreadyDone) {
    btn.dataset.done = 'false';
    btn.style.background = 'var(--surface)';
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--muted)';
    const card = document.getElementById(`warmup-card-${wi}`);
    if (card) card.style.opacity = '1';
  } else {
    btn.dataset.done = 'true';
    markWarmupCardDone(wi);
  }
}

function buildTimedCard(warmup, wi) {
  const card = document.createElement('div');
  card.className = 'exercise-card';
  card.id = `warmup-card-${wi}`;
  card.innerHTML = `
    <div style="padding:14px 16px">
      <div style="margin-bottom:10px">
        <div class="exercise-name">${warmup.name}</div>
        <div class="exercise-meta" style="margin-top:4px;line-height:1.5">${warmup.description}</div>
        ${warmup.weightNote ? `<div style="margin-top:6px;font-size:12px;color:var(--accent);font-weight:600">🏋️ ${warmup.weightNote}</div>` : ''}
      </div>
      <button
        id="warmup-start-btn-${wi}"
        onclick="startWarmupTimer(${wi}, ${warmup.duration})"
        style="width:100%;padding:10px;background:var(--surface);border:1px solid var(--border);
        border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;
        color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
        <span>▶</span> Start ${warmup.duration}s timer
      </button>
      <div id="warmup-timer-${wi}" style="display:none;margin-top:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div id="warmup-timer-count-${wi}"
            style="font-family:'Bebas Neue',sans-serif;font-size:40px;color:var(--accent);line-height:1">
            ${warmup.duration}
          </div>
          <button
            onclick="stopWarmupTimer(${wi})"
            style="background:none;border:1px solid var(--border);border-radius:8px;
            color:var(--muted);font-family:'DM Sans',sans-serif;font-size:12px;
            font-weight:600;padding:6px 12px;cursor:pointer">
            Stop
          </button>
        </div>
        <div style="height:4px;background:var(--border);border-radius:2px">
          <div id="warmup-timer-bar-${wi}"
            style="height:100%;background:var(--accent);border-radius:2px;width:100%;transition:width 1s linear">
          </div>
        </div>
      </div>
    </div>
  `;
  return card;
}

function buildRepsCard(warmup, wi) {
  const card = document.createElement('div');
  card.className = 'exercise-card';
  card.id = `warmup-card-${wi}`;
  card.innerHTML = `
    <div style="padding:14px 16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="flex:1">
          <div class="exercise-name">${warmup.name}</div>
          <div class="exercise-meta" style="margin-top:4px;line-height:1.5">${warmup.description}</div>
          ${warmup.weightNote ? `<div style="margin-top:6px;font-size:12px;color:var(--accent);font-weight:600">🏋️ ${warmup.weightNote}</div>` : ''}
          <div style="margin-top:8px;font-size:13px;font-weight:600;color:var(--text)">${warmup.reps} reps</div>
        </div>
        <button
          id="warmup-check-${wi}"
          onclick="markWarmupDone(${wi}, this)"
          style="flex-shrink:0;width:40px;height:40px;border-radius:10px;border:1px solid var(--border);
          background:var(--surface);cursor:pointer;font-size:18px;
          display:flex;align-items:center;justify-content:center;color:var(--muted);
          transition:all 0.15s;margin-top:2px">
          ✓
        </button>
      </div>
    </div>
  `;
  return card;
}

function stopWarmupTimer(wi) {
  clearInterval(warmupTimerInterval);
  const timerEl = document.getElementById(`warmup-timer-${wi}`);
  const startBtn = document.getElementById(`warmup-start-btn-${wi}`);
  if (timerEl) timerEl.style.display = 'none';
  if (startBtn) startBtn.style.display = 'flex';
}

function markWarmupCardDone(wi) {
  const btn = document.getElementById(`warmup-check-${wi}`);
  if (btn) {
    btn.dataset.done = 'true';
    btn.style.background = 'var(--accent)';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = '#0d0d0f';
  }
  const card = document.getElementById(`warmup-card-${wi}`);
  if (card) card.style.opacity = '0.55';
}

// ── Day Detail ─────────────────────────────
function openDay(dayId) {
  startSessionTimer();
  currentDayId = dayId;
  const day = PROGRAM.find((d) => d.id === dayId);

  document.getElementById('weekOverview').style.display = 'none';
  document.getElementById('dayDetail').style.display = '';
  document.getElementById('detailTitle').textContent = day.focus.toUpperCase();
  document.getElementById('detailFocus').textContent = day.label + ' · ' + day.exercises.length + ' exercises';
  document.getElementById('equipmentList').innerHTML = day.equipment
    .map((e) => `<span class="equip-tag">${e}</span>`)
    .join('');
  document.getElementById('saveDayBtn').textContent = state.completedDays[`week${state.weekNum}_${dayId}`]
    ? 'UNDO COMPLETE'
    : 'MARK DAY COMPLETE';

  document.getElementById('dayNotes').value = state.notes?.[`week${state.weekNum}_${dayId}`] || '';

  const skipped = state.skippedDays?.[`week${state.weekNum}_${dayId}`];
  document.getElementById('skipDayBtn').textContent = skipped ? 'UNSKIP DAY ' + `(${skipped})` : 'SKIP DAY';
  document.getElementById('skipDayBtn').className = 'skip-day-btn' + (skipped ? ' skipped' : '');
  document.getElementById('headerSessionTimer').style.display = 'block';
  document.getElementById('dayNotes').style.display = '';

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

function hasPBForExercise(name) {
  if (!state.pbs) return false;
  return Object.keys(state.pbs).some((k) => k.startsWith(name + '_'));
}

// ── Exercises ──────────────────────────────
function renderExercises(day) {
  const list = document.getElementById('exerciseList');
  list.innerHTML = '';

  day.exercises.forEach((ex, ei) => {
    const resolvedEx = resolveExercise(ex);
    const repsArr = buildRepsArray(resolvedEx);
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseIndex = ei;

    card.innerHTML = `
  <div class="exercise-header" onclick="toggleEx(this)">
    <div>
      <div class="exercise-name" style="color:${resolvedEx.status === 'unavailable' ? 'var(--muted)' : 'var(--text)'}">
        ${resolvedEx.name}${resolvedEx.superset ? ' + ' + resolvedEx.superset.name : ''}${resolvedEx.status === 'alternative' ? `<span style="font-size:11px;color:var(--muted);font-weight:400;margin-left:6px">(sub for ${ex.name})</span>` : ''}${hasPBForExercise(resolvedEx.name) ? '<span class="pb-badge" style="font-size:11px;font-weight:700;color:#0d0d0f;background:#ffd700;border-radius:6px;padding:2px 6px;margin-left:8px;vertical-align:middle">🏆 PB</span>' : ''}
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
          const key = `week${state.weekNum}_${day.id}_${ei}_${si}`;
          const saved = state.setData[key] || {};
          const ssKey = `week${state.weekNum}_${day.id}_${ei}_${si}_ss`;
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
  const key = `week${state.weekNum}_${dayId}_${ei}_${si}`;
  if (!state.setData[key]) state.setData[key] = {};
  state.setData[key][field] = val;
  saveState();
}

function checkPB(exName, reps, weight) {
  if (!weight || !reps) return false;
  const repNum = parseInt(reps);
  if (!repNum) return false;
  const key = `${exName}_${repNum}`;
  if (!state.pbs) state.pbs = {};
  const current = state.pbs[key];
  if (!current || weight > current) {
    state.pbs[key] = weight;
    saveState();
    return true;
  }
  return false;
}

function toggleSet(dayId, ei, si, btn) {
  const key = `week${state.weekNum}_${dayId}_${ei}_${si}`;
  if (!state.setData[key]) state.setData[key] = {};
  state.setData[key].done = !state.setData[key].done;
  btn.classList.toggle('done');
  saveState();

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

    // PB check
    const reps = parseInt(state.setData[key].reps);
    if (checkPB(resolvedEx.name, reps, loggedWeight)) {
      showToast(`🏆 New PB on ${resolvedEx.name}! ${loggedWeight}kg x ${reps}`);
      markExerciseAsPB(dayId, ei);
    }

    startRestTimer(resolvedEx);
  }
}

function markExerciseAsPB(dayId, ei) {
  const card = document.querySelector(`.exercise-card[data-exercise-index="${ei}"]`);
  if (!card) return;
  const nameEl = card.querySelector('.exercise-name');
  if (!nameEl) return;
  if (!card.querySelector('.pb-badge')) {
    const badge = document.createElement('span');
    badge.className = 'pb-badge';
    badge.textContent = '🏆 PB';
    badge.style.cssText =
      'font-size:11px;font-weight:700;color:#0d0d0f;background:#ffd700;border-radius:6px;padding:2px 6px;margin-left:8px;vertical-align:middle';
    nameEl.appendChild(badge);
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
  const reason = prompt('Reason for skipping?\n\n1. Rest day\n2. Illness\n3. No time\n4. Other');
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
