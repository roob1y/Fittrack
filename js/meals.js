// ══════════════════════════════════════════
//  meals.js
//  Handles meal logging, calorie tracking,
//  date strip, and suggested meals.
// ══════════════════════════════════════════

let selectedDate = todayStr();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Entry point ────────────────────────────
function renderMeals() {
  renderDateStrip();
  renderMealDay();
  renderSuggestList();
}

// ── Date strip ─────────────────────────────
function renderDateStrip() {
  const strip = document.getElementById('dateStrip');
  strip.innerHTML = '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = -2; i <= 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const str = d.toISOString().slice(0, 10);
    const chip = document.createElement('div');
    chip.className = 'date-chip' + (str === selectedDate ? ' active' : '');
    chip.innerHTML = `<div class="chip-day">${days[d.getDay()]}</div><div class="chip-num">${d.getDate()}</div>`;
    chip.onclick = () => { selectedDate = str; renderMeals(); };
    strip.appendChild(chip);
  }
}

// ── Calorie bar + meal list ────────────────
function getMealLog() {
  return state.mealLog[selectedDate] || [];
}

function renderMealDay() {
  const log = getMealLog();
  const total = log.reduce((s, m) => s + m.cal, 0);
  const pct = Math.min(100, (total / 1800) * 100);
  const remain = 1800 - total;

  document.getElementById('calTotal').textContent = total;
  document.getElementById('calRemain').textContent = remain >= 0 ? remain + ' left' : Math.abs(remain) + ' over';
  const fill = document.getElementById('calFill');
  fill.style.width = pct + '%';
  fill.className = 'cal-fill' + (total > 1800 ? ' over' : '');

  const list = document.getElementById('mealList');
  list.innerHTML = '';

  // Staple meals
  STAPLE_MEALS.forEach(meal => {
    const isLogged = log.some(m => m.id === meal.id);
    const item = document.createElement('div');
    item.className = 'meal-item' + (isLogged ? ' logged' : '');
    item.innerHTML = `
      <div class="meal-info">
        <div class="meal-name">${meal.name}</div>
        <div class="meal-desc">${meal.desc}</div>
      </div>
      <div class="meal-cal">${meal.cal}</div>
      <button class="log-meal-btn ${isLogged ? 'logged' : ''}" onclick="toggleMeal('${meal.id}','${meal.name}',${meal.cal})">
        ${isLogged ? 'Logged' : 'Log'}
      </button>
    `;
    list.appendChild(item);
  });

  // Meals added from suggestions
  log.filter(m => !STAPLE_MEALS.find(s => s.id === m.id)).forEach(meal => {
    const item = document.createElement('div');
    item.className = 'meal-item logged';
    item.innerHTML = `
      <div class="meal-info">
        <div class="meal-name">${meal.name}</div>
        <div class="meal-desc">Added from suggestions</div>
      </div>
      <div class="meal-cal">${meal.cal}</div>
      <button class="log-meal-btn logged" onclick="removeMeal('${meal.id}')">Remove</button>
    `;
    list.appendChild(item);
  });
}

// ── Suggested meals ────────────────────────
function renderSuggestList() {
  const log = getMealLog();
  const div = document.getElementById('suggestList');
  div.innerHTML = '';

  SUGGESTED_MEALS.forEach(meal => {
    if (log.some(m => m.id === meal.id)) return;
    const card = document.createElement('div');
    card.className = 'suggest-card';
    card.innerHTML = `
      <div class="suggest-info">
        <div class="suggest-name">${meal.name}</div>
        <div class="suggest-cal">${meal.cal} kcal · ${meal.desc}</div>
      </div>
      <button class="add-suggest-btn" onclick="addSuggest('${meal.id}','${meal.name}',${meal.cal})">+ Add</button>
    `;
    div.appendChild(card);
  });
}

// ── Actions ────────────────────────────────
function toggleMeal(id, name, cal) {
  if (!state.mealLog[selectedDate]) state.mealLog[selectedDate] = [];
  const log = state.mealLog[selectedDate];
  const idx = log.findIndex(m => m.id === id);
  if (idx >= 0) { log.splice(idx, 1); } else { log.push({ id, name, cal }); }
  saveState();
  renderMealDay();
}

function removeMeal(id) {
  if (!state.mealLog[selectedDate]) return;
  state.mealLog[selectedDate] = state.mealLog[selectedDate].filter(m => m.id !== id);
  saveState();
  renderMealDay();
  renderSuggestList();
}

function addSuggest(id, name, cal) {
  if (!state.mealLog[selectedDate]) state.mealLog[selectedDate] = [];
  state.mealLog[selectedDate].push({ id, name, cal });
  saveState();
  showToast(name + ' added!');
  renderMealDay();
  renderSuggestList();
}
