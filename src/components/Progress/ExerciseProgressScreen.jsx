import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { sessionsFor, matchedLoad, isStalled } from '../../utils/progressStats';
import { withinRange, DEFAULT_RANGE } from '../../utils/dateRange';
import RangeFilter from './RangeFilter';
import { axisTicks, incrementFor, nextTarget, tidy } from '../../utils/increments';

// One exercise, everything known about it.
//
// The graph plots TOP LOAD per session on an axis whose gridlines are real stack
// positions — see utils/increments.js. A flat line here means the same pin hole,
// not a rounding artefact, and the gap between two gridlines is a change you could
// actually go and make.
//
// Tapping a point opens that session: every set, and the note written at the time.
// The notes are the most useful thing in the log and until now they were only
// visible in the CSV export.

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function Graph({ sessions, step, selected, onSelect }) {
  const ref = React.useRef(null);
  const [box, setBox] = React.useState({ w: 0, h: 180 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.offsetWidth, h: 180 }));
    ro.observe(el);
    setBox({ w: el.offsetWidth, h: 180 });
    return () => ro.disconnect();
  }, []);

  const pts = sessions.filter((s) => s.topLoad != null);
  const { min, max, ticks } = axisTicks(
    pts.map((p) => p.topLoad),
    step,
  );

  const pad = { top: 14, right: 12, bottom: 26, left: 40 };
  const { w, h } = box;
  const innerW = Math.max(1, w - pad.left - pad.right);
  const innerH = h - pad.top - pad.bottom;
  const toX = (i) => pad.left + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW);
  const toY = (v) => pad.top + (1 - (v - min) / (max - min || 1)) * innerH;

  return (
    <div ref={ref} style={{ width: '100%' }}>
      {w > 0 && pts.length > 0 && (
        <svg width={w} height={h} style={{ display: 'block', touchAction: 'manipulation' }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={w - pad.right} y1={toY(t)} y2={toY(t)} stroke="var(--border)" strokeWidth="1" />
              <text x={pad.left - 6} y={toY(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)">
                {tidy(t)}
              </text>
            </g>
          ))}
          {pts.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinejoin="round"
              points={pts.map((p, i) => `${toX(i)},${toY(p.topLoad)}`).join(' ')}
            />
          )}
          {pts.map((p, i) => (
            <g key={p.date} onClick={() => onSelect(p.date === selected ? null : p.date)} style={{ cursor: 'pointer' }}>
              {/* generous invisible hit area — these are small targets on a phone */}
              <rect x={toX(i) - 18} y={pad.top} width="36" height={innerH} fill="transparent" />
              <circle
                cx={toX(i)}
                cy={toY(p.topLoad)}
                r={p.date === selected ? 6 : 3.5}
                fill={p.date === selected ? 'var(--text)' : 'var(--accent)'}
                stroke={p.date === selected ? 'var(--accent)' : 'none'}
                strokeWidth="2"
              />
            </g>
          ))}
          {pts.map((p, i) =>
            i === 0 || i === pts.length - 1 || p.date === selected ? (
              <text
                key={'l' + p.date}
                x={toX(i)}
                y={h - 8}
                textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}
                fontSize="10"
                fill={p.date === selected ? 'var(--accent)' : 'var(--muted)'}
              >
                {fmt(p.date)}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}

export default function ExerciseProgressScreen({ dayId, exName, onBack }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const day = days.find((d) => d.id === dayId);
  const ex = day?.exercises.find((e) => e.name === exName);

  const sessions = React.useMemo(() => (ex ? sessionsFor(days, slice, dayId, ex) : []), [days, slice, dayId, ex]);
  const [selected, setSelected] = React.useState(null);
  const range = useStore((s) => s.progressRange ?? DEFAULT_RANGE);

  // The range scopes what is DRAWN, never what is judged. Matched load, the next
  // target and the stall check all read the full history below — narrowing the
  // window to a fortnight and getting a different verdict on whether a weight has
  // been earned would make the filter a way to change the answer rather than a way
  // to look at a stretch of time.
  const graphed = withinRange(sessions, range);

  if (!ex) return null;

  const step = incrementFor(ex);
  const matched = matchedLoad(ex, sessions);
  const target = nextTarget(ex, sessions[sessions.length - 1]);
  const stalled = isStalled(ex, sessions);
  const shown = sessions.find((s) => s.date === selected) ?? sessions[sessions.length - 1];

  const card = {
    background: 'var(--card)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px',
    marginBottom: '14px',
  };

  return (
    <div>
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
        ‹ {day.focus}
      </button>

      <div className="section-title" style={{ marginTop: 0 }}>
        {ex.name.toUpperCase()}
      </div>

      <RangeFilter
        note={
          graphed.length === sessions.length
            ? undefined
            : `Graph shows ${graphed.length} of ${sessions.length} sessions — verdicts below still read all of them`
        }
      />

      {ex.excludeFromOverload && (
        <div style={{ ...card, borderColor: 'var(--accent2)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
            Comparisons are switched off for this exercise — the rep convention changed partway through, so reps logged
            before and after are not the same unit. It comes back once there are two clean sessions.
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
          Top load per session{step ? ` · this machine moves in ${step} kg steps` : ''}
        </div>
        <Graph sessions={graphed} step={step} selected={selected} onSelect={setSelected} />
        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
          Tap a point to see that session.
        </div>
      </div>

      {shown && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{fmt(shown.date)}</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {shown.totalReps} reps{shown.topLoad ? ` · top ${shown.topLoad} kg` : ''}
            </span>
          </div>
          {shown.sets.map((s) => (
            <div
              key={s.si}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}
            >
              <span style={{ color: 'var(--muted)' }}>Set {s.si + 1}</span>
              <span style={{ color: 'var(--text)' }}>
                {s.reps} reps{s.weight ? ` · ${s.weight} kg` : ''}
              </span>
            </div>
          ))}
          {shown.note && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text)',
                lineHeight: 1.5,
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {shown.note}
            </div>
          )}
        </div>
      )}

      {target && (
        <div style={{ ...card, borderColor: target.verdict === 'add' ? 'var(--accent)' : 'var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>NEXT SESSION</div>
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>{target.note}</div>
        </div>
      )}

      {matched && (
        <div style={card}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
            AT {matched.load} KG{matched.basis === 'best' ? ' · BEST SET' : ''}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text)' }}>
            {matched.first.reps.join('/')} <span style={{ color: 'var(--muted)' }}>→</span>{' '}
            {matched.latest.reps.join('/')}{' '}
            <span
              style={{ color: matched.delta > 0 ? 'var(--accent)' : matched.delta < 0 ? 'var(--red)' : 'var(--muted)' }}
            >
              {matched.delta > 0 ? '+' : ''}
              {matched.delta} reps
            </span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '3px' }}>
            {fmt(matched.first.date)} → {fmt(matched.latest.date)}
          </div>
        </div>
      )}

      {stalled && (
        <div style={{ ...card, borderColor: 'var(--red)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
            Three sessions at the same weight with no reps gained. Not a problem yet — but if the next one matches,
            change something: the load, the rest, or the order it sits in the session.
          </div>
        </div>
      )}
    </div>
  );
}
