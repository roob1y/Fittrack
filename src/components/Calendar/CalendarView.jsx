import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAM } from '../../data/program';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDayStatus(dateStr, completedDays, skippedDays, workoutDates) {
  for (const day of PROGRAM) {
    for (let week = 1; week <= 52; week++) {
      const key = `week${week}_${day.id}`;
      if (completedDays?.[key] && workoutDates?.[key] === dateStr) return 'trained';
      if (skippedDays?.[key] && workoutDates?.[key] === dateStr) return 'skipped';
    }
  }
  return null;
}

function getWorkoutForDate(dateStr, completedDays, skippedDays, workoutDates) {
  for (const day of PROGRAM) {
    for (let week = 1; week <= 52; week++) {
      const key = `week${week}_${day.id}`;
      if (workoutDates?.[key] === dateStr) {
        const status = completedDays?.[key]
          ? '✓ Completed'
          : skippedDays?.[key]
            ? '⊘ Skipped — ' + skippedDays[key]
            : null;
        if (status) return { focus: day.focus, status };
      }
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

function formatWeekLabel(startOfWeek) {
  const end = new Date(startOfWeek);
  end.setDate(startOfWeek.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return startOfWeek.toLocaleDateString('en-GB', opts) + ' — ' + end.toLocaleDateString('en-GB', opts);
}

function StartDatePicker({ onConfirm }) {
  const [value, setValue] = useState(todayStr());
  return (
    <div>
      <div className="section-title" style={{ marginTop: '4px' }}>
        WHEN DO YOU START?
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
        Pick the date you want to begin your programme. This is used to map your workouts to real calendar dates.
      </p>
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: '100%',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '16px',
          padding: '14px',
          marginBottom: '16px',
        }}
      />
      <button
        onClick={() => onConfirm(value)}
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
        }}
      >
        LET'S GO
      </button>
    </div>
  );
}

export default function CalendarView() {
  const programmeStartDate = useStore((s) => s.programmeStartDate);
  const setProgrammeStartDate = useStore((s) => s.setProgrammeStartDate);
  const completedDays = useStore((s) => s.completedDays);
  const skippedDays = useStore((s) => s.skippedDays);
  const workoutDates = useStore((s) => s.workoutDates);

  const [mode, setMode] = useState('week');
  const [offset, setOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  if (!programmeStartDate) {
    return <StartDatePicker onConfirm={setProgrammeStartDate} />;
  }

  const today = todayStr();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function handleSelectDate(dateStr) {
    setSelectedDate(dateStr);
  }

  function renderWeekGrid() {
    const base = new Date();
    base.setDate(base.getDate() - base.getDay() + offset * 7);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      const status = getDayStatus(str, completedDays, skippedDays, workoutDates);
      const isToday = str === today;
      const isSelected = str === selectedDate;
      cells.push(
        <div
          key={str}
          className="cal-cell"
          data-date={str}
          onClick={() => handleSelectDate(str)}
          style={{
            background: statusColor(status),
            border: isSelected
              ? '2px solid var(--accent2)'
              : isToday
                ? '2px solid var(--accent)'
                : '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 4px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '11px', color: status ? '#0d0d0f' : 'var(--muted)', fontWeight: 600 }}>
            {days[d.getDay()]}
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '22px',
              color: status ? '#0d0d0f' : 'var(--text)',
            }}
          >
            {d.getDate()}
          </div>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: statusDot(status),
              margin: '4px auto 0',
            }}
          />
        </div>,
      );
    }
    return (
      <>
        <div style={{ fontWeight: 600, fontSize: '15px', textAlign: 'center', marginBottom: '12px' }}>
          {formatWeekLabel(base)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>{cells}</div>
      </>
    );
  }

  function renderMonthGrid() {
    const today = new Date();
    const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const label = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const firstDay = month.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d);
      const str = date.toISOString().slice(0, 10);
      const status = getDayStatus(str, completedDays, skippedDays, workoutDates);
      const isToday = str === todayStr();
      const isSelected = str === selectedDate;
      cells.push(
        <div
          key={str}
          className="cal-cell"
          data-date={str}
          onClick={() => handleSelectDate(str)}
          style={{
            background: statusColor(status),
            border: isSelected
              ? '2px solid var(--accent2)'
              : isToday
                ? '2px solid var(--accent)'
                : '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 2px',
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: '44px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: status ? '#0d0d0f' : 'var(--text)', fontWeight: 500 }}>{d}</div>
          <div
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: statusDot(status),
              marginTop: '3px',
            }}
          />
        </div>,
      );
    }

    return (
      <>
        <div style={{ fontWeight: 600, fontSize: '15px', textAlign: 'center', marginBottom: '12px' }}>{label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {days.map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--muted)',
                fontWeight: 600,
                padding: '4px 0',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>{cells}</div>
      </>
    );
  }

  const workoutInfo = selectedDate ? getWorkoutForDate(selectedDate, completedDays, skippedDays, workoutDates) : null;
  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  const weekNum = useStore((s) => s.weekNum);
  const saveWeekNum = useStore((s) => s.saveWeekNum);

  function changeWeek(direction) {
    saveWeekNum(Math.max(1, weekNum + direction));
  }

  return (
    <div>
      {/* Week number controls */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}
      >
        <button
          onClick={() => changeWeek(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '24px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ‹
        </button>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '1px' }}>
          Week {weekNum}
        </span>
        <button
          onClick={() => changeWeek(1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '24px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ›
        </button>
      </div>

      {/* Week / Month toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          CALENDAR
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['week', 'month'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setOffset(0);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: mode === m ? 'var(--accent)' : 'var(--card)',
                color: mode === m ? '#0d0d0f' : 'var(--muted)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => setOffset((o) => o - 1)}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--accent)',
            fontSize: '20px',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          ‹
        </button>
        <button
          onClick={() => setOffset((o) => o + 1)}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--accent)',
            fontSize: '20px',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          ›
        </button>
      </div>

      {mode === 'week' ? renderWeekGrid() : renderMonthGrid()}

      {selectedDate && (
        <div
          style={{
            marginTop: '20px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{formattedDate}</div>
          {workoutInfo ? (
            <>
              <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{workoutInfo.focus}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{workoutInfo.status}</div>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>No workout logged</div>
          )}
        </div>
      )}
    </div>
  );
}
