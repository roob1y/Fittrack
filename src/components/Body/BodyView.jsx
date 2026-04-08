import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const TRANSITION = { type: 'tween', ease: 'easeInOut', duration: 0.28 };

const MEASUREMENTS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms (bicep)' },
  { key: 'neck', label: 'Neck' },
  { key: 'legs', label: 'Legs (thigh)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function cmToIn(cm) {
  return Math.round(cm * 0.3937 * 10) / 10;
}

function inToCm(inches) {
  return Math.round(inches * 2.54 * 10) / 10;
}

function cmToFtIn(cm) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return { ft, inches };
}

function ftInToCm(ft, inches) {
  return Math.round((ft * 30.48 + inches * 2.54) * 10) / 10;
}

function convertWeight(kg, unit) {
  if (unit === 'lbs') return Math.round(kg * 2.2046 * 10) / 10;
  return Math.round(kg * 10) / 10;
}

function convertMeasurement(cm, unit) {
  if (unit === 'in') return Math.round(cmToIn(cm) * 10) / 10;
  return Math.round(cm * 10) / 10;
}

function getLast30DaysWeight(weightLog) {
  const entries = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = d.toISOString().slice(0, 10);
    if (weightLog[str]) entries.push({ date: str, weight: weightLog[str] });
  }
  return entries;
}

function getLast30DaysMeasurements(measurementLog, field) {
  const entries = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = d.toISOString().slice(0, 10);
    if (measurementLog[str]?.[field] != null) {
      entries.push({ date: str, value: measurementLog[str][field] });
    }
  }
  return entries;
}

function calcNavyBodyFat(gender, heightCm, measurementLog) {
  const dates = Object.keys(measurementLog).sort();
  if (!dates.length || !heightCm) return null;
  const latest = measurementLog[dates[dates.length - 1]];
  const { waist, neck, hips } = latest;
  if (!waist || !neck) return null;
  if (gender === 'female' && !hips) return null;

  if (gender === 'male') {
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
    return Math.round(bf * 10) / 10;
  } else {
    const bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.221 * Math.log10(heightCm)) - 450;
    return Math.round(bf * 10) / 10;
  }
}

function getTrendColour(entries, goal) {
  if (!goal || entries.length < 2) return 'var(--text)';
  const latest = entries[entries.length - 1].value;
  const prev = entries[entries.length - 2].value;
  const change = latest - prev;
  const towardGoal = (goal > latest && change > 0) || (goal < latest && change < 0);
  const stalled = Math.abs(change) < 0.5;
  if (stalled) return '#f5a623';
  return towardGoal ? 'var(--accent)' : 'var(--red)';
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: `1px solid ${value === o ? 'var(--accent)' : 'var(--border)'}`,
            background: value === o ? 'var(--accent)' : 'var(--card)',
            color: value === o ? '#0d0d0f' : 'var(--muted)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children, style }) {
  return (
    <div className="section-title" style={style}>
      {children}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SaveButton({ onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '12px 20px',
        background: 'var(--accent)',
        border: 'none',
        borderRadius: '8px',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '18px',
        letterSpacing: '1px',
        color: '#0d0d0f',
        cursor: 'pointer',
        ...style,
      }}
    >
      SAVE
    </button>
  );
}

function NumberInput({ placeholder, value, onChange, style }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '16px',
        padding: '12px',
        textAlign: 'center',
        ...style,
      }}
    />
  );
}

// ── Canvas Graph ──────────────────────────────────────────────────────────────

function LineGraph({ entries, valueKey = 'value', height = 200, goalValue = null }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || entries.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = canvas.offsetWidth;
    const h = height;
    const pad = { top: 20, right: 20, bottom: 30, left: 40 };
    const values = entries.map((e) => e[valueKey]);
    const allValues = goalValue != null ? [...values, goalValue] : values;
    const minV = Math.min(...allValues) - 1;
    const maxV = Math.max(...allValues) + 1;
    const toX = (i) => pad.left + (i / (entries.length - 1)) * (w - pad.left - pad.right);
    const toY = (v) => pad.top + (1 - (v - minV) / (maxV - minV)) * (h - pad.top - pad.bottom);

    // Grid
    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (h - pad.top - pad.bottom);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      const val = maxV - (i / 4) * (maxV - minV);
      ctx.fillStyle = '#7a7a8c';
      ctx.font = '11px DM Sans';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(val * 10) / 10, pad.left - 4, y + 4);
    }

    // Goal line
    if (goalValue != null) {
      const gy = toY(goalValue);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 1.5;
      ctx.moveTo(pad.left, gy);
      ctx.lineTo(w - pad.right, gy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f5a623';
      ctx.font = '10px DM Sans';
      ctx.textAlign = 'left';
      ctx.fillText('Goal', pad.left + 4, gy - 4);
    }

    // Fill
    ctx.beginPath();
    entries.forEach((e, i) => (i === 0 ? ctx.moveTo(toX(i), toY(e[valueKey])) : ctx.lineTo(toX(i), toY(e[valueKey]))));
    ctx.lineTo(toX(entries.length - 1), h - pad.bottom);
    ctx.lineTo(toX(0), h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,241,53,0.08)';
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#c8f135';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    entries.forEach((e, i) => (i === 0 ? ctx.moveTo(toX(i), toY(e[valueKey])) : ctx.lineTo(toX(i), toY(e[valueKey]))));
    ctx.stroke();

    // Dots
    entries.forEach((e, i) => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(e[valueKey]), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#c8f135';
      ctx.fill();
    });

    // X labels
    ctx.fillStyle = '#7a7a8c';
    ctx.font = '11px DM Sans';
    ctx.textAlign = 'center';
    const labelIdx =
      entries.length <= 3 ? entries.map((_, i) => i) : [0, Math.floor(entries.length / 2), entries.length - 1];
    labelIdx.forEach((i) => {
      const date = new Date(entries[i].date);
      ctx.fillText(`${date.getDate()}/${date.getMonth() + 1}`, toX(i), h - pad.bottom + 16);
    });
  }, [entries, valueKey, height, goalValue]);

  if (entries.length < 2) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
        Log at least 2 days to see your trend
      </div>
    );
  }

  return <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} />;
}

function Sparkline({ entries }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || entries.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 32 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = canvas.offsetWidth;
    const h = 32;
    const values = entries.map((e) => e.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const toX = (i) => (i / (entries.length - 1)) * w;
    const toY = (v) => h - 4 - ((v - min) / range) * (h - 8);

    ctx.beginPath();
    ctx.strokeStyle = '#c8f135';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    entries.forEach((e, i) => (i === 0 ? ctx.moveTo(toX(i), toY(e.value)) : ctx.lineTo(toX(i), toY(e.value))));
    ctx.stroke();
  }, [entries]);

  if (entries.length < 2) return <div style={{ width: '60px' }} />;
  return <canvas ref={canvasRef} style={{ width: '60px', height: '32px', display: 'block' }} />;
}

// ── Sections ──────────────────────────────────────────────────────────────────

function GenderSelector() {
  const gender = useStore((s) => s.gender);
  const setGender = useStore((s) => s.setGender);
  return (
    <div style={{ marginBottom: '28px' }}>
      <SectionTitle>PROFILE</SectionTitle>
      <Toggle options={['male', 'female']} value={gender} onChange={setGender} />
    </div>
  );
}

function HeightInput() {
  const heightCm = useStore((s) => s.heightCm);
  const setHeight = useStore((s) => s.setHeight);
  const [unit, setUnit] = useState('cm');
  const [cm, setCm] = useState(heightCm ? String(heightCm) : '');
  const [ft, setFt] = useState('');
  const [inches, setInches] = useState('');

  function handleSaveCm() {
    const val = parseFloat(cm);
    if (!val || val <= 0) return;
    setHeight(val);
  }

  function handleSaveFtIn() {
    const f = parseInt(ft) || 0;
    const i = parseInt(inches) || 0;
    if (!f && !i) return;
    setHeight(ftInToCm(f, i));
  }

  const displayFtIn = heightCm ? cmToFtIn(heightCm) : null;

  return (
    <div style={{ marginBottom: '28px' }}>
      <SectionTitle>HEIGHT</SectionTitle>
      <Card style={{ padding: '16px' }}>
        <Toggle options={['cm', 'ft/in']} value={unit} onChange={setUnit} />
        {unit === 'cm' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <NumberInput placeholder="e.g. 178" value={cm} onChange={setCm} />
            <SaveButton onClick={handleSaveCm} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <NumberInput placeholder="ft" value={ft} onChange={setFt} style={{ fontSize: '15px', padding: '10px' }} />
            <span style={{ color: 'var(--muted)', fontSize: '14px' }}>ft</span>
            <NumberInput
              placeholder="in"
              value={inches}
              onChange={setInches}
              style={{ fontSize: '15px', padding: '10px' }}
            />
            <span style={{ color: 'var(--muted)', fontSize: '14px' }}>in</span>
            <SaveButton onClick={handleSaveFtIn} />
          </div>
        )}
        {heightCm && (
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
            Saved: {heightCm}cm{displayFtIn ? ` · ${displayFtIn.ft}ft ${displayFtIn.inches}in` : ''}
          </div>
        )}
      </Card>
    </div>
  );
}

function BodyWeightSection() {
  const weightLog = useStore((s) => s.weightLog);
  const weightUnit = useStore((s) => s.weightUnit);
  const logWeight = useStore((s) => s.logWeight);
  const setWeightUnit = useStore((s) => s.setWeightUnit);
  const [input, setInput] = useState('');

  const entries = getLast30DaysWeight(weightLog);
  const today = todayStr();
  const todayWeight = weightLog[today];
  const current = entries.length ? entries[entries.length - 1].weight : null;
  const start = entries.length ? entries[0].weight : null;
  const trend = current && start ? current - start : null;

  function handleLog() {
    const val = parseFloat(input);
    if (!val || val <= 0) return;
    const inKg = weightUnit === 'lbs' ? val / 2.2046 : val;
    logWeight(today, Math.round(inKg * 10) / 10);
    setInput('');
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <SectionTitle>BODY WEIGHT</SectionTitle>
      <Toggle options={['kg', 'lbs']} value={weightUnit} onChange={setWeightUnit} />

      <div className="progress-grid" style={{ marginBottom: '16px' }}>
        <div className="stat-card">
          <div className="stat-val">{current ? convertWeight(current, weightUnit) : '—'}</div>
          <div className="stat-label">Current ({weightUnit})</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{start ? convertWeight(start, weightUnit) : '—'}</div>
          <div className="stat-label">Starting ({weightUnit})</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">
            {trend !== null ? (trend > 0 ? '+' : '') + convertWeight(trend, weightUnit) : '—'}
          </div>
          <div className="stat-label">Change ({weightUnit})</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{entries.length}</div>
          <div className="stat-label">Days logged</div>
        </div>
      </div>

      <SectionTitle>LOG TODAY</SectionTitle>
      <Card style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <NumberInput placeholder={`Enter weight in ${weightUnit}`} value={input} onChange={setInput} />
          <SaveButton onClick={handleLog} />
        </div>
        {todayWeight && (
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
            Today: {convertWeight(todayWeight, weightUnit)}
            {weightUnit} — enter a new value to update
          </div>
        )}
      </Card>

      <SectionTitle>TREND</SectionTitle>
      <Card style={{ padding: '16px' }}>
        <LineGraph
          entries={entries.map((e) => ({ ...e, value: convertWeight(e.weight, weightUnit) }))}
          valueKey="value"
        />
      </Card>
    </div>
  );
}

function MeasurementGraphScreen({ measurement, onBack }) {
  const measurementLog = useStore((s) => s.measurementLog);
  const measurementUnit = useStore((s) => s.measurementUnit);
  const measurementGoals = useStore((s) => s.measurementGoals);

  const entries = getLast30DaysMeasurements(measurementLog, measurement.key);
  const converted = entries.map((e) => ({ ...e, value: convertMeasurement(e.value, measurementUnit) }));
  const goalRaw = measurementGoals?.[measurement.key];
  const goal = goalRaw ? convertMeasurement(goalRaw, measurementUnit) : null;

  const latest = converted.length ? converted[converted.length - 1].value : null;
  const first = converted.length ? converted[0].value : null;
  const trend = latest != null && first != null ? latest - first : null;
  const trendColour = getTrendColour(converted, goal);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      style={{ position: 'relative' }}
    >
      <button className="back-btn" onClick={onBack}>
        ← BACK
      </button>

      <SectionTitle style={{ marginTop: '8px' }}>{measurement.label.toUpperCase()}</SectionTitle>

      <div className="progress-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-val">{latest ?? '—'}</div>
          <div className="stat-label">Current ({measurementUnit})</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{goal ?? '—'}</div>
          <div className="stat-label">Goal ({measurementUnit})</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: trendColour }}>
            {trend !== null ? (trend > 0 ? '+' : '') + Math.round(trend * 10) / 10 : '—'}
          </div>
          <div className="stat-label">Change ({measurementUnit})</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{entries.length}</div>
          <div className="stat-label">Days logged</div>
        </div>
      </div>

      <SectionTitle>TREND</SectionTitle>
      <Card style={{ padding: '16px', marginBottom: '20px' }}>
        <LineGraph entries={converted} valueKey="value" goalValue={goal} />
      </Card>
    </motion.div>
  );
}

function MeasurementsSection({ onSelectMeasurement }) {
  const measurementLog = useStore((s) => s.measurementLog);
  const measurementUnit = useStore((s) => s.measurementUnit);
  const setMeasurementUnit = useStore((s) => s.setMeasurementUnit);
  const logMeasurement = useStore((s) => s.logMeasurement);
  const measurementGoals = useStore((s) => s.measurementGoals);
  const setMeasurementGoal = useStore((s) => s.setMeasurementGoal);
  const [inputs, setInputs] = useState({});
  const [goalInputs, setGoalInputs] = useState({});
  const [goalOpen, setGoalOpen] = useState({});
  const today = todayStr();

  function handleSave(key) {
    const val = parseFloat(inputs[key]);
    if (!val || val <= 0) return;
    const inCm = measurementUnit === 'in' ? inToCm(val) : val;
    logMeasurement(today, key, Math.round(inCm * 10) / 10);
    setInputs((prev) => ({ ...prev, [key]: '' }));
  }

  function handleSaveGoal(key) {
    const val = parseFloat(goalInputs[key]);
    if (!val || val <= 0) return;
    const inCm = measurementUnit === 'in' ? inToCm(val) : val;
    setMeasurementGoal(key, Math.round(inCm * 10) / 10);
    setGoalInputs((prev) => ({ ...prev, [key]: '' }));
    setGoalOpen((prev) => ({ ...prev, [key]: false }));
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <SectionTitle>MEASUREMENTS</SectionTitle>
      <Toggle options={['cm', 'in']} value={measurementUnit} onChange={setMeasurementUnit} />

      <Card style={{ overflow: 'hidden' }}>
        {MEASUREMENTS.map((m, i) => {
          const entries = getLast30DaysMeasurements(measurementLog, m.key);
          const latest = entries.length ? convertMeasurement(entries[entries.length - 1].value, measurementUnit) : null;
          const todayVal = measurementLog[today]?.[m.key];
          const goalRaw = measurementGoals?.[m.key];
          const goal = goalRaw ? convertMeasurement(goalRaw, measurementUnit) : null;
          const trendColour = getTrendColour(
            entries.map((e) => ({ ...e, value: convertMeasurement(e.value, measurementUnit) })),
            goal,
          );
          const isGoalOpen = goalOpen[m.key];

          return (
            <div
              key={m.key}
              style={{
                borderBottom: i < MEASUREMENTS.length - 1 ? '1px solid var(--border)' : 'none',
                padding: '14px 16px',
              }}
            >
              {/* Header row — tap to open graph */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', cursor: 'pointer' }}
                onClick={() => onSelectMeasurement(m)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.label}</div>
                  <div style={{ fontSize: '12px', color: latest ? trendColour : 'var(--muted)', marginTop: '2px' }}>
                    {latest ? `${latest} ${measurementUnit}` : 'No data yet'}
                    {goal ? ` · Goal: ${goal} ${measurementUnit}` : ''}
                  </div>
                </div>
                <Sparkline
                  entries={entries.map((e) => ({ ...e, value: convertMeasurement(e.value, measurementUnit) }))}
                />
                <div style={{ color: 'var(--muted)', fontSize: '18px', marginLeft: '4px' }}>›</div>
              </div>

              {/* Log input */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <NumberInput
                  placeholder={`${m.label} in ${measurementUnit}`}
                  value={inputs[m.key] || ''}
                  onChange={(v) => setInputs((prev) => ({ ...prev, [m.key]: v }))}
                  style={{ fontSize: '15px', padding: '10px 12px' }}
                />
                <button
                  onClick={() => handleSave(m.key)}
                  style={{
                    flexShrink: 0,
                    padding: '10px 16px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '16px',
                    letterSpacing: '1px',
                    color: '#0d0d0f',
                    cursor: 'pointer',
                  }}
                >
                  SAVE
                </button>
              </div>

              {todayVal && (
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', textAlign: 'center' }}>
                  Today: {convertMeasurement(todayVal, measurementUnit)}
                  {measurementUnit} — enter a new value to update
                </div>
              )}

              {/* Goal toggle */}
              <button
                onClick={() => setGoalOpen((prev) => ({ ...prev, [m.key]: !prev[m.key] }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {isGoalOpen ? '▲ Hide goal' : `▼ ${goal ? `Edit goal (${goal} ${measurementUnit})` : 'Set goal'}`}
              </button>

              {isGoalOpen && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <NumberInput
                    placeholder={`Goal in ${measurementUnit}`}
                    value={goalInputs[m.key] || ''}
                    onChange={(v) => setGoalInputs((prev) => ({ ...prev, [m.key]: v }))}
                    style={{ fontSize: '15px', padding: '10px 12px' }}
                  />
                  <button
                    onClick={() => handleSaveGoal(m.key)}
                    style={{
                      flexShrink: 0,
                      padding: '10px 16px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '16px',
                      letterSpacing: '1px',
                      color: '#0d0d0f',
                      cursor: 'pointer',
                    }}
                  >
                    SET
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function BodyFatSection() {
  const measurementLog = useStore((s) => s.measurementLog);
  const heightCm = useStore((s) => s.heightCm);
  const gender = useStore((s) => s.gender);

  const current = calcNavyBodyFat(gender, heightCm, measurementLog);

  const missing = !heightCm
    ? 'Add your height above to calculate body fat'
    : gender === 'female' && !Object.values(measurementLog).slice(-1)[0]?.hips
      ? 'Log hips, waist and neck measurements to calculate'
      : !Object.values(measurementLog).slice(-1)[0]?.waist || !Object.values(measurementLog).slice(-1)[0]?.neck
        ? 'Log waist and neck measurements to calculate'
        : null;

  return (
    <div style={{ marginBottom: '28px' }}>
      <SectionTitle>BODY FAT %</SectionTitle>
      <Card style={{ padding: '16px' }}>
        {missing ? (
          <div style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
            {missing}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '56px',
                color: 'var(--accent)',
                lineHeight: 1,
              }}
            >
              {current}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Estimated via Navy method</div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function BodyView() {
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const scrollPos = useRef(0);
  const isFirstMount = useRef(true);

  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence>
        {!selectedMeasurement && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: isFirstMount.current ? 0 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={TRANSITION}
          >
            <GenderSelector />
            <HeightInput />
            <BodyWeightSection />
            <MeasurementsSection
              onSelectMeasurement={(m) => {
                scrollPos.current = document.body.scrollTop;
                setSelectedMeasurement(m);
                // Delay scroll until after exit animation finishes
                setTimeout(() => {
                  document.body.scrollTo({ top: 0 });
                }, TRANSITION.duration * 1000);
              }}
            />
            <BodyFatSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph screen */}
      <AnimatePresence>
        {selectedMeasurement && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={TRANSITION}
            style={{
              position: 'relative',
              minHeight: '100vh',
            }}
          >
            <MeasurementGraphScreen
              measurement={selectedMeasurement}
              onBack={() => {
                setSelectedMeasurement(null);
                requestAnimationFrame(() => {
                  document.body.scrollTo({ top: scrollPos.current });
                });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
