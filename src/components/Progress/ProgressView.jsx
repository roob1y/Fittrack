import React from 'react';
import useStore from '../../store/useStore';
import { PROGRAMMES } from '../../data/program';
import { dayKey } from '../../utils/setKeys';
import { workoutSummary, personalBests } from '../../utils/progressStats';
import MuscleVolumePanel from './MuscleVolumePanel';
import SessionLoadScreen from './SessionLoadScreen';
import StrengthScreen from './StrengthScreen';
import PlanOverviewScreen from './PlanOverviewScreen';
import RanksScreen from '../Ranks/RanksScreen';
import RankBadge from '../Ranks/RankBadge';
import useRankBoard from '../../hooks/useRankBoard';
import Icon from '../ui/Icon';

// Progress, as a hub.
//
// The top level answers "how is it going" — a few numbers, what to change next,
// the highlights — and each question that needs room gets a screen. Robbie's
// complaint about the old hub was that it was five long nav cards and no answers;
// the answers now come first and the nav is a short list at the bottom.
//
// Sub-navigation is local state rather than a router, as the rest of the app does.

function cadence(workoutDates) {
  const dates = [...new Set(Object.values(workoutDates ?? {}))].sort();
  if (!dates.length) return { sessions: 0, perWeek: null, spanDays: 0, last: null };
  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);
  const spanDays = Math.max(1, (last - first) / 86400000 + 1);
  return { sessions: dates.length, perWeek: (dates.length / spanDays) * 7, spanDays, last: dates[dates.length - 1] };
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now - d) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (s) => (s ? `${parseInt(s.slice(8, 10), 10)} ${MONTHS[parseInt(s.slice(5, 7), 10) - 1]}` : '');

export default function ProgressView({ initialScreen = null, onScreenConsumed }) {
  const activeProgrammeId = useStore((s) => s.activeProgrammeId);
  const slice = useStore((s) => s.programmeData[s.activeProgrammeId]);
  const currentWeek = useStore((s) => s.currentWeek);
  const days = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const { board } = useRankBoard();

  const [screen, setScreen] = React.useState(initialScreen);
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
  const verdicts = React.useMemo(() => {
    const out = [];
    for (const s of summaries) {
      for (const r of s.rows) {
        const t = r.target;
        if (t?.verdict === 'add')
          out.push({
            kind: 'up',
            name: r.name,
            focus: s.day.focus,
            from: t.load,
            to: t.nextLoad,
            detail: `${t.done} of ${t.max} reps at ${t.load} kg`,
          });
        else if (t?.verdict === 'ceiling')
          out.push({
            kind: 'ceiling',
            name: r.name,
            focus: s.day.focus,
            from: t.load,
            to: null,
            detail: 'Full house at the heaviest weight available',
          });
        else if (r.stalled)
          out.push({
            kind: 'hold',
            name: r.name,
            focus: s.day.focus,
            from: t?.load ?? r.reps?.load ?? null,
            to: null,
            detail: 'Same numbers three sessions running',
          });
        else if (r.matched && r.matched.delta < 0)
          out.push({
            kind: 'down',
            name: r.name,
            focus: s.day.focus,
            from: r.matched.load,
            to: null,
            detail: `${r.matched.delta} reps at ${r.matched.load} kg vs ${fmt(r.matched.first.date)}`,
          });
      }
    }
    const order = { up: 0, ceiling: 1, down: 2, hold: 3 };
    return out.sort((a, b) => order[a.kind] - order[b.kind]);
  }, [summaries]);
  const counts = {
    up: verdicts.filter((v) => v.kind === 'up' || v.kind === 'ceiling').length,
    hold: verdicts.filter((v) => v.kind === 'hold').length,
    down: verdicts.filter((v) => v.kind === 'down').length,
  };
  const [showAll, setShowAll] = React.useState(false);

  const pbs = React.useMemo(() => personalBests(days, slice, 6), [days, slice]);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const pbsThisMonth = pbs.filter((p) => p.date >= monthAgo).length;
  const latestPB = pbs[0];
  const bestGain = React.useMemo(() => {
    let best = null;
    for (const s of summaries)
      for (const r of s.rows) {
        if (!r.matched || r.matched.delta <= 0) continue;
        if (!best || r.matched.delta > best.matched.delta) best = r;
      }
    return best;
  }, [summaries]);
  const thisCycle = days.filter((d) => completedDays?.[dayKey(currentWeek, d.id)]).length;

  if (screen === 'strength') return <StrengthScreen onBack={() => setScreen(null)} />;
  if (screen === 'volume') return <MuscleVolumePanel onBack={() => setScreen(null)} />;
  if (screen === 'load') return <SessionLoadScreen onBack={() => setScreen(null)} />;
  if (screen === 'muscle' || screen === 'ranks') return <RanksScreen onBack={() => setScreen(null)} />;
  if (screen === 'plan') return <PlanOverviewScreen onBack={() => setScreen(null)} />;

  const shown = showAll ? verdicts : verdicts.slice(0, 4);

  return (
    <div className="stack stack-16">
      <div className="stack stack-4">
        <span className="display display-lg">Progress</span>
        <span className="meta" style={{ fontWeight: 500 }}>
          Cycle {currentWeek} · {thisCycle} of {days.length} days done
          {since != null &&
            ` · last session ${since === 0 ? 'today' : since === 1 ? 'yesterday' : `${since} days ago`}`}
        </span>
      </div>

      <div className="grid-3">
        <div className="card stack stack-4" style={{ padding: '14px 12px' }}>
          <span className="display" style={{ fontSize: 30, fontVariationSettings: "'wdth' 75" }}>
            {c.sessions}
          </span>
          <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
            sessions
          </span>
        </div>
        <div className="card stack stack-4" style={{ padding: '14px 12px' }}>
          <span className="display" style={{ fontSize: 30, fontVariationSettings: "'wdth' 75" }}>
            {c.perWeek ? c.perWeek.toFixed(1) : '—'}
          </span>
          <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
            per week
          </span>
        </div>
        <div className="card stack stack-4" style={{ padding: '14px 12px' }}>
          <span className="display" style={{ fontSize: 30, fontVariationSettings: "'wdth' 75" }}>
            {pbsThisMonth}
          </span>
          <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
            PBs in 30 days
          </span>
        </div>
      </div>

      <div>
        <div className="section-head">
          <span className="h-section">What to change next</span>
          <span className="link">from your last sessions</span>
        </div>
        <div className="grid-3" style={{ marginBottom: 8 }}>
          {[
            ['up', 'var(--accent)', `${counts.up} up`],
            ['hold', 'var(--muted)', `${counts.hold} hold`],
            ['down', 'var(--down)', `${counts.down} down`],
          ].map(([k, color, label]) => (
            <div key={k} className="tile row" style={{ gap: 8, padding: '10px 12px' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
            </div>
          ))}
        </div>
        {verdicts.length === 0 ? (
          <div className="card meta" style={{ padding: 14, lineHeight: 1.5 }}>
            Log a weight twice on the same exercise and the verdicts start here.
          </div>
        ) : (
          <div className="list">
            {shown.map((v) => (
              <div key={v.focus + v.name} className="list-row">
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    width: 40,
                    color:
                      v.kind === 'up' || v.kind === 'ceiling'
                        ? 'var(--accent)'
                        : v.kind === 'down'
                          ? 'var(--down)'
                          : 'var(--muted)',
                  }}
                >
                  {v.kind === 'up' ? 'UP' : v.kind === 'ceiling' ? 'MAX' : v.kind === 'down' ? 'DOWN' : 'HOLD'}
                </span>
                <span className="grow">
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{v.name}</span>
                  <span className="meta" style={{ display: 'block' }}>
                    {v.focus} · {v.detail}
                  </span>
                </span>
                <span
                  className="num"
                  style={{ fontSize: 15, whiteSpace: 'nowrap', color: v.kind === 'hold' ? 'var(--muted)' : undefined }}
                >
                  {v.to != null ? `→ ${v.to}` : v.from != null ? v.from : ''}
                </span>
              </div>
            ))}
            {verdicts.length > 4 && (
              <button className="list-foot" onClick={() => setShowAll((s) => !s)}>
                {showAll ? 'Show fewer' : `Show all ${verdicts.length} exercises`}
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="section-head">
          <span className="h-section">Highlights</span>
        </div>
        <div className="grid-2">
          <button
            className="card stack stack-4"
            style={{ padding: 14, textAlign: 'left' }}
            onClick={() => setScreen('strength')}
          >
            <span className="eyebrow accent" style={{ fontSize: 10 }}>
              {latestPB ? `New PB · ${fmt(latestPB.date)}` : 'PBs'}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {latestPB ? `${latestPB.exercise} ${latestPB.load} kg` : 'None yet'}
            </span>
            <span className="meta">
              {latestPB
                ? `${latestPB.reps} reps · +${latestPB.gainPct.toFixed(0)}% e1RM`
                : 'A second session at a weight is a record'}
            </span>
          </button>
          <button
            className="card stack stack-4"
            style={{ padding: 14, textAlign: 'left' }}
            onClick={() => setScreen('ranks')}
          >
            <span className="eyebrow accent" style={{ fontSize: 10 }}>
              Rank
            </span>
            <span className="row" style={{ gap: 8 }}>
              <RankBadge rank={board.overall.rank} size={22} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{board.overall.rank?.name ?? 'Unranked'}</span>
            </span>
            <span className="meta">
              {bestGain
                ? `${bestGain.name} +${bestGain.matched.delta} reps at ${bestGain.matched.load} kg`
                : `${board.overall.scored} of ${board.overall.total} muscles scored`}
            </span>
          </button>
        </div>
      </div>

      <div>
        <div className="section-head">
          <span className="h-section">Dig in</span>
        </div>
        <div className="list">
          {[
            ['plan', 'trend', 'Exercises', 'Every lift, session by session'],
            ['strength', 'up', 'Strength & overload', 'Matched-load comparisons and what is ready for more'],
            ['ranks', 'trophy', 'Ranks', 'Where each muscle stands, tier by tier'],
            ['volume', 'body', 'Volume by muscle', 'Sets and tonnage, cycle by cycle'],
            ['load', 'clock', 'Sessions & recovery', 'Duration, tonnage and what the watch saw'],
          ].map(([id, icon, title, detail]) => (
            <button key={id} className="list-row" onClick={() => setScreen(id)}>
              <span className="icon-box">
                <Icon name={icon} size={16} />
              </span>
              <span className="grow">
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{title}</span>
                <span className="meta" style={{ display: 'block' }}>
                  {detail}
                </span>
              </span>
              <Icon name="chevronRight" size={16} style={{ color: 'var(--muted)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
