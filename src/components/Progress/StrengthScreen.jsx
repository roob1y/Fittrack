import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { workoutSummary, personalBests } from '../../utils/progressStats';
import ExerciseProgressScreen from './ExerciseProgressScreen';

// Strength and overload, one screen, drilling down by workout.
//
// Split by day rather than listed flat because that is how the training is
// organised: a Push exercise and a Pull exercise are never done in the same
// session and comparing them side by side answers no question anyone has.

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const card = {
  background: 'var(--card)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border)',
  borderRadius: 'var(--radius)',
  padding: '14px',
  marginBottom: '12px',
};

function Row({ r, onOpen }) {
  const d = r.matched?.delta;
  const colour = d > 0 ? 'var(--accent)' : d < 0 ? 'var(--red)' : 'var(--muted)';
  return (
    <div
      onClick={onOpen}
      style={{
        padding: '10px 0',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '10px',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
          {r.ready && (
            <span
              style={{
                fontSize: '9px',
                background: 'var(--accent)',
                color: '#0d0d0f',
                borderRadius: '4px',
                padding: '1px 5px',
                whiteSpace: 'nowrap',
              }}
            >
              ADD WEIGHT
            </span>
          )}
          {r.stalled && !r.ready && (
            <span
              style={{
                fontSize: '9px',
                border: '1px solid var(--red)',
                color: 'var(--red)',
                borderRadius: '4px',
                padding: '0 5px',
                whiteSpace: 'nowrap',
              }}
            >
              STALLED
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
          {r.excluded
            ? 'not compared — units changed'
            : r.matched
              ? `${r.matched.load} kg · ${r.matched.first.reps.join('/')} → ${r.matched.latest.reps.join('/')}`
              : `${r.sessions.length} session${r.sessions.length === 1 ? '' : 's'} · no repeated weight yet`}
          {r.reps && !r.ready ? ` · ${r.reps.total}/${r.reps.max} reps` : ''}
        </div>
      </div>
      <div style={{ alignSelf: 'center', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {r.matched && (
          <div style={{ fontSize: '13px', color: colour }}>
            {d > 0 ? '+' : ''}
            {d}
          </div>
        )}
        <div style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1 }}>›</div>
      </div>
    </div>
  );
}

export default function StrengthScreen({ onBack }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];

  const [openDay, setOpenDay] = React.useState(null);
  const [openEx, setOpenEx] = React.useState(null);

  const summaries = React.useMemo(
    () => days.map((d) => workoutSummary(days, slice, d.id)).filter(Boolean),
    [days, slice],
  );
  const pbs = React.useMemo(() => personalBests(days, slice), [days, slice]);

  if (openEx) {
    return <ExerciseProgressScreen dayId={openDay} exName={openEx} onBack={() => setOpenEx(null)} />;
  }

  if (openDay) {
    const s = summaries.find((x) => x.day.id === openDay);
    return (
      <div>
        <button
          onClick={() => setOpenDay(null)}
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
          ‹ Strength
        </button>
        <div className="section-title" style={{ marginTop: 0 }}>
          {s.day.focus.toUpperCase()}
        </div>
        <div style={card}>
          {s.rows.map((r) => (
            <Row key={r.name} r={r} onOpen={() => setOpenEx(r.name)} />
          ))}
          {!s.rows.length && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Nothing logged on this day yet.</div>
          )}
        </div>
      </div>
    );
  }

  const ready = summaries.flatMap((s) => s.rows.filter((r) => r.ready).map((r) => ({ ...r, focus: s.day.focus })));

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
        ‹ Progress
      </button>
      <div className="section-title" style={{ marginTop: 0 }}>
        STRENGTH &amp; OVERLOAD
      </div>

      {ready.length > 0 && (
        <div style={{ ...card, borderColor: 'var(--accent)' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>READY FOR MORE WEIGHT</div>
          {ready.map((r) => (
            <div
              key={r.focus + r.name}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}
            >
              <span style={{ color: 'var(--text)' }}>{r.name}</span>
              <span style={{ color: 'var(--accent)' }}>
                {r.target?.nextLoad ? `→ ${r.target.nextLoad} kg` : 'add weight'}
              </span>
            </div>
          ))}
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '8px', lineHeight: 1.5 }}>
            Within a rep of the most your rep range allows at that weight. The suggested load is one real step up on
            that machine — not a round number it cannot make.
          </div>
        </div>
      )}

      {summaries.map((s) => {
        const cmp = s.rows.filter((r) => r.matched);
        const up = cmp.filter((r) => r.matched.delta > 0).length;
        const down = cmp.filter((r) => r.matched.delta < 0).length;
        const nReady = s.rows.filter((r) => r.ready).length;
        return (
          <div key={s.day.id} onClick={() => setOpenDay(s.day.id)} style={{ ...card, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{s.day.focus}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>
                  {s.rows.length} exercises logged · {up} up
                  {down ? `, ${down} down` : ''}
                  {nReady ? ` · ${nReady} due an increase` : ''}
                </div>
              </div>
              <div style={{ fontSize: '18px', color: 'var(--muted)' }}>›</div>
            </div>
          </div>
        );
      })}

      {pbs.length > 0 && (
        <>
          <div className="section-title">PERSONAL BESTS</div>
          <div style={card}>
            {pbs.map((p, i) => (
              <div
                key={p.date + p.exercise + i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '7px 0',
                  borderTop: i ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.exercise}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    {fmt(p.date)} · {p.focus}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--accent)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                  {p.reps} × {p.load} kg
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
