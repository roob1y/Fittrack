import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { getCurrentWeek } from '../../utils/week';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDayStatus(dateStr, completedDays, skippedDays, workoutDates, days) {
  for (const day of days) {
    for (let week = 1; week <= 52; week++) {
      const key = `week${week}_${day.id}`;
      if (completedDays?.[key] && workoutDates?.[key] === dateStr) return 'trained';
      if (skippedDays?.[key] && workoutDates?.[key] === dateStr) return 'skipped';
    }
  }
  return null;
}

function getWorkoutForDate(dateStr, completedDays, skippedDays, workoutDates, days) {
  for (const day of days) {
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

function statusColor(status, isStart) {
  if (status === 'trained') return 'var(--accent)';
  if (status === 'skipped') return 'rgba(255,77,109,0.2)';
  if (isStart) return 'rgba(200,241,53,0.08)';
  return 'var(--card)';
}

function statusDot(status, isStart) {
  if (status === 'trained') return '#0d0d0f';
  if (status === 'skipped') return 'var(--red)';
  if (isStart) return 'var(--accent)';
  return 'transparent';
}

function formatWeekLabel(startOfWeek) {
  const end = new Date(startOfWeek);
  end.setDate(startOfWeek.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return startOfWeek.toLocaleDateString('en-GB', opts) + ' — ' + end.toLocaleDateString('en-GB', opts);
}

function WelcomeScreen() {
  return (
    <div style={{ padding: '8px 0' }}>
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '36px',
          letterSpacing: '2px',
          color: 'var(--accent)',
          lineHeight: 1,
          marginBottom: '12px',
        }}
      >
        WELCOME TO
        <br />
        FITTRACK
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
        Your programme starts automatically when you complete your first workout. Head to the Workouts tab to begin.
      </p>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          fontSize: '14px',
          color: 'var(--muted)',
          lineHeight: 1.5,
        }}
      >
        💡 Complete any day to lock in your start date and begin tracking progress.
      </div>
    </div>
  );
}

function MonthGrid({
  offset,
  today,
  programmeStartDate,
  completedDays,
  skippedDays,
  workoutDates,
  selectedDate,
  onSelectDate,
  days,
  programDays,
}) {
  const now = new Date();
  const monthDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const label = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const firstDayOfWeek = monthDate.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`sp-${i}`} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
    const str = date.toISOString().slice(0, 10);
    const status = getDayStatus(str, completedDays, skippedDays, workoutDates, programDays);
    const isToday = str === today;
    const isSelected = str === selectedDate;
    const isStart = str === programmeStartDate;

    cells.push(
      <div
        key={str}
        onClick={() => onSelectDate(str)}
        style={{
          background: statusColor(status, isStart),
          border: isSelected
            ? '2px solid var(--accent2)'
            : isToday
              ? '2px solid var(--accent)'
              : isStart
                ? '1px dashed var(--accent)'
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
            background: statusDot(status, isStart),
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
            style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, padding: '4px 0' }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>{cells}</div>
    </>
  );
}

export default function CalendarView() {
  const programmeStartDate = useStore((s) => s.programmeData[s.activeProgrammeId]?.programmeStartDate ?? null);
  const setProgrammeStartDate = useStore((s) => s.setProgrammeStartDate);
  const completedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.completedDays ?? {});
  const skippedDays = useStore((s) => s.programmeData[s.activeProgrammeId]?.skippedDays ?? {});
  const workoutDates = useStore((s) => s.programmeData[s.activeProgrammeId]?.workoutDates ?? {});
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const PROGRAM = PROGRAMMES[activeProgrammeId]?.days ?? [];

  const [mode, setMode] = useState('week');
  const [offset, setOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  if (!programmeStartDate) {
    if (!programmeStartDate) return <WelcomeScreen />;
  }

  const weekNum = getCurrentWeek(programmeStartDate);
  const today = todayStr();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function renderWeekGrid() {
    const base = new Date();
    base.setDate(base.getDate() - base.getDay() + offset * 7);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      const status = getDayStatus(str, completedDays, skippedDays, workoutDates, PROGRAM);
      const isToday = str === today;
      const isSelected = str === selectedDate;
      const isStart = str === programmeStartDate;
      cells.push(
        <div
          key={str}
          onClick={() => setSelectedDate(str)}
          style={{
            background: statusColor(status, isStart),
            border: isSelected
              ? '2px solid var(--accent2)'
              : isToday
                ? '2px solid var(--accent)'
                : isStart
                  ? '1px dashed var(--accent)'
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
              background: statusDot(status, isStart),
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

  const workoutInfo = selectedDate
    ? getWorkoutForDate(selectedDate, completedDays, skippedDays, workoutDates, PROGRAM)
    : null;
  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '1px' }}>
          Week {weekNum}
        </span>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
          Started{' '}
          {new Date(programmeStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

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

      {mode === 'week' ? (
        renderWeekGrid()
      ) : (
        <MonthGrid
          key={offset}
          offset={offset}
          today={today}
          programmeStartDate={programmeStartDate}
          completedDays={completedDays}
          skippedDays={skippedDays}
          workoutDates={workoutDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          days={days}
          programDays={PROGRAM}
        />
      )}

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[
          { color: 'var(--accent)', label: 'Trained' },
          { color: 'var(--red)', label: 'Skipped' },
          { color: 'var(--accent)', border: '1px dashed var(--accent)', label: 'Programme start' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: color || 'transparent',
                border: border,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {selectedDate && (
        <div
          style={{
            marginTop: '16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{formattedDate}</div>
          {selectedDate === programmeStartDate && (
            <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginBottom: '4px' }}>
              🏁 Programme start date
            </div>
          )}
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
