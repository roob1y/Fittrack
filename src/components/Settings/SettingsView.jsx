import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { EQUIPMENT_LIST } from '../../data/program';
import { exportCSV } from '../../utils/exportCSV';
import { exportPDF } from '../../utils/exportPDF';
import { exportJSON } from '../../utils/exportJSON';
import { importJSON } from '../../utils/importJSON';

const EQUIPMENT_GROUPS = [
  {
    label: 'Barbell',
    items: ['Barbell'],
    emoji: '🏋️',
  },
  {
    label: 'Benches',
    items: ['Flat Bench', 'Incline Bench'],
    emoji: '🪑',
  },
  {
    label: 'Rack',
    items: ['Squat Rack'],
    emoji: '🔩',
  },
  {
    label: 'Dumbbells',
    items: ['Dumbbells'],
    emoji: '💪',
  },
  {
    label: 'Machines',
    items: ['Leg Curl Machine', 'Leg Extension Machine', 'Leg Press Machine', 'Chest Supported Row Machine'],
    emoji: '🦵',
  },
  {
    label: 'Accessories',
    items: ['Resistance Bands', 'Pull Up Bar'],
    emoji: '🔧',
  },
];

const PRESETS = [
  {
    label: 'Full Home Gym',
    items: ['Barbell', 'Flat Bench', 'Incline Bench', 'Squat Rack', 'Dumbbells', 'Resistance Bands', 'Pull Up Bar'],
  },
  { label: 'Dumbbells Only', items: ['Dumbbells', 'Flat Bench'] },
  {
    label: 'Full Commercial Gym',
    items: [
      'Barbell',
      'Flat Bench',
      'Incline Bench',
      'Squat Rack',
      'Dumbbells',
      'Leg Curl Machine',
      'Leg Extension Machine',
      'Leg Press Machine',
      'Chest Supported Row Machine',
      'Resistance Bands',
      'Pull Up Bar',
    ],
  },
];

function EquipmentPicker({ onSave }) {
  const equipment = useStore((s) => s.equipment);
  const barWeights = useStore((s) => s.barWeights);
  const setBarWeights = useStore((s) => s.setBarWeights);
  const [selected, setSelected] = useState(equipment || []);
  const [bar7ft, setBar7ft] = useState(String(barWeights?.['7ft'] ?? 20));
  const [bar5ft, setBar5ft] = useState(String(barWeights?.['5ft'] ?? 15));

  function toggle(item) {
    setSelected((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]));
  }

  function applyPreset(items) {
    setSelected(items);
  }

  function toggleAll() {
    const all = EQUIPMENT_GROUPS.flatMap((g) => g.items);
    setSelected((prev) => (prev.length === all.length ? [] : all));
  }

  const all = EQUIPMENT_GROUPS.flatMap((g) => g.items);
  const allSelected = selected.length === all.length;

  return (
    <div>
      <div className="section-title" style={{ marginTop: '4px' }}>
        YOUR EQUIPMENT
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
        Tell us what you have so we can tailor your workouts.
      </p>

      {/* Presets */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          Quick select
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.items)}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={toggleAll}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              background: allSelected ? 'var(--accent)' : 'var(--card)',
              color: allSelected ? '#0d0d0f' : 'var(--muted)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      {/* Groups */}
      {EQUIPMENT_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            {group.emoji} {group.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {group.items.map((item) => {
              const isSelected = selected.includes(item);
              return (
                <div
                  key={item}
                  onClick={() => toggle(item)}
                  style={{
                    background: 'var(--card)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{item}</div>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: isSelected ? 'var(--accent)' : 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0d0d0f',
                      fontSize: '14px',
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bar weights — only shown if the relevant barbell is selected */}
      {(selected.includes('Barbell')) && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            🏋️ BAR WEIGHTS
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Used to calculate plates on the bar. Set to your actual bar weight.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selected.includes('Barbell') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Barbell</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={bar7ft}
                    onChange={(e) => setBar7ft(e.target.value)}
                    style={{
                      width: '72px',
                      padding: '8px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      fontSize: '16px',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>kg</span>
                </div>
              </div>
            )}
            {selected.includes('Barbell') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>5ft Barbell</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={bar5ft}
                    onChange={(e) => setBar5ft(e.target.value)}
                    style={{
                      width: '72px',
                      padding: '8px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      fontSize: '16px',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>kg</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => {
          setBarWeights({
            '7ft': parseFloat(bar7ft) || 20,
            '5ft': parseFloat(bar5ft) || 15,
          });
          onSave(selected);
        }}
        style={{
          width: '100%',
          padding: '16px',
          background: 'var(--accent)',
          border: 'none',
          borderRadius: 'var(--radius)',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '20px',
          letterSpacing: '1.5px',
          color: '#0d0d0f',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        SAVE & CONTINUE
      </button>
    </div>
  );
}

export default function SettingsView({ onEquipmentSaved }) {
  const restDurationOverride = useStore((s) => s.restDurationOverride);
  const setRestDurationOverride = useStore((s) => s.setRestDurationOverride);
  const equipment = useStore((s) => s.equipment);
  const setEquipment = useStore((s) => s.setEquipment);
  const resetAll = useStore((s) => s.resetAll);
  const quoteTone = useStore((s) => s.quoteTone);
  const setQuoteTone = useStore((s) => s.setQuoteTone);

  const weightUnit = useStore((s) => s.weightUnit);
  const setWeightUnit = useStore((s) => s.setWeightUnit);
  const convertSetDataUnits = useStore((s) => s.convertSetDataUnits);

  const [editing, setEditing] = useState(!equipment);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [pendingUnit, setPendingUnit] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const state = useStore((s) => s);

  function handleUnitChange(unit) {
    if (unit === weightUnit) return;
    setPendingUnit(unit);
    setShowUnitModal(true);
  }

  function confirmUnitConvert() {
    convertSetDataUnits(weightUnit, pendingUnit);
    setWeightUnit(pendingUnit);
    setShowUnitModal(false);
  }

  function confirmUnitKeep() {
    setWeightUnit(pendingUnit);
    setShowUnitModal(false);
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowImportModal(true);
    e.target.value = '';
  }

  function confirmImport() {
    importJSON(
      pendingFile,
      () => {
        setShowImportModal(false);
        window.location.reload();
      },
      (msg) => {
        setShowImportModal(false);
        alert(msg);
      },
    );
  }

  const savePB = useStore((s) => s.savePB);

  async function handleExportCSV() {
    exportCSV(state);
  }

  async function handleExportPDF() {
    exportPDF(state);
  }

  function handleSave(selected) {
    if (selected.length === 0) return;
    setEquipment(selected);
    setEditing(false);
    onEquipmentSaved();
  }

  function handleReset() {
    resetAll();
    setShowResetModal(false);
    window.location.reload();
  }

  if (editing) {
    return <EquipmentPicker onSave={handleSave} />;
  }

  return (
    <div>
      <div className="section-title" style={{ marginTop: '4px' }}>
        SETTINGS
      </div>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={() => setEditing(true)}
          style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Equipment Profile</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              {equipment?.length || 0} items selected
            </div>
          </div>
          <div style={{ color: 'var(--accent)', fontSize: '18px' }}>›</div>
        </div>
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '15px', flexShrink: 0 }}>Motivation Tone</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'right' }}>
            {['positive', 'hardcore', 'stoic', 'off'].map((tone) => (
              <button
                key={tone}
                onClick={() => setQuoteTone(tone)}
                style={{
                  padding: '10px 18px',
                  minHeight: '44px',
                  borderRadius: '20px',
                  border: `1px solid ${quoteTone === tone ? 'var(--accent)' : 'var(--border)'}`,
                  background: quoteTone === tone ? 'var(--accent)' : 'var(--card)',
                  color: quoteTone === tone ? '#0d0d0f' : 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Weight Unit</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
            Used across workouts, weight log and exports
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['kg', 'lbs'].map((u) => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${weightUnit === u ? 'var(--accent)' : 'var(--border)'}`,
                  background: weightUnit === u ? 'var(--accent)' : 'var(--card)',
                  color: weightUnit === u ? '#0d0d0f' : 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Rest Duration */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '15px',
              marginBottom: '10px',
            }}
          >
            Rest Duration
          </div>
          {[
            { label: 'Compound lifts', key: 'compound', default: 90 },
            { label: 'Isolation exercises', key: 'accessory', default: 60 },
          ].map(({ label, key, default: def }) => {
            const current = restDurationOverride?.[key] ?? def;
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  marginBottom: '10px',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() =>
                      setRestDurationOverride({
                        ...(restDurationOverride ?? { compound: 90, accessory: 60 }),
                        [key]: Math.max(30, current - 10),
                      })
                    }
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface2)',
                      color: 'var(--text)',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    −
                  </button>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '20px',
                      minWidth: '48px',
                      textAlign: 'center',
                    }}
                  >
                    {current}s
                  </div>
                  <button
                    onClick={() =>
                      setRestDurationOverride({
                        ...(restDurationOverride ?? { compound: 90, accessory: 60 }),
                        [key]: Math.min(300, current + 10),
                      })
                    }
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface2)',
                      color: 'var(--text)',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Backup & Restore */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Backup & Restore</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
            Save a full backup of your data or restore from a previous backup
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => exportJSON(state)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Export Backup
            </button>
            <label
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Restore Backup
              <input type="file" accept=".json" onChange={handleFileChosen} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Export */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Export Data</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
            Download your workouts, sessions and body weight
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: '#0d0d0f',
                cursor: 'pointer',
              }}
            >
              Export PDF
            </button>
          </div>
        </div>
        <div
          onClick={() => setShowResetModal(true)}
          style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--red)' }}>Reset All Data</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              Clear all workouts and settings
            </div>
          </div>
          <div style={{ color: 'var(--red)', fontSize: '18px' }}>›</div>
        </div>
      </div>

      {showUnitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '17px', marginBottom: '10px' }}>Switch to {pendingUnit}?</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Do you want to convert your existing logged set weights to {pendingUnit}? Your body weight log is
              unaffected.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={confirmUnitConvert}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0d0d0f',
                  cursor: 'pointer',
                }}
              >
                Convert existing weights
              </button>
              <button
                onClick={confirmUnitKeep}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Keep values as-is
              </button>
              <button
                onClick={() => setShowUnitModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '17px', marginBottom: '10px' }}>Restore Backup?</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              This will overwrite all your current data with the backup. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPendingFile(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--red)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius) var(--radius) 0 0',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '24px',
                letterSpacing: '1.5px',
                marginBottom: '8px',
              }}
            >
              RESET ALL DATA?
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
              This will permanently delete all your workouts, progress and settings. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowResetModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '18px',
                  letterSpacing: '1px',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                NO THANKS
              </button>
              <button
                onClick={handleReset}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '18px',
                  letterSpacing: '1px',
                  color: '#0d0d0f',
                  cursor: 'pointer',
                }}
              >
                YES, RESET
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          textAlign: 'center',
          marginTop: '32px',
          marginBottom: '8px',
          color: 'var(--muted)',
          fontSize: '12px',
        }}
      >
        FitTrack v1.4 · Fitness tracking made easy
      </div>
    </div>
  );
}
