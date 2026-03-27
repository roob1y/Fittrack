// ══════════════════════════════════════════
//  progress.js
//  Handles stats overview and weekly log.
//  Future: strength graphs go here.
// ══════════════════════════════════════════

function renderProgress() {
  const container = document.getElementById('view-progress');
  container.innerHTML = `
    <div class="section-title" style="margin-top:4px">YOUR PROGRESS</div>

    <!-- Stats -->
    <div class="progress-grid" style="margin-bottom:20px">
      <div class="stat-card"><div class="stat-val" id="statWorkouts">0</div><div class="stat-label">Workouts done</div></div>
      <div class="stat-card"><div class="stat-val" id="statStreak">0</div><div class="stat-label">Day streak</div></div>
      <div class="stat-card"><div class="stat-val" id="statMeals">0</div><div class="stat-label">Meals logged</div></div>
      <div class="stat-card"><div class="stat-val" id="statCal">—</div><div class="stat-label">Avg daily kcal</div></div>
    </div>

    <!-- Week log -->
    <div class="section-title">WEEK LOG</div>
    <div class="week-log" id="weekLogList" style="margin-bottom:24px"></div>

    <!-- Strength graphs -->
    <div class="section-title">STRENGTH PROGRESS</div>
    <div id="strengthGraphs"></div>
  `;

  // Stats
  const doneCount = Object.keys(state.completedDays || {}).length;
  document.getElementById('statWorkouts').textContent = doneCount;
  document.getElementById('statStreak').textContent = calcStreak();

  // Week log
  const logList = document.getElementById('weekLogList');
  PROGRAM.forEach((day) => {
    const done = !!state.completedDays?.[`week${state.weekNum}_${day.id}`];
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
        ${sessionTime !== null && sessionTime !== undefined ? `<div style="font-size:12px;color:var(--muted)">${sessionTime} mins</div>` : ''}
        <div class="wl-badge ${done ? 'done' : skipped ? 'skipped' : 'skip'}">${done ? '✓ Done' : skipped ? '⊘ ' + skipped : 'Pending'}</div>
      </div>
    `;
    logList.appendChild(row);
  });

  // Strength graphs
  renderStrengthGraphs();
}

function renderStrengthGraphs() {
  const container = document.getElementById('strengthGraphs');
  container.innerHTML = '';

  PROGRAM.forEach((day) => {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:20px';
    section.innerHTML = `<div style="font-size:13px;font-weight:600;color:var(--muted);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:10px">${day.focus}</div>`;

    day.exercises.forEach((ex, ei) => {
      const data = getExerciseProgressData(day.id, ei, ex.name, 28);
      if (data.length === 0) return;

      const card = document.createElement('div');
      card.style.cssText =
        'background:var(--card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;overflow:hidden';
      card.innerHTML = `
        <div onclick="toggleStrengthGraph(this)"
          style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
          <div>
            <div style="font-weight:600;font-size:14px">${ex.name}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${data.length} sessions logged</div>
          </div>
          <div style="color:var(--accent);font-size:20px">+</div>
        </div>
        <div class="strength-graph-body" style="display:none;padding:16px;border-top:1px solid var(--border)">
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button onclick="changeGraphRange(this, '${day.id}', ${ei}, '${ex.name}', 28)" 
              style="flex:1;padding:6px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);
              color:#0d0d0f;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer">
              4 weeks
            </button>
            <button onclick="changeGraphRange(this, '${day.id}', ${ei}, '${ex.name}', 56)"
              style="flex:1;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--card);
              color:var(--muted);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer">
              8 weeks
            </button>
            <button onclick="changeGraphRange(this, '${day.id}', ${ei}, '${ex.name}', 365)"
              style="flex:1;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--card);
              color:var(--muted);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer">
              All time
            </button>
          </div>
          <canvas id="graph_${day.id}_${ei}" style="width:100%;height:160px"></canvas>
        </div>
      `;
      section.appendChild(card);
    });

    if (section.children.length > 1) container.appendChild(section);
  });

  if (container.children.length === 0) {
    container.innerHTML = `<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px 0">Complete some workouts to see your strength progress</div>`;
  }
}

function toggleStrengthGraph(header) {
  const body = header.nextElementSibling;
  const toggle = header.querySelector('div:last-child');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  toggle.textContent = isOpen ? '+' : '−';
  if (!isOpen) {
    const canvas = body.querySelector('canvas');
    if (canvas) {
      const dayId = canvas.id.split('_')[1];
      const ei = parseInt(canvas.id.split('_')[2]);
      const day = PROGRAM.find((d) => d.id === dayId);
      const ex = day?.exercises[ei];
      if (ex) drawStrengthGraph(canvas.id, dayId, ei, ex.name, 28);
    }
  }
}

function changeGraphRange(btn, dayId, ei, exName, days) {
  const buttons = btn.parentElement.querySelectorAll('button');
  buttons.forEach((b) => {
    b.style.background = 'var(--card)';
    b.style.borderColor = 'var(--border)';
    b.style.color = 'var(--muted)';
  });
  btn.style.background = 'var(--accent)';
  btn.style.borderColor = 'var(--accent)';
  btn.style.color = '#0d0d0f';
  drawStrengthGraph(`graph_${dayId}_${ei}`, dayId, ei, exName, days);
}

function getExerciseProgressData(dayId, ei, exName, days) {
  const entries = [];
  const seen = new Set();

  for (let week = 1; week <= 52; week++) {
    const key = `week${week}_${dayId}`;
    const date = state.workoutDates?.[key];
    if (!date) continue;

    const dateObj = new Date(date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    if (days !== 365 && dateObj < cutoff) continue;
    if (seen.has(date)) continue;
    seen.add(date);

    let maxWeight = 0;
    for (let si = 0; si < 10; si++) {
      const setKey = `week${week}_${dayId}_${ei}_${si}`;
      const w = parseFloat(state.setData?.[setKey]?.weight);
      if (w > maxWeight) maxWeight = w;
    }
    if (maxWeight > 0) entries.push({ date, weight: maxWeight });
  }

  return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function drawStrengthGraph(canvasId, dayId, ei, exName, days) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const entries = getExerciseProgressData(dayId, ei, exName, days);
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = 160 * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const w = canvas.offsetWidth;
  const h = 160;
  const padding = { top: 16, right: 16, bottom: 28, left: 36 };

  ctx.clearRect(0, 0, w, h);

  if (entries.length < 2) {
    ctx.fillStyle = '#7a7a8c';
    ctx.font = '12px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('Not enough data for this range', w / 2, h / 2);
    return;
  }

  const weights = entries.map((e) => e.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;

  const toX = (i) => padding.left + (i / (entries.length - 1)) * (w - padding.left - padding.right);
  const toY = (v) => padding.top + (1 - (v - minW) / (maxW - minW)) * (h - padding.top - padding.bottom);

  // Grid lines
  ctx.strokeStyle = '#2a2a35';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (i / 3) * (h - padding.top - padding.bottom);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    const val = maxW - (i / 3) * (maxW - minW);
    ctx.fillStyle = '#7a7a8c';
    ctx.font = '10px DM Sans';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val) + 'kg', padding.left - 4, y + 4);
  }

  // Fill
  ctx.beginPath();
  entries.forEach((e, i) => {
    i === 0 ? ctx.moveTo(toX(i), toY(e.weight)) : ctx.lineTo(toX(i), toY(e.weight));
  });
  ctx.lineTo(toX(entries.length - 1), h - padding.bottom);
  ctx.lineTo(toX(0), h - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200,241,53,0.08)';
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#c8f135';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  entries.forEach((e, i) => {
    i === 0 ? ctx.moveTo(toX(i), toY(e.weight)) : ctx.lineTo(toX(i), toY(e.weight));
  });
  ctx.stroke();

  // Dots
  entries.forEach((e, i) => {
    ctx.beginPath();
    ctx.arc(toX(i), toY(e.weight), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#c8f135';
    ctx.fill();
  });

  // X labels
  ctx.fillStyle = '#7a7a8c';
  ctx.font = '10px DM Sans';
  ctx.textAlign = 'center';
  const labelIndices =
    entries.length <= 4 ? entries.map((_, i) => i) : [0, Math.floor(entries.length / 2), entries.length - 1];
  labelIndices.forEach((i) => {
    const date = new Date(entries[i].date);
    ctx.fillText(`${date.getDate()}/${date.getMonth() + 1}`, toX(i), h - padding.bottom + 14);
  });
}

function calcStreak() {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    const hasWorkout = Object.values(state.workoutDates || {}).some((date) => date === dateStr);
    if (hasWorkout) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
