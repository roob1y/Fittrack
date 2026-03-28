import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { EQUIPMENT_LIST } from '../../data/program';

const EQUIPMENT_GROUPS = [
  {
    label: 'Barbells',
    items: ['Barbell (7ft)', 'Barbell (5ft)'],
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
    items: [
      'Barbell (7ft)',
      'Barbell (5ft)',
      'Flat Bench',
      'Incline Bench',
      'Squat Rack',
      'Dumbbells',
      'Resistance Bands',
      'Pull Up Bar',
    ],
  },
  { label: 'Dumbbells Only', items: ['Dumbbells', 'Flat Bench'] },
  {
    label: 'Full Commercial Gym',
    items: [
      'Barbell (7ft)',
      'Barbell (5ft)',
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
  const [selected, setSelected] = useState(equipment || []);

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

      <button
        onClick={() => onSave(selected)}
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
  const equipment = useStore((s) => s.equipment);
  const setEquipment = useStore((s) => s.setEquipment);
  const resetAll = useStore((s) => s.resetAll);
  const [editing, setEditing] = useState(!equipment);
  const [showResetModal, setShowResetModal] = useState(false);

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
    </div>
  );
}
