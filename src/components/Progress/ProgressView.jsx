import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAM } from '../../data/program';
import { getCurrentWeek } from '../../utils/week';

function calcStreak(workoutDates) {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    const hasWorkout = Object.values(workoutDates || {}).some((date) => date === dateStr);
    if (hasWorkout) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getExerciseProgressData(dayId, ei, setData, workoutDates, days) {
  const entries = [];
  const seen = new Set();

  for (let week = 1; week <= 52; week++) {
    const key = `week${week}_${dayId}`;
    const date = workoutDates?.[key];
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
      const w = parseFloat(setData?.[setKey]?.weight);
      if (w > maxWeight) maxWeight = w;
    }
    if (maxWeight > 0) entries.push({ date, weight: maxWeight });
  }

  return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function StrengthGraph({ dayId, ei, exName }) {
  const [range, setRange] = React.useState(28);
  const [open, setOpen] = React.useState(false);
  const canvasRef = React.useRef(null);
  const setData = useStore((s) => s.setData);
  const workoutDates = useStore((s) => s.workoutDates);

  const data = getExerciseProgressData(dayId, ei, setData, workoutDates, range);

  React.useEffect(() => {
    if (!open || !canvasRef.current) return;
    drawGraph(canvasRef.current, data);
  }, [open, data, range]);

  function drawGraph(canvas, entries) {
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

    ctx.beginPath();
    entries.forEach((e, i) => (i === 0 ? ctx.moveTo(toX(i), toY(e.weight)) : ctx.lineTo(toX(i), toY(e.weight))));
    ctx.lineTo(toX(entries.length - 1), h - padding.bottom);
    ctx.lineTo(toX(0), h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,241,53,0.08)';
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#c8f135';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    entries.forEach((e, i) => (i === 0 ? ctx.moveTo(toX(i), toY(e.weight)) : ctx.lineTo(toX(i), toY(e.weight))));
    ctx.stroke();

    entries.forEach((e, i) => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(e.weight), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#c8f135';
      ctx.fill();
    });

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

  if (data.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: '10px',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{exName}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{data.length} sessions logged</div>
        </div>
        <div style={{ color: 'var(--accent)', fontSize: '20px' }}>{open ? '−' : '+'}</div>
      </div>
      {open && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: '4 weeks', val: 28 },
              { label: '8 weeks', val: 56 },
              { label: 'All time', val: 365 },
            ].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '8px',
                  border: `1px solid ${range === val ? 'var(--accent)' : 'var(--border)'}`,
                  background: range === val ? 'var(--accent)' : 'var(--card)',
                  color: range === val ? '#0d0d0f' : 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <canvas ref={canvasRef} style={{ width: '100%', height: '160px' }} />
        </div>
      )}
    </div>
  );
}

function CompletionMeter({ completed, total }) {
  const radius = 70;
  const stroke = 8;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;

  return (
    <div
      style={{
        width: '170px',
        margin: '0 auto 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <svg width="170" height="170" style={{ transform: 'rotate(-90deg)' }}>
        {Array.from({ length: total }).map((_, i) => {
          const segmentAngle = circumference / total;
          const gap = 12;
          const segmentLength = segmentAngle - gap;
          const offset = circumference - i * segmentAngle;
          const filled = i < completed;
          return (
            <circle
              key={i}
              cx="85"
              cy="85"
              r={normalised}
              fill="none"
              stroke={filled ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={stroke}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={offset}
              strokeLinecap="square"
              style={{ transition: 'stroke 0.4s ease' }}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '170px',
          height: '170px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '34px',
            color: 'var(--accent)',
            lineHeight: 1,
          }}
        >
          {completed}/{total}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            fontWeight: 600,
            marginTop: '6px',
            letterSpacing: '0.5px',
          }}
        >
          DAYS THIS WEEK
        </div>
      </div>
    </div>
  );
}

export default function ProgressView() {
  const programmeStartDate = useStore((s) => s.programmeStartDate);
  const completedDays = useStore((s) => s.completedDays);
  const skippedDays = useStore((s) => s.skippedDays);
  const sessionTimes = useStore((s) => s.sessionTimes);
  const workoutDates = useStore((s) => s.workoutDates);

  const weekNum = getCurrentWeek(programmeStartDate);
  const doneCount = Object.keys(completedDays || {}).length;
  const streak = calcStreak(workoutDates);
  const weeklyDone = PROGRAM.filter((day) => !!completedDays?.[`week${weekNum}_${day.id}`]).length;

  return (
    <div>
      <div className="section-title" style={{ marginTop: '4px' }}>
        YOUR PROGRESS
      </div>
      <CompletionMeter completed={weeklyDone} total={PROGRAM.length} />

      <div className="progress-grid">
        <div className="stat-card">
          <div className="stat-val">{doneCount}</div>
          <div className="stat-label">Workouts done</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{streak}</div>
          <div className="stat-label">Day streak</div>
        </div>
      </div>

      <div className="section-title">WEEK LOG</div>
      <div className="week-log" style={{ marginBottom: '24px' }}>
        {PROGRAM.map((day) => {
          const done = !!completedDays?.[`week${weekNum}_${day.id}`];
          const skipped = skippedDays?.[`week${weekNum}_${day.id}`];
          const sessionTime = sessionTimes?.[`week${weekNum}_${day.id}`];
          return (
            <div key={day.id} className="week-log-row">
              <div>
                <div className="wl-day">{day.label}</div>
                <div className="wl-focus">{day.focus}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {sessionTime != null && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{sessionTime} mins</div>
                )}
                <div className={`wl-badge ${done ? 'done' : skipped ? 'skipped' : 'skip'}`}>
                  {done ? '✓ Done' : skipped ? `⊘ ${skipped}` : 'Pending'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-title">STRENGTH PROGRESS</div>
      {PROGRAM.map((day) => (
        <div key={day.id} style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            {day.focus}
          </div>
          {day.exercises.map((ex, ei) => (
            <StrengthGraph key={ei} dayId={day.id} ei={ei} exName={ex.name} />
          ))}
        </div>
      ))}
    </div>
  );
}
