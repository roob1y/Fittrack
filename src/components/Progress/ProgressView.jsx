import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { dayKey } from '../../utils/setKeys';
import { workoutSummary } from '../../utils/progressStats';
import MuscleVolumePanel from './MuscleVolumePanel';
import SessionLoadScreen from './SessionLoadScreen';
import MuscleStrengthScreen from './MuscleStrengthScreen';
import StrengthScreen from './StrengthScreen';
import PlanOverviewScreen from './PlanOverviewScreen';

// Progress, as a hub.
//
// This was one scroll doing five jobs — strength graphs per exercise, overload,
// volume by muscle, session load, the week log — and each was crowding the others.
// Now the top level answers "how is it going" in a few numbers, and each question
// that needs room gets a screen.
//
// Sub-navigation is local state rather than a router: it is two levels deep at
// most, and the rest of the app already works this way (WorkoutsView → DayDetail).

// Sessions in the last 7 days, and the cycle cadence, read off the log rather than
// assumed. A programme "week" is one pass through the split, which at six days a
// week is about 3½ days — see utils/muscleVolume.js.
function cadence(workoutDates) {
  const dates = [...new Set(Object.values(workoutDates ?? {}))].sort();
  if (!dates.length) return { sessions: 0, perWeek: null, spanDays: 0, last: null };
  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);
  const spanDays = Math.max(1, (last - first) / 86400000 + 1);
  return {
    sessions: dates.length,
    perWeek: (dates.length / spanDays) * 7,
    spanDays,
    last: dates[dates.length - 1],
  };
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now - d) / 86400000);
}

function NavCard({ title, detail, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: accent ? 'var(--accent)' : 'var(--border)',
        borderRadius: 'var(--radius)',
        padding: '15px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            marginTop: '3px',
            lineHeight: 1.4,
          }}
        >
          {detail}
        </div>
      </div>
      <div style={{ fontSize: '18px', color: 'var(--muted)' }}>›</div>
    </div>
  );
}

export default function ProgressView({ initialScreen = null, onScreenConsumed }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const currentWeek = useStore((s) => s.currentWeek);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];

  const [screen, setScreen] = React.useState(initialScreen);
  // A deep link from the header (rank chip → Ranks) arrives as a prop; take it
  // once, then hand navigation back to local state.
  React.useEffect(() => {
    if (initialScreen) {
      setScreen(initialScreen);
      onScreenConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScreen]);

  const workoutDates = slice?.workoutDates ?? {};
  const completedDays = slice?.completedDays ?? {};
  const c = cadence(workoutDates);
  const since = daysSince(c.last);

  const summaries = React.useMemo(
    () => days.map((d) => workoutSummary(days, slice, d.id)).filter(Boolean),
    [days, slice],
  );
  const readyCount = summaries.reduce((a, s) => a + s.rows.filter((r) => r.ready).length, 0);
  const cmp = summaries.flatMap((s) => s.rows.filter((r) => r.matched));
  const upCount = cmp.filter((r) => r.matched.delta > 0).length;
  const thisCycle = days.filter((d) => completedDays?.[dayKey(currentWeek, d.id)]).length;
  const total = summaries.reduce((a, s) => a + s.rows.length, 0);

  if (screen === 'strength') return <StrengthScreen onBack={() => setScreen(null)} />;
  if (screen === 'volume') return <MuscleVolumePanel onBack={() => setScreen(null)} />;
  if (screen === 'load') return <SessionLoadScreen onBack={() => setScreen(null)} />;
  if (screen === 'muscle') return <MuscleStrengthScreen onBack={() => setScreen(null)} />;
  if (screen === 'plan') return <PlanOverviewScreen onBack={() => setScreen(null)} />;

  return (
    <div>
      <div className="section-title" style={{ marginTop: '4px' }}>
        YOUR PROGRESS
      </div>

      <div className="progress-grid">
        <div className="stat-card">
          <div className="stat-val">{c.sessions}</div>
          <div className="stat-label">Sessions logged</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{c.perWeek ? c.perWeek.toFixed(1) : '—'}</div>
          <div className="stat-label">Sessions / week</div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '13px 15px',
          marginBottom: '18px',
          fontSize: '12px',
          color: 'var(--muted)',
          lineHeight: 1.5,
        }}
      >
        Cycle {currentWeek} · {thisCycle} of {days.length} days done
        {since != null && (
          <>
            {' · '}
            last session {since === 0 ? 'today' : since === 1 ? 'yesterday' : `${since} days ago`}
          </>
        )}
      </div>

      <NavCard
        title="The Whole Plan"
        detail={
          total
            ? `All ${total} logged exercises on one page — trend, current load and change, by day`
            : 'Every exercise on one page once you have logged a session'
        }
        onClick={() => setScreen('plan')}
      />
      <NavCard
        title="Strength &amp; Overload"
        accent={readyCount > 0}
        detail={
          cmp.length
            ? `${upCount} of ${cmp.length} exercises up at matched weight` +
              (readyCount ? ` · ${readyCount} ready for more weight` : '')
            : 'Log a weight twice to start comparing'
        }
        onClick={() => setScreen('strength')}
      />
      <NavCard
        title="Strength by Muscle"
        detail="How each muscle scores against other people your size — a page per muscle"
        onClick={() => setScreen('muscle')}
      />
      <NavCard
        title="Volume by Muscle"
        detail="Sets, tonnage and strength per muscle — steppable cycle by cycle"
        onClick={() => setScreen('volume')}
      />
      <NavCard
        title="Session Load &amp; Recovery"
        detail="Duration, sets, tonnage and what the watch saw, per session"
        onClick={() => setScreen('load')}
      />
    </div>
  );
}
