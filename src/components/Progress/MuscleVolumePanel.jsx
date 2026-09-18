import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { weeklyMuscleVolume, rankMuscles, METRICS, METRIC_INFO, SECONDARY_WEIGHT } from '../../utils/muscleVolume';

// Volume by muscle — three metrics behind one toggle.
//
// Horizontal bars rather than lines because the job is comparing magnitudes
// ACROSS muscles at a glance, not tracking one muscle over time; the week-on-week
// delta rides along as a small number rather than its own chart.
//
// The bars scale to the largest value actually present, so the longest bar is
// always full width and the rest are read against it. There is deliberately no
// target band: a shaded 10–20 band reads as "this is what you should be hitting",
// and on three full-body sessions a week most muscles sit below it by arithmetic.
//
// Strength is drawn differently — a diverging bar around a zero line, because the
// quantity is a signed change and a muscle going backwards should look like it is
// going backwards, not like a short bar.

const fmt = (v, metric) => {
  if (metric === 'strength') return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
  if (metric === 'tonnage') return `${Math.round(v).toLocaleString()} kg`;
  return String(Math.round(v * 10) / 10);
};

const navBtn = (disabled) => ({
  background: 'none',
  border: '1px solid var(--border)',
  color: disabled ? 'var(--border)' : 'var(--accent)',
  borderRadius: '8px',
  width: '34px',
  height: '30px',
  fontSize: '15px',
  fontFamily: 'inherit',
  cursor: disabled ? 'default' : 'pointer',
});

const fmtRange = (dates) => {
  const f = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return dates.length > 1 ? `${f(dates[0])}–${f(dates[dates.length - 1])}` : f(dates[0]);
};

export default function MuscleVolumePanel({ onBack }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const [metric, setMetric] = React.useState('sets');
  // null = follow the latest cycle. Once a cycle is chosen explicitly it stays put,
  // so logging a session mid-read does not yank the view forward under you.
  const [pinned, setPinned] = React.useState(null);

  const weeks = React.useMemo(
    () => weeklyMuscleVolume(PROGRAMMES[activeProgrammeId]?.days ?? [], slice),
    [activeProgrammeId, slice],
  );
  const ranked = React.useMemo(
    () => rankMuscles(pinned == null ? weeks : weeks.slice(0, pinned + 1), metric),
    [weeks, metric, pinned],
  );

  if (!weeks.length || !ranked.length) return null;

  const idx = pinned == null ? weeks.length - 1 : Math.min(Math.max(pinned, 0), weeks.length - 1);
  const current = weeks[idx];
  // A cycle in progress has only some of its days logged, so every muscle the
  // remaining days would have trained sits at zero. Showing a delta against a
  // finished cycle then reports a collapse that has not happened — the session
  // simply has not been done yet. Deltas are suppressed until the cycle is whole.
  const dayCount = PROGRAMMES[activeProgrammeId]?.days?.length ?? 0;
  const partial = dayCount > 0 && (current.dates?.length ?? 0) < dayCount;
  const strength = metric === 'strength';
  const strengthNav = strength;
  const info = METRIC_INFO[metric];

  // A programme "week" is one pass through the split, not seven days. Training six
  // days a week means two passes per calendar week, so reporting a cycle figure as
  // a weekly one halves it. Rather than assume either, read the cadence off the
  // logged dates and say what it actually is.
  const allDates = weeks.flatMap((w) => w.dates ?? []).sort();
  const spanDays =
    allDates.length > 1 ? (new Date(allDates[allDates.length - 1]) - new Date(allDates[0])) / 86400000 + 1 : null;
  const cyclesPerWeek = spanDays > 0 ? (weeks.length / spanDays) * 7 : null;
  // Rate from EVERY set logged over the whole span, not by scaling up the current
  // cycle — the newest cycle is usually half-finished, and extrapolating from it
  // either doubles or halves the answer depending on when you look.
  const setsPerWeek = spanDays > 0 ? (weeks.reduce((a, w) => a + w.totalSets, 0) / spanDays) * 7 : null;

  // Scale to the data, not to a target. Strength is signed, so the scale is the
  // largest magnitude in either direction and the axis sits in the middle.
  const qty = (r) => (strength ? (r.changePct ?? 0) : r.latest);
  const scale = Math.max(1, ...ranked.map((r) => Math.abs(qty(r))));
  const pc = (v) => `${(Math.abs(v) / scale) * 100}%`;

  return (
    <>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '13px',
            fontFamily: 'inherit',
            padding: '8px 0',
            cursor: 'pointer',
          }}
        >
          ‹ Progress
        </button>
      )}
      <div className="section-title" style={onBack ? { marginTop: 0 } : undefined}>
        VOLUME BY MUSCLE
      </div>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        {!strengthNav && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              gap: '8px',
            }}
          >
            <button onClick={() => setPinned(Math.max(0, idx - 1))} disabled={idx === 0} style={navBtn(idx === 0)}>
              ‹
            </button>
            <div style={{ fontSize: '13px', color: 'var(--text)' }}>
              Cycle {current.week}
              {current.dates?.length ? (
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}> · {fmtRange(current.dates)}</span>
              ) : null}
            </div>
            <button
              onClick={() => setPinned(idx + 1 >= weeks.length - 1 ? null : idx + 1)}
              disabled={idx === weeks.length - 1}
              style={navBtn(idx === weeks.length - 1)}
            >
              ›
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {METRICS.map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              style={{
                flex: 1,
                padding: '7px 0',
                fontSize: '12px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: m === metric ? 'var(--accent)' : 'var(--border)',
                background: m === metric ? 'var(--accent)' : 'transparent',
                color: m === metric ? '#0d0d0f' : 'var(--muted)',
              }}
            >
              {METRIC_INFO[m].label}
            </button>
          ))}
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            lineHeight: 1.5,
            marginBottom: '14px',
          }}
        >
          {strength
            ? `Cycle ${weeks[0].week} to cycle ${weeks[weeks.length - 1].week} · ${weeks.length} cycles with data`
            : `${current.totalSets} sets this cycle · indirect work counts ${SECONDARY_WEIGHT}`}
          {partial && !strength ? (
            <>
              <br />
              {current.dates.length} of {dayCount} days logged so far — the rest of this cycle is still to come.
            </>
          ) : null}
          {!strength && cyclesPerWeek ? (
            <>
              <br />
              You average {cyclesPerWeek.toFixed(1)} cycles a week — about {Math.round(setsPerWeek)} sets per calendar
              week.
            </>
          ) : null}
        </div>

        {ranked.map((r) => {
          const v = qty(r);
          // No change shown unless the SAME movements fed this muscle in both cycles.
          // Romanian Deadlifts entering Legs made glutes read +2,145 and chin-ups
          // being skipped made biceps read -620 — an exercise appearing or vanishing,
          // not a training change. See sameMovements in muscleVolume.js.
          const delta =
            strength || partial || r.previous === null || !r.comparable
              ? null
              : Math.round((r.latest - r.previous) * 10) / 10;
          return (
            <div key={r.group} style={{ marginBottom: '9px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '3px',
                }}
              >
                <span style={{ color: 'var(--text)' }}>{r.label}</span>
                <span style={{ color: 'var(--muted)' }}>
                  <span
                    style={{
                      color: strength && v < 0 ? 'var(--red)' : 'var(--text)',
                    }}
                  >
                    {fmt(v, metric)}
                  </span>
                  {delta !== null && delta !== 0 && (
                    <span
                      style={{
                        color: delta > 0 ? 'var(--accent)' : 'var(--muted)',
                      }}
                    >
                      {' '}
                      {delta > 0 ? '+' : ''}
                      {metric === 'tonnage' ? Math.round(delta).toLocaleString() : delta}
                    </span>
                  )}
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: '8px',
                  background: 'var(--surface)',
                  borderRadius: '4px',
                }}
              >
                {strength && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '-2px',
                      bottom: '-2px',
                      width: '1px',
                      background: 'var(--border)',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    borderRadius: '4px',
                    ...(strength
                      ? v < 0
                        ? {
                            right: '50%',
                            width: `calc(${pc(v)} / 2)`,
                            background: 'var(--red)',
                          }
                        : {
                            left: '50%',
                            width: `calc(${pc(v)} / 2)`,
                            background: 'var(--accent)',
                          }
                      : { left: 0, width: pc(v), background: 'var(--accent)' }),
                  }}
                />
              </div>
            </div>
          );
        })}

        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            marginTop: '12px',
            lineHeight: 1.5,
          }}
        >
          {info.note}
          {!strength && !partial && ranked.some((r) => r.previous !== null && !r.comparable) ? (
            <>
              {' '}
              A change against the previous cycle is only shown where the same exercises fed that muscle in both — add,
              skip or swap one and the difference is the programme moving rather than you.
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
