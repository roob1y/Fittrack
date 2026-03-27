// ══════════════════════════════════════════
//  equipment.js
//  Handles equipment profile setup and
//  exercise substitution based on available kit.
// ══════════════════════════════════════════
let settingsOpen = false;
let previousView = 'workouts';

function checkEquipmentProfile() {
  if (!state.equipment) {
    showEquipmentSetup();
    return false;
  }
  return true;
}

function showEquipmentSetup() {
  document
    .querySelectorAll('.view')
    .forEach((el) => el.classList.remove('active'));
  document.getElementById('view-settings').classList.add('active');
  document.getElementById('view-settings').innerHTML = `
    <div>
      <div class="section-title" style="margin-top:4px">YOUR EQUIPMENT</div>
      <p style="color:var(--muted);font-size:14px;margin-bottom:24px">
        Tell us what equipment you have so we can tailor your workouts. You can update this anytime.
      </p>
      <div id="equipmentToggles" style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
        ${EQUIPMENT_LIST.map((item) => {
          const isSelected = state.equipment?.includes(item) ?? false;
          return `
    <div onclick="toggleEquipmentItem(this, '${item}')"
      style="background:var(--card);border:1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);
      padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer"
      data-equipment="${item}" data-selected="${isSelected}">
      <div style="font-weight:600;font-size:15px">${item}</div>
      <div class="equip-check" style="width:24px;height:24px;border-radius:6px;border:1px solid var(--border);
        background:${isSelected ? 'var(--accent)' : 'var(--surface)'};display:flex;align-items:center;justify-content:center;color:#0d0d0f;font-size:14px">
        ${isSelected ? '✓' : ''}
      </div>
    </div>
  `;
        }).join('')}
      </div>
      <button onclick="saveEquipmentProfile()"
        style="width:100%;padding:16px;background:var(--accent);border:none;
        border-radius:var(--radius);font-family:'Bebas Neue',sans-serif;
        font-size:20px;letter-spacing:1.5px;color:#0d0d0f;cursor:pointer">
        SAVE & CONTINUE
      </button>
    </div>
  `;
}

function toggleEquipmentItem(el, item) {
  const selected = el.dataset.selected === 'true';
  el.dataset.selected = !selected;
  el.style.borderColor = !selected ? 'var(--accent)' : 'var(--border)';
  const check = el.querySelector('.equip-check');
  check.style.background = !selected ? 'var(--accent)' : 'var(--surface)';
  check.textContent = !selected ? '✓' : '';
}

function saveEquipmentProfile() {
  const toggles = document.querySelectorAll('[data-equipment]');
  const selected = [];
  toggles.forEach((el) => {
    if (el.dataset.selected === 'true') selected.push(el.dataset.equipment);
  });
  if (selected.length === 0) {
    showToast('Please select at least one piece of equipment');
    return;
  }
  state.equipment = selected;
  saveState();
  restoreSettingsHTML();
  showToast('Equipment saved!');
  setTimeout(() => showView('workouts'), 800);
}

function restoreSettingsHTML() {
  document.getElementById('view-settings').innerHTML = `
    <div class="section-title" style="margin-top:4px">SETTINGS</div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
      <div onclick="editEquipmentProfile()" 
        style="padding:16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:600;font-size:15px">Equipment Profile</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px" id="equipmentCount">${state.equipment?.length || 0} items selected</div>
        </div>
        <div style="color:var(--accent);font-size:18px">›</div>
      </div>
      <div onclick="resetApp()"
        style="padding:16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
        <div>
          <div style="font-weight:600;font-size:15px;color:var(--red)">Reset All Data</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Clear all workouts and settings</div>
        </div>
        <div style="color:var(--red);font-size:18px">›</div>
      </div>
    </div>
  `;
}

function hasEquipment(requiredEquipment) {
  if (!requiredEquipment || requiredEquipment.length === 0) return true;
  return requiredEquipment.every((e) => state.equipment?.includes(e));
}

function resolveExercise(ex) {
  if (hasEquipment(ex.equipment)) return { ...ex, status: 'available' };
  if (ex.alternative && hasEquipment(ex.alternative.equipment)) {
    return { ...ex, name: ex.alternative.name, status: 'alternative' };
  }
  return { ...ex, status: 'unavailable' };
}

function editEquipmentProfile() {
  showEquipmentSetup();
}

function resetApp() {
  if (
    confirm(
      'Are you sure? This will delete all your data and cannot be undone.',
    )
  ) {
    localStorage.removeItem('fittrack_v1');
    location.reload();
  }
}

function showSettings() {
  if (settingsOpen) {
    settingsOpen = false;
    showView(previousView);
    return;
  }
  settingsOpen = true;
  previousView = currentView;
  restoreSettingsHTML();
  document
    .querySelectorAll('.view')
    .forEach((el) => el.classList.remove('active'));
  document.getElementById('view-settings').classList.add('active');
}
