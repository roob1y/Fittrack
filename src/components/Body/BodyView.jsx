import React, { useRef, useEffect, useState } from 'react';
import useStore from '../../store/useStore';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function getLast30DaysEntries(weightLog) {
  const entries = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = d.toISOString().slice(0, 10);
    if (weightLog[str]) entries.push({ date: str, weight: weightLog[str] });
  }
  return entries;
}

function WeightGraph({ entries, unit }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || entries.length < 2) return;
    const canvas = canvasRef.current;
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

    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * (h - padding.top - padding.bottom);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      const val = maxW - (i / 4) * (maxW - minW);
      ctx.fillStyle = '#7a7a8c';
      ctx.font = '11px DM Sans';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(val * 10) / 10, padding.left - 4, y + 4);
    }

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

    ctx.lineTo(toX(entries.length - 1), h - padding.bottom);
    ctx.lineTo(toX(0), h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,241,53,0.08)';
    ctx.fill();

    entries.forEach((e, i) => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(convertWeight(e.weight, unit)), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#c8f135';
      ctx.fill();
    });

    ctx.fillStyle = '#7a7a8c';
    ctx.font = '11px DM Sans';
    ctx.textAlign = 'center';
    const labelIndices = [0, Math.floor(entries.length / 2), entries.length - 1];
    labelIndices.forEach((i) => {
      const date = new Date(entries[i].date);
      ctx.fillText(`${date.getDate()}/${date.getMonth() + 1}`, toX(i), h - padding.bottom + 16);
    });
  }, [entries, unit]);

  if (entries.length < 2) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
        Log at least 2 days to see your trend
      </div>
    );
  }

  return <canvas ref={canvasRef} style={{ width: '100%', height: '200px', display: 'block' }} />;
}

function BodyWeightSection() {
  const weightLog = useStore((s) => s.weightLog);
  const weightUnit = useStore((s) => s.weightUnit);
  const logWeight = useStore((s) => s.logWeight);
  const setWeightUnit = useStore((s) => s.setWeightUnit);
  const [input, setInput] = React.useState('');

  const entries = getLast30DaysEntries(weightLog);
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
      <div className="section-title">BODY WEIGHT</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['kg', 'lbs'].map((u) => (
          <button
            key={u}
            onClick={() => setWeightUnit(u)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
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
          <div
            className="stat-val"
            style={{ color: trend > 0 ? 'var(--red)' : trend < 0 ? 'var(--accent)' : 'var(--text)' }}
          >
            {trend !== null ? (trend > 0 ? '+' : '') + convertWeight(trend, weightUnit) : '—'}
          </div>
          <div className="stat-label">Change ({weightUnit})</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{entries.length}</div>
          <div className="stat-label">Days logged</div>
        </div>
      </div>

      <div className="section-title">LOG TODAY</div>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="number"
            inputMode="decimal"
            placeholder={`Enter weight in ${weightUnit}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            }}
          />
          <button
            onClick={handleLog}
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
            }}
          >
            SAVE
          </button>
        </div>
        {todayWeight && (
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
            Today: {convertWeight(todayWeight, weightUnit)}
            {weightUnit} — enter a new value to update
          </div>
        )}
      </div>

      <div className="section-title">TREND</div>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
        }}
      >
        <WeightGraph entries={entries} unit={weightUnit} />
      </div>
    </div>
  );
}

// ── Gender Selector ───────────────────────────────────────────────────────────

function GenderSelector() {
  const gender = useStore((s) => s.gender);
  const setGender = useStore((s) => s.setGender);

  return (
    <div style={{ marginBottom: '28px' }}>
      <div className="section-title">PROFILE</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {['male', 'female'].map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${gender === g ? 'var(--accent)' : 'var(--border)'}`,
              background: gender === g ? 'var(--accent)' : 'var(--card)',
              color: gender === g ? '#0d0d0f' : 'var(--muted)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Height Input ──────────────────────────────────────────────────────────────

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
      <div className="section-title">HEIGHT</div>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
        }}
      >
        {/* Unit toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {['cm', 'ft/in'].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: unit === u ? 'var(--accent)' : 'var(--card)',
                color: unit === u ? '#0d0d0f' : 'var(--muted)',
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

        {unit === 'cm' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g. 178"
              value={cm}
              onChange={(e) => setCm(e.target.value)}
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
              }}
            />
            <button
              onClick={handleSaveCm}
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
              }}
            >
              SAVE
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              inputMode="numeric"
              placeholder="ft"
              value={ft}
              onChange={(e) => setFt(e.target.value)}
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
              }}
            />
            <span style={{ color: 'var(--muted)', fontSize: '14px' }}>ft</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="in"
              value={inches}
              onChange={(e) => setInches(e.target.value)}
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
              }}
            />
            <span style={{ color: 'var(--muted)', fontSize: '14px' }}>in</span>
            <button
              onClick={handleSaveFtIn}
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
              }}
            >
              SAVE
            </button>
          </div>
        )}

        {heightCm && (
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
            Saved: {heightCm}cm
            {displayFtIn ? ` · ${displayFtIn.ft}ft ${displayFtIn.inches}in` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function BodyView() {
  return (
    <div>
      <GenderSelector />
      <HeightInput />
      <BodyWeightSection />
    </div>
  );
}
