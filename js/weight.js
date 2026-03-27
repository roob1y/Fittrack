// ══════════════════════════════════════════
//  weight.js
//  Handles body weight logging and trend graph.
// ══════════════════════════════════════════

function renderWeight() {
  const container = document.getElementById('view-weight');
  const unit = state.weightUnit || 'kg';
  const log = state.weightLog || {};
  const today = todayStr();
  const todayWeight = log[today];

  // Get last 30 days of entries
  const entries = getLast30DaysEntries();
  const current = entries.length ? entries[entries.length - 1].weight : null;
  const start = entries.length ? entries[0].weight : null;
  const trend = current && start ? current - start : null;

  container.innerHTML = `
    <div class="section-title" style="margin-top:4px">BODY WEIGHT</div>

    <!-- Unit toggle -->
    <div style="display:flex;gap:8px;margin-bottom:20px">
      <button onclick="setWeightUnit('kg')"
        style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);
        background:${unit === 'kg' ? 'var(--accent)' : 'var(--card)'};
        color:${unit === 'kg' ? '#0d0d0f' : 'var(--muted)'};
        font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer">
        kg
      </button>
      <button onclick="setWeightUnit('lbs')"
        style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);
        background:${unit === 'lbs' ? 'var(--accent)' : 'var(--card)'};
        color:${unit === 'lbs' ? '#0d0d0f' : 'var(--muted)'};
        font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer">
        lbs
      </button>
    </div>

    <!-- Stats -->
    <div class="progress-grid" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-val">${current ? convertWeight(current, unit) : '—'}</div>
        <div class="stat-label">Current (${unit})</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${start ? convertWeight(start, unit) : '—'}</div>
        <div class="stat-label">Starting (${unit})</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:${trend > 0 ? 'var(--red)' : trend < 0 ? 'var(--accent)' : 'var(--text)'}">
          ${trend !== null ? (trend > 0 ? '+' : '') + convertWeight(trend, unit) : '—'}
        </div>
        <div class="stat-label">Change (${unit})</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${entries.length}</div>
        <div class="stat-label">Days logged</div>
      </div>
    </div>

    <!-- Graph -->
    <div class="section-title">TREND</div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px">
      ${entries.length < 2 ? `<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px 0">Log at least 2 days to see your trend</div>` : ''}
      <canvas id="weightChart" style="width:100%;height:200px;display:${entries.length >= 2 ? 'block' : 'none'}"></canvas>
    </div>

    <!-- Log today -->
    <div class="section-title">LOG TODAY</div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
      <div style="display:flex;gap:10px;align-items:center">
        <input id="weightInput" type="number" inputmode="decimal" 
          placeholder="Enter weight in ${unit}"
          value="${todayWeight ? convertWeight(todayWeight, unit) : ''}"
          style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;
          color:var(--text);font-family:'DM Sans',sans-serif;font-size:16px;padding:12px;text-align:center">
        <button onclick="logWeight()"
          style="padding:12px 20px;background:var(--accent);border:none;border-radius:8px;
          font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;color:#0d0d0f;cursor:pointer">
          SAVE
        </button>
      </div>
      ${todayWeight ? `<div style="font-size:12px;color:var(--muted);margin-top:8px;text-align:center">Today: ${convertWeight(todayWeight, unit)}${unit} — tap save to update</div>` : ''}
    </div>
  `;

  if (entries.length >= 2) drawWeightGraph(entries, unit);
}

// ── Weight logging ─────────────────────────
function logWeight() {
  const input = document.getElementById('weightInput');
  const unit = state.weightUnit || 'kg';
  const val = parseFloat(input.value);
  if (!val || val <= 0) {
    showToast('Please enter a valid weight');
    return;
  }
  // Always store in kg internally
  const inKg = unit === 'lbs' ? val / 2.2046 : val;
  if (!state.weightLog) state.weightLog = {};
  state.weightLog[todayStr()] = Math.round(inKg * 10) / 10;
  saveState();
  showToast('Weight logged!');
  renderWeight();
}

function setWeightUnit(unit) {
  state.weightUnit = unit;
  saveState();
  renderWeight();
}

// ── Conversion ─────────────────────────────
function convertWeight(kg, unit) {
  if (unit === 'lbs') return Math.round(kg * 2.2046 * 10) / 10;
  return Math.round(kg * 10) / 10;
}

// ── Data ───────────────────────────────────
function getLast30DaysEntries() {
  const log = state.weightLog || {};
  const entries = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = d.toISOString().slice(0, 10);
    if (log[str]) entries.push({ date: str, weight: log[str] });
  }
  return entries;
}

// ── Graph ──────────────────────────────────
function drawWeightGraph(entries, unit) {
  const canvas = document.getElementById('weightChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = 200 * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const w = canvas.offsetWidth;
  const h = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const weights = entries.map((e) => convertWeight(e.weight, unit));
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  const toX = (i) => padding.left + (i / (entries.length - 1)) * (w - padding.left - padding.right);
  const toY = (v) => padding.top + (1 - (v - minW) / (maxW - minW)) * (h - padding.top - padding.bottom);

  // Grid lines
  ctx.strokeStyle = '#2a2a35';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * (h - padding.top - padding.bottom);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    // Y labels
    const val = maxW - (i / 4) * (maxW - minW);
    ctx.fillStyle = '#7a7a8c';
    ctx.font = '11px DM Sans';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val * 10) / 10, padding.left - 4, y + 4);
  }

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#c8f135';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  entries.forEach((e, i) => {
    const x = toX(i);
    const y = toY(convertWeight(e.weight, unit));
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill under line
  ctx.lineTo(toX(entries.length - 1), h - padding.bottom);
  ctx.lineTo(toX(0), h - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200,241,53,0.08)';
  ctx.fill();

  // Dots
  entries.forEach((e, i) => {
    const x = toX(i);
    const y = toY(convertWeight(e.weight, unit));
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#c8f135';
    ctx.fill();
  });

  // X labels — show first, middle and last date
  ctx.fillStyle = '#7a7a8c';
  ctx.font = '11px DM Sans';
  ctx.textAlign = 'center';
  const labelIndices = [0, Math.floor(entries.length / 2), entries.length - 1];
  labelIndices.forEach((i) => {
    const date = new Date(entries[i].date);
    const label = `${date.getDate()}/${date.getMonth() + 1}`;
    ctx.fillText(label, toX(i), h - padding.bottom + 16);
  });
}
