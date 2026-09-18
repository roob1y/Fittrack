import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { allMuscles, muscleBreakdown, muscleScore } from '../../utils/muscleStrength';
import { LEVELS } from '../../utils/strengthStandards';
import { bodyweightAt } from '../../utils/loads';

// A page per muscle, scored against other people rather than against his own past.
//
// Two scales side by side, which is the whole point of the screen: the same 63 kg
// bench is "the average untrained man" AND "the 5th percentile of people who log
// lifts". Showing one without the other misleads in one direction or the other.

const card = {
  background: 'var(--card)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border)',
  borderRadius: 'var(--radius)',
  padding: '14px',
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

function Bar({ score }) {
  return (
    <div style={{ height: '6px', background: 'var(--surface)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${score ?? 0}%`, height: '100%', background: 'var(--accent)' }} />
    </div>
  );
}

// The five level bands, with his position marked. Reads as a ladder rather than a
// verdict — the next rung is the useful part.
function Ladder({ s }) {
  return (
    <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
      {LEVELS.map((lvl, i) => {
        const reached = s.level && LEVELS.indexOf(s.level) >= i;
        return (
          <div key={lvl} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{ height: '4px', borderRadius: '2px', background: reached ? 'var(--accent)' : 'var(--border)' }}
            />
            <div style={{ fontSize: '9px', color: reached ? 'var(--accent)' : 'var(--muted)', marginTop: '4px' }}>
              {lvl.slice(0, 3)}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{s.thresholds[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

function ExerciseRow({ row }) {
  const s = row.score;
  if (!row.hasStandard) {
    return (
      <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{row.ex.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
          No portable standard — this is a machine or cable lift, and the same number means a different load on every
          machine.
        </div>
      </div>
    );
  }
  if (!s) {
    return (
      <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{row.ex.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Not logged with a weight yet.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text)' }}>{row.ex.name}</div>
        <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {s.value} {s.unit}
        </div>
      </div>

      {/* A bodyweight lift is published as ADDED weight, so a negative number is the
          table saying "not one unassisted yet" rather than a bug. Without this line
          "-13.3 kg added" reads as a broken figure. */}
      {s.bodyweightRelative && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.5 }}>
          {s.value < 0
            ? `Scored as weight added at the belt, so this is ${Math.abs(s.value)} kg of assistance still needed — ${s.bodyweightRatio}× bodyweight. Beginner here is one unassisted rep.`
            : `Scored as weight added at the belt — ${s.bodyweightRatio}× bodyweight in total.`}
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.5 }}>
        {s.level
          ? `${s.level} — stronger than ${s.percentile}% of people who log lifts`
          : 'Below Beginner on the logged scale'}
        {s.untrainedRatio != null && (
          <>
            {' · '}
            <span style={{ color: s.bodyweightRatio >= s.untrainedRatio ? 'var(--accent)' : 'var(--muted)' }}>
              {s.bodyweightRatio}× bodyweight vs {s.untrainedRatio}× for an untrained man your size
            </span>
          </>
        )}
        {s.approx && ' · reps capped at 12 for the estimate, so this is a floor'}
      </div>

      {/* Sets sit BESIDE the score, never inside it: the standards are 1RM figures,
          so folding set count in would break the comparison. But holding a load for
          all three sets is a different achievement from touching it once, and the
          page should say which happened. Note this is the best SINGLE set, whereas
          the in-workout progression rule reads TOTAL reps across sets — both right
          for their own job, and confusing if the screen does not say so. */}
      {s.setsProgrammed > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
          Best single set, held for {s.setsAtValue} of {s.setsProgrammed} sets that session
          {s.setsAtValue < s.setsProgrammed ? ' — carrying it across all of them is the next step' : ''}
        </div>
      )}

      <Ladder s={s} />

      {s.nextLevel && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
          {s.toNext} {s.unit.startsWith('kg per') ? 'kg per hand' : 'kg'} to {s.nextLevel}
          {s.bodyweightRelative && s.value < 0 ? ' — that is assist off the stack, not weight on a belt' : ''}
        </div>
      )}
    </div>
  );
}

export default function MuscleStrengthScreen({ onBack }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const weightLog = useStore((s) => s.weightLog);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const [open, setOpen] = React.useState(null);

  const bw = bodyweightAt(weightLog, new Date().toISOString().slice(0, 10))?.kg ?? null;
  const muscles = React.useMemo(() => (bw ? allMuscles(days, slice, bw) : []), [days, slice, bw]);

  if (!bw) {
    return (
      <div>
        <button onClick={onBack} style={backBtn}>
          ‹ Progress
        </button>
        <div className="section-title" style={{ marginTop: 0 }}>
          STRENGTH BY MUSCLE
        </div>
        <div style={card}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Every standard here is relative to bodyweight, so this needs a weight in the log before it can say anything.
            Add one in the Body tab.
          </div>
        </div>
      </div>
    );
  }

  if (open) {
    const rows = muscleBreakdown(days, slice, open.muscle, bw);
    const agg = muscleScore(rows);
    return (
      <div>
        <button onClick={() => setOpen(null)} style={backBtn}>
          ‹ Strength by muscle
        </button>
        <div className="section-title" style={{ marginTop: 0 }}>
          {open.label.toUpperCase()}
        </div>

        <div style={card}>
          {agg.score == null ? (
            <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
              No score yet. Every lift training this muscle directly is a machine or cable movement, and those have no
              standard that carries between gyms.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Strength score</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '30px', color: 'var(--accent)' }}>
                  {agg.score}
                </div>
              </div>
              <Bar score={agg.score} />
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Mean of {agg.covered} scorable {agg.covered === 1 ? 'lift' : 'lifts'} of {agg.total} training this
                muscle directly. Standards exist for lifts, not muscles — this is an average of those, not a measurement
                of the muscle itself.
              </div>
            </>
          )}
        </div>

        <div style={card}>
          {rows.map((r) => (
            <ExerciseRow key={r.dayId + r.ex.name} row={r} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={backBtn}>
        ‹ Progress
      </button>
      <div className="section-title" style={{ marginTop: 0 }}>
        STRENGTH BY MUSCLE
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.5 }}>
        Scored at {bw} kg bodyweight against people who log lifts, and — where published figures exist — against an
        untrained man your size. The two are different populations and usually disagree.
      </div>

      {muscles.map((m) => (
        <div key={m.muscle} style={{ ...card, cursor: 'pointer' }} onClick={() => setOpen(m)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text)' }}>{m.label}</div>
            <div
              style={{ fontSize: '13px', color: m.score == null ? 'var(--muted)' : 'var(--accent)', fontWeight: 600 }}
            >
              {m.score == null ? 'no standard' : m.score}
            </div>
          </div>
          {m.score != null && (
            <div style={{ marginTop: '8px' }}>
              <Bar score={m.score} />
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                {/* A lift under the first threshold has no level name, which is still
                    worth saying — an empty line reads as missing data rather than as
                    "not on the ladder yet". */}
                {m.best ? `Best: ${m.best.ex.name} — ${m.best.score.level ?? 'below Beginner'}` : ''}
                {m.covered < m.total ? ` · ${m.total - m.covered} of ${m.total} lifts unscorable` : ''}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
