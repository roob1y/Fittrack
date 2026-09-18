import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { planOverview } from '../../utils/planOverview';
import { DEFAULT_RANGE } from '../../utils/dateRange';
import { isAssisted } from '../../utils/loads';
import RangeFilter from './RangeFilter';

// The whole plan on one page — every exercise, its trend, and where it stands.
//
// Asked for 18 Sep. The shape was his: a row per exercise with a trend line, the
// current number and the change, grouped by day, with total reps at the top load
// as the thing being compared.
//
// ⚠ ADDING WEIGHT MAKES THE LINE GO DOWN, and the chart has to say so or it lies.
// Reps at the top load are the honest measure of progress between jumps and a
// guaranteed drop across one. Every load change draws a hairline at the session it
// happened and is named underneath, so a dip reads as "he went up to 110" rather
// than as a bad month. See planOverview.js.

const card = {
  background: 'var(--card)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border)',
  borderRadius: 'var(--radius)',
  padding: '4px 14px',
  marginBottom: '12px',
};

const backBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  fontSize: '13px',
  fontFamily: 'inherit',
  padding: '8px 0',
  cursor: 'pointer',
};

const fmt = (n) => (n == null ? null : Math.round(n * 10) / 10);
const shortDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
};

// A sparkline of total reps at each session's top load.
//
// Drawn with `preserveAspectRatio="none"` so it fills whatever width the row has,
// which means ANY round mark would render as an ellipse. Every mark here is
// therefore a vertical line — a vertical line stretched horizontally is still a
// vertical line — and `vector-effect="non-scaling-stroke"` keeps the strokes a
// real pixel wide instead of scaling with the box.
function Spark({ points, height = 34 }) {
  if (!points || points.length < 2) return null;
  const W = 300;
  const H = height;
  const pad = 5;
  const reps = points.map((p) => p.reps);
  const lo = Math.min(...reps);
  const hi = Math.max(...reps);
  const span = hi - lo || 1;
  const x = (i) => (i / (points.length - 1)) * W;
  // A flat series sits mid-height rather than pinned to the floor, so "no change"
  // does not read as "nothing logged".
  const y = (r) => (hi === lo ? H / 2 : H - pad - ((r - lo) / span) * (H - pad * 2));

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.reps).toFixed(1)}`).join(' ');

  const changes = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].load;
    const b = points[i].load;
    if (a != null && b != null && a !== b) changes.push({ i, up: b > a });
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${H}px`, display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {changes.map((c) => (
        <line
          key={c.i}
          x1={x(c.i)}
          x2={x(c.i)}
          y1={0}
          y2={H}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity={c.up ? 0.55 : 0.3}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* The latest session, so the eye lands on where he is now. */}
      <line
        x1={x(points.length - 1)}
        x2={x(points.length - 1)}
        y1={y(points[points.length - 1].reps) - 3}
        y2={y(points[points.length - 1].reps) + 3}
        stroke="var(--accent)"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Pill({ children, solid }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.4px',
        padding: '2px 7px',
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        // Text on the lime accent is always a fixed near-black: `var(--bg)` is
        // near-WHITE in the light theme and the badge vanishes. See bug 20.
        background: solid ? 'var(--accent)' : 'transparent',
        color: solid ? '#0d0d0f' : 'var(--muted)',
        borderWidth: solid ? 0 : '1px',
        borderStyle: 'solid',
        borderColor: 'var(--border)',
      }}
    >
      {children}
    </span>
  );
}

function loadLabel(row) {
  if (row.current == null) return 'bodyweight';
  return `${fmt(row.current)} kg${isAssisted(row.ex) ? ' eff' : ''}`;
}

function Row({ row }) {
  const p = row.progress;
  const m = row.matched;
  const lc = row.loadChange;

  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text)', minWidth: 0 }}>{row.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          {row.ready && row.target?.nextLoad != null && <Pill solid>DUE {fmt(row.target.nextLoad)}</Pill>}
          {row.stalled && <Pill>STALLED</Pill>}
          <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{loadLabel(row)}</span>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        {row.excluded ? (
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Not comparable — this exercise&apos;s units changed underneath its numbers.
          </div>
        ) : row.points.length < 2 ? (
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {row.points.length === 1 ? 'One session in this range — no trend yet.' : 'Nothing logged in this range.'}
          </div>
        ) : (
          <Spark points={row.points} />
        )}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px', lineHeight: 1.5 }}>
        {p ? (
          <>
            {p.total} of {p.max} reps at {fmt(p.load)} kg
            {p.setsAtLoad < p.setsWanted && `, but only ${p.setsAtLoad} of ${p.setsWanted} sets were at that weight`}
          </>
        ) : (
          `${row.latest.totalReps} reps on ${shortDate(row.latest.date)}`
        )}
      </div>

      {/* The load change is what explains a dip, so it sits directly under the line. */}
      {(lc || m) && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.5 }}>
          {lc && (
            // Bold, because the lime accent at 11px regular is weak against the
            // LIGHT theme's near-white card — the same contrast trap as bug 20.
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {lc.up ? '↑' : '↓'} {fmt(lc.from)} → {fmt(lc.to)} kg on {shortDate(lc.date)}
            </span>
          )}
          {lc && m && ' · '}
          {m && (
            <>
              {m.delta > 0 ? '+' : ''}
              {m.delta} {m.basis === 'total' ? 'reps' : 'on the best set'} at {fmt(m.load)} kg since{' '}
              {shortDate(m.first.date)}
            </>
          )}
        </div>
      )}

      {(row.droppedByCompareFrom > 0 || row.hiddenByRange > 0) && (
        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', opacity: 0.8 }}>
          {row.droppedByCompareFrom > 0 &&
            `${row.droppedByCompareFrom} earlier session${row.droppedByCompareFrom > 1 ? 's' : ''} not plotted — measured on a different ruler`}
          {row.droppedByCompareFrom > 0 && row.hiddenByRange > 0 && ' · '}
          {row.hiddenByRange > 0 && `${row.hiddenByRange} outside this range`}
        </div>
      )}
    </div>
  );
}

export default function PlanOverviewScreen({ onBack }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const range = useStore((s) => s.progressRange ?? DEFAULT_RANGE);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];

  const plan = React.useMemo(() => planOverview(days, slice, range), [days, slice, range]);
  const [collapsed, setCollapsed] = React.useState({});

  const total = plan.reduce((a, d) => a + d.count, 0);

  return (
    <div>
      <button onClick={onBack} style={backBtn}>
        ‹ Progress
      </button>
      <div className="section-title" style={{ marginTop: 0 }}>
        THE WHOLE PLAN
      </div>

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.5 }}>
        Every exercise you have logged, by day. The line is total reps at that session&apos;s heaviest load, so it drops
        when you add weight — a dashed marker shows where that happened.
      </div>

      <RangeFilter note="The range scopes the lines only. Every verdict reads your full history." />

      {total === 0 && (
        <div style={{ ...card, padding: '14px' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Nothing logged yet. Finish a session and every exercise in it will appear here.
          </div>
        </div>
      )}

      {plan.map((d) => {
        const isOpen = !collapsed[d.day.id];
        return (
          <div key={d.day.id} style={card}>
            <div
              onClick={() => setCollapsed((c) => ({ ...c, [d.day.id]: !!isOpen }))}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 0',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  {d.day.focus ?? d.day.name ?? d.day.id}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  {d.count} logged
                  {d.untouched > 0 && ` · ${d.untouched} never logged`}
                  {d.readyCount > 0 && ` · ${d.readyCount} due more weight`}
                  {d.stalledCount > 0 && ` · ${d.stalledCount} stalled`}
                </div>
              </div>
              <div style={{ fontSize: '16px', color: 'var(--muted)' }}>{isOpen ? '⌄' : '›'}</div>
            </div>

            {isOpen &&
              d.tiles.map((tile, ti) => (
                <div key={tile.slot ?? tile.rows[0].name + ti}>
                  {tile.rows.length > 1 && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--muted)',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border)',
                        letterSpacing: '0.3px',
                      }}
                    >
                      ⇄ ONE MOVEMENT, TWO STATIONS — SEPARATE HISTORIES
                    </div>
                  )}
                  {tile.rows.map((row) => (
                    <Row key={row.dayId + row.name} row={row} />
                  ))}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
