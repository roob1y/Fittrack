// ══════════════════════════════════════════
//  calendar.js
//  Handles calendar view, programme start date,
//  and mapping workouts to real calendar dates.
// ══════════════════════════════════════════

// ── Entry point ────────────────────────────
function renderCalendar() {
  checkProgrammeStart();
  renderCalendarView();
}

// ── Programme start date ───────────────────
function checkProgrammeStart() {
  if (!state.programmeStartDate) {
    showStartDatePicker();
  }
}

function showStartDatePicker() {
  const container = document.getElementById('view-calendar');
  container.innerHTML = `
    <div class="section-title" style="margin-top:4px">WHEN DO YOU START?</div>
    <p style="color:var(--muted);font-size:14px;margin-bottom:24px">
      Pick the date you want to begin your programme. This is used to map your workouts to real calendar dates.
    </p>
    <input type="date" id="startDateInput"
      style="width:100%;background:var(--card);border:1px solid var(--border);
      border-radius:var(--radius);color:var(--text);font-family:'DM Sans',sans-serif;
      font-size:16px;padding:14px;margin-bottom:16px"
      value="${todayStr()}">
    <button onclick="confirmStartDate()"
      style="width:100%;padding:16px;background:var(--accent);border:none;
      border-radius:var(--radius);font-family:'Bebas Neue',sans-serif;
      font-size:20px;letter-spacing:1.5px;color:#0d0d0f;cursor:pointer">
      LET'S GO
    </button>
  `;
}

function confirmStartDate() {
  const input = document.getElementById('startDateInput');
  if (!input.value) return;
  state.programmeStartDate = input.value;
  saveState();
  renderCalendarView();
}

// ── Calendar view ──────────────────────────
let calendarMode = 'week'; // 'week' or 'month'
let calendarOffset = 0; // weeks or months offset from current

function renderCalendarView() {
  const container = document.getElementById('view-calendar');
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;margin-top:4px">
      <div class="section-title" style="margin-bottom:0">CALENDAR</div>
      <div style="display:flex;gap:8px">
        <button onclick="setCalendarMode('week')" 
          style="padding:6px 14px;border-radius:8px;border:1px solid var(--border);
          background:${calendarMode === 'week' ? 'var(--accent)' : 'var(--card)'};
          color:${calendarMode === 'week' ? '#0d0d0f' : 'var(--muted)'};
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer">
          Week
        </button>
        <button onclick="setCalendarMode('month')"
          style="padding:6px 14px;border-radius:8px;border:1px solid var(--border);
          background:${calendarMode === 'month' ? 'var(--accent)' : 'var(--card)'};
          color:${calendarMode === 'month' ? '#0d0d0f' : 'var(--muted)'};
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer">
          Month
        </button>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <button onclick="calendarNav(-1)"
        style="background:var(--card);border:1px solid var(--border);border-radius:8px;
        color:var(--accent);font-size:20px;padding:6px 14px;cursor:pointer">‹</button>
      <div id="calendarPeriodLabel" style="font-weight:600;font-size:15px"></div>
      <button onclick="calendarNav(1)"
        style="background:var(--card);border:1px solid var(--border);border-radius:8px;
        color:var(--accent);font-size:20px;padding:6px 14px;cursor:pointer">›</button>
    </div>
    <div id="calendarGrid"></div>
    <div id="calendarDayDetail" style="margin-top:20px"></div>
  `;

  renderCalendarGrid();
}

function setCalendarMode(mode) {
  calendarMode = mode;
  calendarOffset = 0;
  renderCalendarView();
}

function calendarNav(direction) {
  calendarOffset += direction;
  renderCalendarGrid();
}

// ── Grid rendering ─────────────────────────
function renderCalendarGrid() {
  if (calendarMode === 'week') renderWeekGrid();
  else renderMonthGrid();
}

function renderWeekGrid() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + calendarOffset * 7);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const label = document.getElementById('calendarPeriodLabel');
  label.textContent = formatWeekLabel(startOfWeek);

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const row = document.createElement('div');
  row.style.cssText =
    'display:grid;grid-template-columns:repeat(7,1fr);gap:6px';

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const str = d.toISOString().slice(0, 10);
    const status = getDayStatus(str);
    const isToday = str === todayStr();

    const cell = document.createElement('div');
    cell.style.cssText = `
      background:${statusColor(status)};
      border:${isToday ? '2px solid var(--accent)' : '1px solid var(--border)'};
      border-radius:10px;padding:10px 4px;text-align:center;cursor:pointer;
    `;
    cell.innerHTML = `
      <div style="font-size:11px;color:${status ? '#0d0d0f' : 'var(--muted)'};font-weight:600">${days[d.getDay()]}</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:${status ? '#0d0d0f' : 'var(--text)'}">${d.getDate()}</div>
      <div style="width:6px;height:6px;border-radius:50%;background:${statusDot(status)};margin:4px auto 0"></div>
    `;
    cell.onclick = () => showDayDetail(str);
    row.appendChild(cell);
  }

  grid.appendChild(row);
}

function renderMonthGrid() {
  const today = new Date();
  const month = new Date(
    today.getFullYear(),
    today.getMonth() + calendarOffset,
    1,
  );
  const label = document.getElementById('calendarPeriodLabel');
  label.textContent = month.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const headerRow = document.createElement('div');
  headerRow.style.cssText =
    'display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px';
  days.forEach((d) => {
    const cell = document.createElement('div');
    cell.style.cssText =
      'text-align:center;font-size:11px;color:var(--muted);font-weight:600;padding:4px 0';
    cell.textContent = d;
    headerRow.appendChild(cell);
  });
  grid.appendChild(headerRow);

  const monthGrid = document.createElement('div');
  monthGrid.style.cssText =
    'display:grid;grid-template-columns:repeat(7,1fr);gap:4px';

  const firstDay = month.getDay();
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    monthGrid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d);
    const str = date.toISOString().slice(0, 10);
    const status = getDayStatus(str);
    const isToday = str === todayStr();

    const cell = document.createElement('div');
    cell.style.cssText = `
      background:${statusColor(status)};
      border:${isToday ? '2px solid var(--accent)' : '1px solid var(--border)'};
      border-radius:8px;padding:6px 2px;text-align:center;cursor:pointer;min-height:44px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
    `;
    cell.innerHTML = `
      <div style="font-size:13px;color:${status ? '#0d0d0f' : 'var(--text)'};font-weight:500">${d}</div>
      <div style="width:5px;height:5px;border-radius:50%;background:${statusDot(status)};margin-top:3px"></div>
    `;
    cell.onclick = () => showDayDetail(str);
    monthGrid.appendChild(cell);
  }

  grid.appendChild(monthGrid);
}

// ── Day status ─────────────────────────────
function getDayStatus(dateStr) {
  // Check if any workout day was completed or skipped on this date
  for (const day of PROGRAM) {
    for (let week = 1; week <= 52; week++) {
      const key = `week${week}_${day.id}`;
      if (state.completedDays?.[key] && state.workoutDates?.[key] === dateStr)
        return 'trained';
      if (state.skippedDays?.[key] && state.workoutDates?.[key] === dateStr)
        return 'skipped';
    }
  }
  return null;
}

function statusColor(status) {
  if (status === 'trained') return 'var(--accent)';
  if (status === 'skipped') return 'rgba(255,77,109,0.2)';
  return 'var(--card)';
}

function statusDot(status) {
  if (status === 'trained') return '#0d0d0f';
  if (status === 'skipped') return 'var(--red)';
  return 'transparent';
}

// ── Day detail ─────────────────────────────
function showDayDetail(dateStr) {
  const detail = document.getElementById('calendarDayDetail');
  const workoutInfo = getWorkoutForDate(dateStr);
  const formatted = new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (!workoutInfo) {
    detail.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
        <div style="font-weight:600;font-size:15px;margin-bottom:4px">${formatted}</div>
        <div style="font-size:13px;color:var(--muted)">No workout logged</div>
      </div>
    `;
    return;
  }

  detail.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px">
      <div style="font-weight:600;font-size:15px;margin-bottom:4px">${formatted}</div>
      <div style="font-size:13px;color:var(--accent);font-weight:600">${workoutInfo.focus}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">${workoutInfo.status}</div>
    </div>
  `;
}

function getWorkoutForDate(dateStr) {
  for (const day of PROGRAM) {
    for (let week = 1; week <= 52; week++) {
      const key = `week${week}_${day.id}`;
      if (state.workoutDates?.[key] === dateStr) {
        const status = state.completedDays?.[key]
          ? '✓ Completed'
          : state.skippedDays?.[key]
            ? '⊘ Skipped — ' + state.skippedDays[key]
            : null;
        if (status) return { focus: day.focus, status };
      }
    }
  }
  return null;
}

// ── Helpers ────────────────────────────────
function formatWeekLabel(startOfWeek) {
  const end = new Date(startOfWeek);
  end.setDate(startOfWeek.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return (
    startOfWeek.toLocaleDateString('en-GB', opts) +
    ' — ' +
    end.toLocaleDateString('en-GB', opts)
  );
}
