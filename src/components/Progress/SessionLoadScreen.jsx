import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { dayKey } from '../../utils/setKeys';
import { sessionTonnage } from '../../utils/sessionStats';
import { withinRange, DEFAULT_RANGE } from '../../utils/dateRange';
import RangeFilter from './RangeFilter';

// Session load and recovery, on its own screen.
//
// This started as a panel wedged under three others and got messy fast, which is
// the reason it moved. The layout rule that survived from the panel version:
//
//   A TABLE FIRST. At a handful of sessions a line has nothing to say a row does
//   not say better, and a sparkline with two axis labels leaves you unable to tell
//   which point was which session.
//
// Tonnage is only ever compared WITHIN a day type. Legs moves ~15,000 kg because
// the leg press is 130 kg; Push moves ~4,000. One series across all three produces
// a zigzag that looks like wild swings and is really Push→Pull→Legs repeating.
// Same error as reading one leg press line across two different machines.
//
// Heart rate and sleep are properties of the body rather than the session, so they
// stay comparable across everything — and they are deliberately last. They are the
// weakest signal here: a wrist optical sensor is at its worst under a loaded bar.

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const num = (v) => (v == null || v === '' ? '—' : v);

export default function SessionLoadScreen({ onBack }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const [focus, setFocus] = React.useState('all');
  const range = useStore((s) => s.progressRange ?? DEFAULT_RANGE);

  const rows = React.useMemo(() => {
    const out = [];
    for (let week = 1; week <= 52; week++) {
      for (const day of days) {
        const key = dayKey(week, day.id);
        const date = slice?.workoutDates?.[key];
        if (!date) continue;
        const { tonnage, sets, reps } = sessionTonnage(day, slice?.setData ?? {}, week);
        const h = slice?.sessionHealth?.[key] ?? {};
        out.push({
          key,
          date,
          week,
          focus: day.focus,
          mins: slice?.sessionTimes?.[key] ?? null,
          tonnage,
          sets,
          reps,
          avgHr: h.hr?.avg ?? null,
          peakHr: h.hr?.max ?? null,
          sleep: h.sleepMinutes ?? null,
        });
      }
    }
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [days, slice]);

  const focuses = [...new Set(rows.map((r) => r.focus))];
  const byFocus = focus === 'all' ? rows : rows.filter((r) => r.focus === focus);
  const shown = withinRange(byFocus, range);

  const card = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '14px',
    marginBottom: '14px',
  };
  const th = {
    fontSize: '10px',
    color: 'var(--muted)',
    textAlign: 'right',
    padding: '0 0 6px',
    fontWeight: 400,
  };
  const td = {
    fontSize: '12px',
    color: 'var(--text)',
    textAlign: 'right',
    padding: '6px 0',
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
        ‹ Progress
      </button>
      <div className="section-title" style={{ marginTop: 0 }}>
        SESSION LOAD &amp; RECOVERY
      </div>

      <RangeFilter note={`${shown.length} of ${rows.length} session${rows.length === 1 ? '' : 's'}`} />

      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        {['all', ...focuses].map((f) => (
          <button
            key={f}
            onClick={() => setFocus(f)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: f === focus ? 'var(--accent)' : 'var(--border)',
              background: f === focus ? 'var(--accent)' : 'transparent',
              color: f === focus ? '#0d0d0f' : 'var(--muted)',
            }}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>Session</th>
                <th style={th}>Mins</th>
                <th style={th}>Sets</th>
                <th style={th}>Reps</th>
                <th style={th}>Tonnage</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.key} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ ...td, textAlign: 'left' }}>
                    {fmtDate(r.date)}
                    {focus === 'all' && <span style={{ color: 'var(--muted)', fontSize: '11px' }}> · {r.focus}</span>}
                  </td>
                  <td style={td}>{num(r.mins)}</td>
                  <td style={td}>{r.sets}</td>
                  <td style={td}>{r.reps}</td>
                  <td style={td}>{r.tonnage.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {focus === 'all' && shown.length > 1 && (
          <div
            style={{
              fontSize: '10px',
              color: 'var(--muted)',
              marginTop: '10px',
              lineHeight: 1.5,
            }}
          >
            Tonnage is only meaningful within one day type — a Legs session moves several times what a Push session does
            because of the leg press. Filter to a single day to compare like with like.
          </div>
        )}
      </div>

      <div className="section-title">WHAT THE WATCH SAW</div>
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>Session</th>
                <th style={th}>Avg HR</th>
                <th style={th}>Peak</th>
                <th style={th}>Sleep</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.key} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ ...td, textAlign: 'left' }}>{fmtDate(r.date)}</td>
                  <td style={td}>{num(r.avgHr)}</td>
                  <td style={td}>{num(r.peakHr)}</td>
                  <td style={td}>{r.sleep ? `${Math.floor(r.sleep / 60)}h ${r.sleep % 60}m` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--muted)',
            marginTop: '10px',
            lineHeight: 1.5,
          }}
        >
          Context, not a verdict. A wrist sensor is least accurate under load, and a lower average heart rate usually
          means longer rests between sets rather than an easier session. Reps and weight are the measure that counts.
        </div>
      </div>
    </div>
  );
}
