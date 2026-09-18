import React, { useCallback, useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import {
  healthAvailable,
  healthPermissions,
  requestHealthAccess,
  openHealthSettings,
  READ_TYPES,
} from '../../plugins/health';
import { syncHealthData, backfillSessionHealth, probeHealthData } from '../../utils/healthSync';

// The diagnostic surface for the Galaxy Fit 3 chain:
//   Fit 3 -> Samsung Health -> Health Connect -> FitTrack
// Four things have to be true and any one of them failing looks identical from
// inside the app — a blank heart rate. So this reports each link separately
// rather than leaving you to guess which one is broken.

const LABELS = {
  heartRate: 'Heart rate',
  sleep: 'Sleep',
  weight: 'Bodyweight',
};

// A row that reads "nothing" forever looks like FitTrack is broken when the gap is
// upstream — that is exactly what happened with resting heart rate, which sat there
// empty for a week before being removed. Where an empty read has a known cause, say
// what it is on the row rather than leaving it to be rediscovered.
const EMPTY_HINTS = {
  weight: "Only appears if a smart scale syncs to Samsung Health. Robbie's does not — enter weights in the Body tab.",
};

export default function HealthConnectPanel() {
  const healthEnabled = useStore((s) => s.healthEnabled);
  const setHealthEnabled = useStore((s) => s.setHealthEnabled);
  const healthLastSync = useStore((s) => s.healthLastSync);

  const [avail, setAvail] = useState(null);
  const [perms, setPerms] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const refresh = useCallback(async () => {
    const a = await healthAvailable();
    setAvail(a);
    setPerms(a?.available ? await healthPermissions() : null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleConnect() {
    setBusy(true);
    setResult(null);
    await requestHealthAccess();
    await refresh();
    setBusy(false);
  }

  const [probe, setProbe] = useState(null);

  async function handleProbe() {
    setBusy(true);
    setResult(null);
    setProbe(await probeHealthData(7));
    setBusy(false);
  }

  async function handleBackfill() {
    setBusy(true);
    setResult(null);
    const r = await backfillSessionHealth();
    setResult(
      r.ok
        ? `Recovered data for ${r.recovered} past session${r.recovered === 1 ? '' : 's'}` +
            (r.estimated ? `, ${r.estimated} with an estimated heart-rate window` : '') +
            (r.tooOld ? `. ${r.tooOld} too old for Health Connect to still hold` : '')
        : r.reason,
    );
    await refresh();
    setBusy(false);
  }

  async function handleSync() {
    setBusy(true);
    setResult(null);
    const r = await syncHealthData();
    setResult(
      r.ok
        ? `Checked ${r.attempted} session${r.attempted === 1 ? '' : 's'}, filled ${r.filled}` +
            (r.weightAdded ? `, added ${r.weightAdded} weight entr${r.weightAdded === 1 ? 'y' : 'ies'}` : '')
        : r.reason,
    );
    await refresh();
    setBusy(false);
  }

  const granted = new Set(perms?.readAuthorized ?? []);
  const row = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: '13px',
  };

  return (
    <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Samsung Health / Health Connect</div>
      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px', lineHeight: 1.5 }}>
        Pulls heart rate, sleep and bodyweight from your Galaxy Fit 3 via Samsung Health. Read only — nothing is written
        back and nothing leaves your phone.
      </div>

      <div style={{ ...row, borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
        <span>Use health data</span>
        <button
          onClick={() => setHealthEnabled(!healthEnabled)}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: `1px solid ${healthEnabled ? 'var(--accent)' : 'var(--border)'}`,
            background: healthEnabled ? 'var(--accent)' : 'none',
            color: healthEnabled ? '#0d0d0f' : 'var(--muted)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {healthEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={row}>
        <span style={{ color: 'var(--muted)' }}>Health Connect</span>
        <span style={{ color: avail?.available ? 'var(--accent)' : 'var(--red)' }}>
          {avail === null ? 'checking…' : avail.available ? 'available' : (avail.reason ?? 'unavailable')}
        </span>
      </div>

      {READ_TYPES.map((t) => (
        <div key={t} style={row}>
          <span style={{ color: 'var(--muted)' }}>{LABELS[t] ?? t}</span>
          <span style={{ color: granted.has(t) ? 'var(--accent)' : 'var(--muted)' }}>
            {granted.has(t) ? 'granted' : 'not granted'}
          </span>
        </div>
      ))}

      <div style={{ ...row, color: 'var(--muted)' }}>
        <span>Last sync</span>
        <span>{healthLastSync ? new Date(healthLastSync).toLocaleString('en-GB') : 'never'}</span>
      </div>

      {result && (
        <div style={{ fontSize: '12px', color: 'var(--accent)', margin: '10px 0', lineHeight: 1.5 }}>{result}</div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={handleConnect}
          disabled={busy || !avail?.available}
          style={btn(true, busy || !avail?.available)}
        >
          {granted.size ? 'REVIEW ACCESS' : 'CONNECT'}
        </button>
        <button onClick={handleSync} disabled={busy || !healthEnabled} style={btn(false, busy || !healthEnabled)}>
          {busy ? 'WORKING…' : 'SYNC NOW'}
        </button>
        <button onClick={openHealthSettings} style={btn(false, false)}>
          OPEN HEALTH CONNECT
        </button>
        <button onClick={handleBackfill} disabled={busy || !healthEnabled} style={btn(false, busy || !healthEnabled)}>
          BACKFILL PAST SESSIONS
        </button>
        <button
          onClick={handleProbe}
          disabled={busy || !avail?.available}
          style={btn(false, busy || !avail?.available)}
        >
          WHAT'S IN HEALTH CONNECT?
        </button>
      </div>

      {probe?.ok && (
        <div
          style={{
            marginTop: '14px',
            padding: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            SAMPLES IN THE LAST {probe.days} DAYS
          </div>
          {Object.entries(probe.found).map(([type, f]) => (
            <div
              key={type}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}
            >
              <span style={{ color: 'var(--muted)' }}>{LABELS[type] ?? type}</span>
              <span style={{ color: f.count > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                {!f.granted
                  ? 'not granted'
                  : f.count === 0
                    ? 'nothing'
                    : `${f.count}${f.capped ? '+' : ''} · latest ${new Date(f.latest).toLocaleDateString('en-GB')}`}
              </span>
            </div>
          ))}
          {Object.entries(probe.found).map(([type, f]) =>
            f.granted && f.count === 0 && EMPTY_HINTS[type] ? (
              <div key={`${type}-hint`} style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
                {EMPTY_HINTS[type]}
              </div>
            ) : null,
          )}
          {Object.values(probe.found).every((f) => f.count === 0) && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', lineHeight: 1.5 }}>
              Health Connect is empty. Samsung Health only writes data recorded <em>after</em> you granted it Health
              Connect access — it does not reliably backfill. Check Samsung Health → Settings → Health Connect, then
              give it a day.
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '14px', lineHeight: 1.6 }}>
        Backfill recovers sleep exactly for sessions logged before this existed. Their heart rate is inferred from the
        session length, since no start time was recorded — those show as hollow points on the Progress graphs. Health
        Connect only keeps about 30 days.
      </div>

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', lineHeight: 1.6 }}>
        Nothing showing? Samsung Health needs its own Health Connect permission — open Samsung Health → Settings →
        Health Connect and allow it there too. That link is separate from the one above and is the usual culprit.
      </div>
    </div>
  );
}

function btn(primary, disabled) {
  return {
    flex: '1 1 auto',
    padding: '12px',
    background: primary && !disabled ? 'var(--accent)' : 'none',
    border: `1px solid ${primary && !disabled ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '15px',
    letterSpacing: '1px',
    color: primary && !disabled ? '#0d0d0f' : 'var(--muted)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
