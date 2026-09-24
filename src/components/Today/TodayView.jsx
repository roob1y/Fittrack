import React, { useEffect, useMemo } from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { EMPTY } from '../../store/shape';
import { dayKey, setKey } from '../../utils/setKeys';
import { activeExercises } from '../../utils/slots';
import { sessionTonnage } from '../../utils/sessionStats';
import { workoutSummary } from '../../utils/progressStats';
import { getDailyQuote } from '../../data/quotes';
import { WARMUPS } from '../../data/warmups';
import Icon from '../ui/Icon';

// Today — what to do now, and what changed since last time.
//
// Replaces WeekOverview. The old screen led with a quote and listed three
// identical day cards; this one leads with the NEXT session and the loading
// verdicts for it, because those are the two things worth reading before a
// workout. The cycle strip and the cycle stepper keep the old navigation.

const todayStr = () => new Date().toISOString().slice(0, 10);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(str, opts) {
  if (!str) return '';
  const dt = new Date(str + 'T00:00:00');
  if (opts) return dt.toLocaleDateString('en-GB', opts);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

function fmtTonnage(kg) {
  if (!(kg > 0)) return null;
  return kg >= 10000 ? `${(kg / 1000).toFixed(1)} t` : `${kg.toLocaleString('en-GB')} kg`;
}

export default function TodayView({ onSelectDay }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const completedDays = slice?.completedDays ?? EMPTY;
  const skippedDays = slice?.skippedDays ?? EMPTY;
  const setData = slice?.setData ?? EMPTY;
  const slotChoices = slice?.slotChoices ?? EMPTY;
  const workoutDates = slice?.workoutDates ?? EMPTY;
  const sessionTimes = slice?.sessionTimes ?? EMPTY;
  const currentWeek = useStore((s) => s.currentWeek);
  const setCurrentWeek = useStore((s) => s.setCurrentWeek);
  const equipment = useStore((s) => s.equipment);
  const quoteTone = useStore((s) => s.quoteTone);

  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const weekNum = currentWeek;

  // Highest cycle with anything logged, and jump there on first open.
  const maxActiveWeek = useMemo(() => {
    let max = 1;
    const scan = (obj) => {
      for (const key of Object.keys(obj)) {
        const m = key.match(/^week(\d+)_/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      }
    };
    scan(setData);
    scan(completedDays);
    return max;
  }, [setData, completedDays]);
  useEffect(() => {
    if (currentWeek < maxActiveWeek) setCurrentWeek(maxActiveWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = todayStr();
  const dates = Object.values(workoutDates || {});
  const trainedToday = dates.some((d) => d === today);
  const lastDate = dates.filter(Boolean).sort().pop() ?? null;
  const daysSince = lastDate
    ? Math.round((new Date(today + 'T00:00:00') - new Date(lastDate + 'T00:00:00')) / 86400000)
    : null;

  const nextDay = trainedToday
    ? null
    : days.find((d) => {
        const k = dayKey(weekNum, d.id);
        return !completedDays[k] && !skippedDays?.[k];
      });
  const cycleDone = !nextDay && !trainedToday;

  function estimateDuration(day) {
    let minutes = 0;
    activeExercises(day, { weekNum, dayId: day.id, setData, slotChoices, equipment }).forEach((ex) => {
      const rest = ex.restSeconds > 0 ? ex.restSeconds / 60 : ex.compound ? 3 : 1.25;
      const setTime = 0.75;
      minutes += ex.sets * (ex.superset ? setTime * 2 + rest : setTime + rest) + 1.5;
    });
    return Math.round(minutes);
  }

  function dayProgress(day) {
    let total = 0;
    let done = 0;
    activeExercises(day, { weekNum, dayId: day.id, setData, slotChoices, equipment }).forEach((ex) => {
      for (let s = 0; s < ex.sets; s++) {
        total++;
        if (setData[setKey(weekNum, day.id, ex, s)]?.done) done++;
      }
    });
    return total ? Math.round((done / total) * 100) : 0;
  }

  // The most recent completed run of a day, in any cycle.
  function lastSession(day) {
    for (let w = maxActiveWeek; w >= 1; w--) {
      const k = dayKey(w, day.id);
      const date = workoutDates[k];
      if (!date || !completedDays[k]) continue;
      const mins = sessionTimes[k];
      const { tonnage } = sessionTonnage(day, setData, w);
      return { date, mins, tonnage };
    }
    return null;
  }

  // Loading verdicts for the next day: what to add, what to hold, what's capped.
  const verdicts = useMemo(() => {
    if (!nextDay) return [];
    const summary = workoutSummary(days, slice, nextDay.id);
    if (!summary) return [];
    const rows = summary.rows.map((r) => {
      const t = r.target;
      if (t?.verdict === 'add') {
        return {
          kind: 'up',
          name: r.name,
          from: t.load,
          to: t.nextLoad,
          detail: `${t.done} of ${t.max} reps at ${t.load} kg`,
        };
      }
      if (t?.verdict === 'ceiling') {
        return {
          kind: 'ceiling',
          name: r.name,
          from: t.load,
          to: null,
          detail: `Full house at ${t.load} kg — the heaviest you can use here`,
        };
      }
      if (r.stalled) {
        return {
          kind: 'hold',
          name: r.name,
          from: t?.load ?? r.reps?.load ?? null,
          to: null,
          detail: 'Same numbers three sessions running',
        };
      }
      return null;
    });
    const order = { up: 0, ceiling: 1, hold: 2 };
    return rows.filter(Boolean).sort((a, b) => order[a.kind] - order[b.kind]);
  }, [days, slice, nextDay]);

  const quote = getDailyQuote(quoteTone);
  const nextLast = nextDay ? lastSession(nextDay) : null;
  const nextExercises = nextDay
    ? activeExercises(nextDay, { weekNum, dayId: nextDay.id, setData, slotChoices, equipment })
    : [];

  return (
    <div className="stack stack-16">
      <div className="meta-2" style={{ color: 'var(--muted)', fontWeight: 500 }}>
        {fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} · Cycle {weekNum}
        {daysSince != null &&
          daysSince > 0 &&
          ` · ${daysSince} day${daysSince === 1 ? '' : 's'} since your last session`}
        {trainedToday && ' · trained today'}
      </div>

      {/* Hero: the next session */}
      {nextDay ? (
        <div className="card card-lg stack stack-12" style={{ padding: '22px 20px 20px' }}>
          <div className="row-between">
            <span className="eyebrow accent">Next up</span>
            <span className="meta">
              {nextDay.label} of {days.length}
            </span>
          </div>
          <div className="display display-xl">{nextDay.focus}</div>
          <div className="meta-2">{describeMuscles(nextExercises)}</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="pill">{nextExercises.length} exercises</span>
            <span className="pill">~{estimateDuration(nextDay)} min</span>
            {(WARMUPS[nextDay.id]?.length ?? 0) > 0 && (
              <span className="pill">{WARMUPS[nextDay.id].length}-step warm-up</span>
            )}
          </div>
          {nextLast && (
            <div className="row-baseline" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <span className="meta">Last time · {fmtDate(nextLast.date)}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {nextLast.mins != null && `${nextLast.mins} min`}
                {nextLast.mins != null && nextLast.tonnage > 0 && ' · '}
                {fmtTonnage(nextLast.tonnage)}
              </span>
            </div>
          )}
          <button className="btn btn-primary xl btn-block" onClick={() => onSelectDay(nextDay.id)}>
            {dayProgress(nextDay) > 0 ? `Continue ${nextDay.focus}` : `Start ${nextDay.focus}`}
            <Icon name="arrowRight" size={20} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="card card-lg stack stack-8" style={{ padding: '22px 20px' }}>
          <span className="eyebrow accent">{trainedToday ? 'Done for today' : 'Cycle complete'}</span>
          <div className="display display-lg">{trainedToday ? 'Rest up' : `Cycle ${weekNum} done`}</div>
          <div className="meta-2">
            {trainedToday
              ? 'Session logged. Tomorrow’s day will be up here in the morning.'
              : 'Every day in this cycle is logged or skipped. Step to the next cycle to keep going.'}
          </div>
          {cycleDone && (
            <button className="btn btn-primary btn-block" onClick={() => setCurrentWeek(weekNum + 1)}>
              Start cycle {weekNum + 1}
              <Icon name="arrowRight" size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* This cycle */}
      <div>
        <div className="section-head">
          <span className="h-section">This cycle</span>
          <span className="row" style={{ gap: 6 }}>
            <button
              className="icon-btn"
              style={{ width: 32, height: 32, borderRadius: 8 }}
              onClick={() => setCurrentWeek(weekNum - 1)}
              disabled={weekNum <= 1}
              aria-label="Previous cycle"
            >
              <Icon name="chevronLeft" size={16} />
            </button>
            <span className="meta" style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
              {weekNum}
            </span>
            <button
              className="icon-btn"
              style={{ width: 32, height: 32, borderRadius: 8 }}
              onClick={() => setCurrentWeek(weekNum + 1)}
              disabled={weekNum > maxActiveWeek}
              aria-label="Next cycle"
            >
              <Icon name="chevronRight" size={16} />
            </button>
          </span>
        </div>
        <div className="grid-3">
          {days.map((day) => {
            const k = dayKey(weekNum, day.id);
            const done = !!completedDays[k];
            const skipped = !!skippedDays?.[k];
            const isNext = nextDay?.id === day.id;
            const progress = done ? 100 : dayProgress(day);
            return (
              <button
                key={day.id}
                className={`tile stack stack-8${isNext ? ' active' : ''}`}
                onClick={() => onSelectDay(day.id)}
                style={{ textAlign: 'left', minHeight: 84 }}
              >
                <span className="row-between">
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{day.focus}</span>
                  <span
                    className={`check-dot${done ? ' done' : ''}`}
                    style={skipped ? { borderColor: 'var(--down)' } : undefined}
                  >
                    {done && <Icon name="check" size={12} strokeWidth={3.5} />}
                    {skipped && <Icon name="x" size={10} strokeWidth={3} style={{ color: 'var(--down)' }} />}
                  </span>
                </span>
                <span className="meta" style={isNext ? { color: 'var(--accent)', fontWeight: 600 } : undefined}>
                  {done
                    ? `${fmtDate(workoutDates[k])}${sessionTimes[k] != null ? ` · ${sessionTimes[k]} min` : ''}`
                    : skipped
                      ? 'Skipped'
                      : isNext
                        ? 'Up next'
                        : progress > 0
                          ? `${progress}% logged`
                          : 'Not yet'}
                </span>
                <span className="bar">
                  <i style={{ width: `${progress}%`, background: skipped ? 'var(--down)' : undefined }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verdicts for the next day */}
      {verdicts.length > 0 && (
        <div>
          <div className="section-head">
            <span className="h-section">Due a change</span>
            <span className="link">for {nextDay.focus} today</span>
          </div>
          <div className="list">
            {verdicts.slice(0, 5).map((v) => (
              <div className="list-row" key={v.name}>
                <span className={`icon-box ${v.kind === 'up' ? 'up' : ''}`}>
                  <Icon
                    name={v.kind === 'up' ? 'up' : v.kind === 'ceiling' ? 'trophy' : 'hold'}
                    size={16}
                    strokeWidth={2.5}
                  />
                </span>
                <span className="grow">
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{v.name}</span>
                  <span className="meta" style={{ display: 'block' }}>
                    {v.detail}
                  </span>
                </span>
                <span className="num" style={{ fontSize: 16, whiteSpace: 'nowrap' }}>
                  {v.to != null ? (
                    <>
                      {v.from} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>→</span> {v.to}
                    </>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>{v.from != null ? `${v.from} kg` : ''}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quote && (
        <div
          className="meta-2"
          style={{ color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5, padding: '0 4px' }}
        >
          “{quote}”
        </div>
      )}
    </div>
  );
}

const MUSCLE_WORD = {
  chest: 'Chest',
  'front-delts': 'Shoulders',
  'side-delts': 'Shoulders',
  'rear-delts': 'Rear delts',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  biceps: 'Biceps',
  back: 'Back',
  lats: 'Back',
  'upper-back': 'Back',
  traps: 'Traps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
  core: 'Core',
  forearms: 'Forearms',
};

function describeMuscles(exercises) {
  const seen = [];
  for (const ex of exercises) {
    for (const m of ex.muscles?.primary ?? []) {
      const word = MUSCLE_WORD[m] ?? m.charAt(0).toUpperCase() + m.slice(1);
      if (!seen.includes(word)) seen.push(word);
    }
  }
  return seen.slice(0, 5).join(' · ');
}
