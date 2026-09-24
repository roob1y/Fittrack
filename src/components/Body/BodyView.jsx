import React, { useEffect, useMemo, useState } from 'react';
import useStore from '../../store/useStore';
import Icon from '../ui/Icon';
import TrendChart from './TrendChart';
import { registerBackButton } from '../../hooks/useBackButton';
import {
  MEASUREMENTS,
  addDays,
  changeTone,
  cmTo,
  cmToFtIn,
  daysBetween,
  fmtDay,
  kgTo,
  lastNDays,
  localToday,
  navyBodyFat,
  parsePositive,
  round1,
  sevenDayAverage,
  seriesFromLog,
  seriesFromMeasurements,
  signed,
  stones,
  toCm,
  toKg,
  weeklyRate,
} from '../../utils/body';

// Body — weight first, then composition, then the tape.
//
// Bodyweight leads because every chin-up effective load and every strength rank
// is computed from it; the tab's main job is to make logging it one tap. Boditrax
// scans sit under it (fat and muscle, which the scale cannot see), and the tape
// measurements track the stated goal: shoulders, arms and chest up, waist down.
//
// Units: weight follows the app-wide unit from Settings. It is NOT toggled here —
// switching it converts every logged set, and only Settings does that safely.
// Measurements have their own cm/in switch, which touches nothing else.

const RANGES = [
  { id: 30, label: '30D' },
  { id: 90, label: '90D' },
  { id: 0, label: 'All' },
];

const HOW = {
  waist: 'At the navel, relaxed, after breathing out.',
  chest: 'Across the nipples, arms down, after breathing out.',
  shoulders: 'Round the widest point of the delts, arms relaxed at your sides.',
  arms: 'Flexed, round the peak of the bicep. Same arm every time.',
  legs: 'Standing, halfway between hip crease and kneecap.',
  hips: 'Round the widest point of the glutes, feet together.',
  neck: 'Just below the Adam’s apple, looking straight ahead.',
};

const toneColor = (tone) => (tone === 'good' ? 'var(--accent)' : tone === 'bad' ? 'var(--down)' : 'var(--text-2)');

// ── Bottom sheet with the app's slide-out ────────────────────────────────────

function Sheet({ title, onClose, children }) {
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 260);
  };
  useEffect(() => registerBackButton(close), []);
  return (
    <>
      <div className="scrim" onClick={close} />
      <div className={`bottom-sheet${closing ? ' closing' : ''}`} role="dialog" aria-label={title}>
        <div className="sheet-handle" />
        <div className="row-between" style={{ marginBottom: 16 }}>
          <span className="h-section">{title}</span>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        {typeof children === 'function' ? children(close) : children}
      </div>
    </>
  );
}

function Field({ id, label, suffix, value, onChange, placeholder, type = 'number' }) {
  return (
    <label htmlFor={id} className="stack stack-4" style={{ minWidth: 0 }}>
      <span className="meta" style={{ fontWeight: 600 }}>
        {label}
      </span>
      <span className="row" style={{ gap: 8 }}>
        <input
          id={id}
          className="input"
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          step="any"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="meta" style={{ minWidth: 26 }}>
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

// ── Weight ───────────────────────────────────────────────────────────────────

function WeightCard() {
  const weightLog = useStore((s) => s.weightLog);
  const unit = useStore((s) => s.weightUnit) === 'lbs' ? 'lbs' : 'kg';
  const goalKg = useStore((s) => s.weightGoalKg);
  const logWeight = useStore((s) => s.logWeight);
  const deleteWeight = useStore((s) => s.deleteWeight);

  const [range, setRange] = useState(90);
  const [input, setInput] = useState('');
  const [justLogged, setJustLogged] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const today = localToday();
  const series = useMemo(() => seriesFromLog(weightLog), [weightLog]);
  const shown = useMemo(() => lastNDays(series, range), [series, range]);
  const latest = series[series.length - 1] ?? null;
  const first = shown[0] ?? null;
  const spanAll = series.length > 1 ? daysBetween(series[0].date, latest.date) : 0;

  const fmtW = (kg) => round1(kgTo(kg, unit)).toFixed(1);
  const delta = latest && first && first.date !== latest.date ? latest.value - first.value : null;
  const deltaTone = changeTone(delta, { goal: goalKg, latest: latest?.value, good: 'down' });
  const rate = weeklyRate(shown);
  const avg = sevenDayAverage(series);
  const sinceLast = latest ? daysBetween(latest.date, today) : null;
  const toGo = goalKg && latest ? latest.value - goalKg : null;

  function handleLog() {
    const v = parsePositive(input);
    if (!v) return;
    const kg = round1(toKg(v, unit));
    if (kg < 25 || kg > 350) return; // a typo, not a bodyweight
    logWeight(today, kg);
    setInput('');
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1600);
  }

  const history = [...series].reverse();
  const historyShown = showAll ? history : history.slice(0, 6);

  return (
    <div className="card card-lg stack stack-12" style={{ padding: '18px 18px 14px' }}>
      <div className="row-between" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="eyebrow">
            Weight{latest ? ` · ${latest.date === today ? 'today' : fmtDay(latest.date)}` : ''}
          </span>
          <span className="display" style={{ fontSize: 56, lineHeight: 1, fontVariationSettings: "'wdth' 75" }}>
            {latest ? fmtW(latest.value) : '—'}
            <span className="meta" style={{ fontSize: 20, fontWeight: 600, marginLeft: 4, textTransform: 'none' }}>
              {unit}
            </span>
          </span>
          {latest && (
            <span className="meta" style={{ fontWeight: 600 }}>
              {stones(latest.value)}
              {avg && ` · 7-day avg ${fmtW(avg.value)}`}
            </span>
          )}
        </div>
        <div className="stack" style={{ gap: 4, textAlign: 'right', paddingTop: 4, flexShrink: 0 }}>
          {delta != null && (
            <span style={{ fontSize: 13, fontWeight: 700, color: toneColor(deltaTone) }}>
              {signed(kgTo(delta, unit))} {unit} since {fmtDay(first.date)}
            </span>
          )}
          {rate != null && (
            <span className="meta">
              {signed(kgTo(rate, unit), 2)} {unit} / week
              {latest && ` · ${Math.abs((rate / latest.value) * 100).toFixed(1)}%`}
            </span>
          )}
          {goalKg ? (
            <span className="meta">
              Goal {fmtW(goalKg)} {unit}
              {toGo != null && Math.abs(toGo) >= 0.05 && ` · ${round1(Math.abs(kgTo(toGo, unit)))} to go`}
            </span>
          ) : null}
        </div>
      </div>

      {shown.length > 1 ? (
        <div className="stack stack-4">
          <TrendChart points={shown} compact height={72} format={(v) => `${fmtW(v)} ${unit}`} />
          <div className="row-between meta" style={{ fontSize: 11, fontWeight: 600 }}>
            <span>{fmtDay(shown[0].date)}</span>
            {spanAll > 30 && (
              <div className="segmented" role="group" aria-label="Chart range">
                {RANGES.map((r) => (
                  <button key={r.id} className={range === r.id ? 'active' : ''} onClick={() => setRange(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            <span>{fmtDay(latest.date)}</span>
          </div>
        </div>
      ) : (
        latest && <span className="meta">One reading so far. The line starts at the second.</span>
      )}

      <div className="row" style={{ gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <label
          htmlFor="weigh-in"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
        >
          Today’s weight in {unit}
        </label>
        <input
          id="weigh-in"
          className="input grow"
          type="number"
          inputMode="decimal"
          step="any"
          placeholder={`Today’s weight (${unit})`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLog()}
        />
        <button
          className="btn btn-primary"
          style={{
            minHeight: 48,
            fontSize: 15,
            padding: '0 18px',
            flexShrink: 0,
            opacity: parsePositive(input) || justLogged ? 1 : 0.45,
          }}
          onClick={handleLog}
          disabled={!parsePositive(input)}
          aria-disabled={!parsePositive(input)}
        >
          {justLogged ? <Icon name="check" size={18} /> : 'Log'}
        </button>
      </div>

      <div className="row-between" style={{ gap: 12 }}>
        <span className="meta" style={{ lineHeight: 1.4 }}>
          {!latest
            ? 'No weigh-ins yet. Chin-up loads and strength ranks are worked out from this number.'
            : sinceLast === 0
              ? 'Logged today. Log again to replace it.'
              : sinceLast >= 3
                ? `Last weigh-in ${sinceLast} days ago. Chin-up loads and ranks use it, so keep it fresh.`
                : `Last weigh-in ${sinceLast === 1 ? 'yesterday' : `${sinceLast} days ago`}.`}
        </span>
        {series.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0, border: 'none', color: 'var(--muted)' }}
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
          >
            History
            <Icon name="chevronDown" size={14} style={{ transform: showHistory ? 'rotate(180deg)' : 'none' }} />
          </button>
        )}
      </div>

      {showHistory && (
        <div className="list" style={{ background: 'var(--surface)' }}>
          {historyShown.map((e, i) => {
            const prev = history[i + 1];
            const d = prev ? e.value - prev.value : null;
            return (
              <div key={e.date} className="list-row" style={{ minHeight: 48, padding: '8px 8px 8px 14px' }}>
                <span className="grow" style={{ fontWeight: 600 }}>
                  {fmtDay(e.date)}
                  <span className="meta" style={{ marginLeft: 6 }}>
                    {e.date.slice(0, 4)}
                  </span>
                </span>
                {d != null && (
                  <span className="meta" style={{ minWidth: 44, textAlign: 'right' }}>
                    {signed(kgTo(d, unit))}
                  </span>
                )}
                <span className="num" style={{ fontSize: 16, minWidth: 64, textAlign: 'right' }}>
                  {fmtW(e.value)} {unit}
                </span>
                <button
                  className="icon-btn"
                  style={{ width: 36, height: 36, background: 'none', border: 'none' }}
                  onClick={() => deleteWeight(e.date)}
                  aria-label={`Delete weigh-in on ${fmtDay(e.date)}`}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            );
          })}
          {history.length > 6 && (
            <button
              className="list-foot"
              style={{ border: 'none', width: '100%' }}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show fewer' : `Show all ${history.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composition (Boditrax) ───────────────────────────────────────────────────

function ScanTile({ value, unit, label, delta, good }) {
  const tone = changeTone(delta, { good });
  return (
    <div className="tile stack stack-4" style={{ minWidth: 0 }}>
      <span className="display" style={{ fontSize: 24, lineHeight: 1, fontVariationSettings: "'wdth' 75" }}>
        {value == null ? '—' : round1(value).toFixed(1)}
        <span className="meta" style={{ fontSize: 12, fontWeight: 600, textTransform: 'none' }}>
          {unit}
        </span>
      </span>
      <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
        {label}
      </span>
      {delta != null && (
        <span style={{ fontSize: 11, fontWeight: 700, color: toneColor(tone) }}>
          {signed(delta)}
          {unit.trim() === '%' ? ' pts' : unit}
        </span>
      )}
    </div>
  );
}

function CompositionSection({ onAddScan }) {
  const bodyScans = useStore((s) => s.bodyScans) ?? {};
  const measurementLog = useStore((s) => s.measurementLog);
  const heightCm = useStore((s) => s.heightCm);
  const gender = useStore((s) => s.gender);

  const scans = Object.entries(bodyScans)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const latest = scans[scans.length - 1];
  const prev = scans[scans.length - 2];
  const d = (k) => (latest?.[k] != null && prev?.[k] != null ? latest[k] - prev[k] : null);
  const fatMass = latest?.weightKg && latest?.fatPct ? (latest.weightKg * latest.fatPct) / 100 : null;

  const navy = navyBodyFat({ gender, heightCm, measurementLog });
  const needList = navy.missing.map((m) => (m === 'height' ? 'your height' : m));
  const need =
    needList.length > 1 ? `${needList.slice(0, -1).join(', ')} and ${needList[needList.length - 1]}` : needList[0];

  return (
    <section className="stack stack-10" aria-labelledby="comp-h">
      <div className="row-baseline" style={{ gap: 8 }}>
        <span id="comp-h" className="h-section">
          Composition
        </span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ border: 'none', color: 'var(--accent)', padding: 0 }}
          onClick={onAddScan}
        >
          <Icon name="plus" size={14} /> Add scan
        </button>
      </div>

      {latest ? (
        <>
          <span className="meta" style={{ fontWeight: 600, marginTop: -4 }}>
            Boditrax · {fmtDay(latest.date)}
            {prev && ` vs ${fmtDay(prev.date)}`} · next due ~{fmtDay(addDays(latest.date, 56))}
          </span>
          <div className="grid-3">
            <ScanTile value={latest.fatPct} unit="%" label="body fat" delta={d('fatPct')} good="down" />
            <ScanTile value={latest.muscleKg} unit=" kg" label="muscle" delta={d('muscleKg')} good="up" />
            <ScanTile value={latest.weightKg} unit=" kg" label="scan weight" delta={d('weightKg')} good="down" />
          </div>
          {fatMass != null && (
            <span className="meta">
              {round1(fatMass)} kg fat · {round1(latest.weightKg - fatMass)} kg everything else
            </span>
          )}
        </>
      ) : (
        <div className="card stack stack-10" style={{ padding: 16 }}>
          <span className="meta-2">
            No scans yet. Add your Boditrax readings to see fat and muscle move, not just the scale.
          </span>
          <button className="btn btn-outline-accent btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onAddScan}>
            <Icon name="plus" size={14} /> Add a scan
          </button>
        </div>
      )}

      <div className="tile-inset row-between" style={{ gap: 12 }}>
        <span className="stack" style={{ gap: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Tape estimate</span>
          <span className="meta" style={{ fontSize: 11 }}>
            {navy.value != null
              ? `US Navy method · tape from ${fmtDay(navy.asOf)}. Between scans, watch the trend, not the number.`
              : `Log ${need || 'waist and neck'} for a body-fat estimate between scans.`}
          </span>
        </span>
        <span className="num" style={{ fontSize: 22, flexShrink: 0 }}>
          {navy.value != null ? `${navy.value}%` : '—'}
        </span>
      </div>
    </section>
  );
}

function ScanSheet({ onClose }) {
  const bodyScans = useStore((s) => s.bodyScans) ?? {};
  const logBodyScan = useStore((s) => s.logBodyScan);
  const deleteBodyScan = useStore((s) => s.deleteBodyScan);
  const [date, setDate] = useState(localToday());
  const [w, setW] = useState('');
  const [fat, setFat] = useState('');
  const [muscle, setMuscle] = useState('');

  const past = Object.keys(bodyScans).sort().reverse();
  const scan = {
    weightKg: parsePositive(w),
    fatPct: parsePositive(fat),
    muscleKg: parsePositive(muscle),
  };
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Object.values(scan).some((v) => v != null) &&
    (scan.fatPct == null || scan.fatPct < 70);

  return (
    <Sheet title="Add a scan" onClose={onClose}>
      {(close) => (
        <div className="stack stack-16">
          <Field id="scan-date" label="Scan date" type="date" value={date} onChange={setDate} />
          <div className="grid-3" style={{ gap: 10 }}>
            <Field id="scan-fat" label="Body fat" suffix="%" value={fat} onChange={setFat} />
            <Field id="scan-muscle" label="Muscle" suffix="kg" value={muscle} onChange={setMuscle} />
            <Field id="scan-w" label="Weight" suffix="kg" value={w} onChange={setW} />
          </div>
          <span className="meta">
            Muscle is the machine’s muscle mass figure, not lean mass. Scans at the same time of day compare best.
          </span>
          <button
            className="btn btn-primary btn-block"
            disabled={!valid}
            style={{ opacity: valid ? 1 : 0.4 }}
            onClick={() => {
              const clean = Object.fromEntries(
                Object.entries(scan)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => [k, round1(v)]),
              );
              logBodyScan(date, { ...(bodyScans[date] ?? {}), ...clean });
              close();
            }}
          >
            Save scan
          </button>

          {past.length > 0 && (
            <div className="stack stack-8">
              <span className="eyebrow">Previous scans</span>
              <div className="list">
                {past.map((dt) => {
                  const s = bodyScans[dt];
                  return (
                    <div key={dt} className="list-row" style={{ minHeight: 48, padding: '8px 8px 8px 14px' }}>
                      <span className="grow" style={{ fontWeight: 600 }}>
                        {fmtDay(dt)} {dt.slice(0, 4)}
                      </span>
                      <span className="meta">
                        {[
                          s.fatPct != null && `${s.fatPct}%`,
                          s.muscleKg != null && `${s.muscleKg} kg`,
                          s.weightKg != null && `${s.weightKg} kg`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      <button
                        className="icon-btn"
                        style={{ width: 36, height: 36, background: 'none', border: 'none' }}
                        onClick={() => deleteBodyScan(dt)}
                        aria-label={`Delete scan from ${fmtDay(dt)}`}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ── Measurements ─────────────────────────────────────────────────────────────

function useMeasurementRows() {
  const measurementLog = useStore((s) => s.measurementLog);
  const goals = useStore((s) => s.measurementGoals) ?? {};
  return MEASUREMENTS.map((m) => {
    const series = seriesFromMeasurements(measurementLog, m.key);
    const latest = series[series.length - 1] ?? null;
    const first = series[0] ?? null;
    const delta = latest && first && first.date !== latest.date ? latest.value - first.value : null;
    const goal = goals[m.key] ?? null;
    return {
      ...m,
      series,
      latest,
      first,
      delta,
      goal,
      tone: changeTone(delta, { goal, latest: latest?.value, good: m.good }),
    };
  });
}

function MeasurementsSection({ onOpen, onLog }) {
  const unit = useStore((s) => s.measurementUnit) === 'in' ? 'in' : 'cm';
  const setUnit = useStore((s) => s.setMeasurementUnit);
  const rows = useMeasurementRows();
  const fmt = (cm) => round1(cmTo(cm, unit)).toFixed(1);
  const lastDate = rows.reduce((acc, r) => (r.latest && (!acc || r.latest.date > acc) ? r.latest.date : acc), null);

  return (
    <section className="stack stack-10" aria-labelledby="meas-h">
      <div className="row-baseline" style={{ gap: 8 }}>
        <span id="meas-h" className="h-section">
          Measurements
        </span>
        <div className="row" style={{ gap: 10 }}>
          <div className="segmented" role="group" aria-label="Measurement unit">
            {['cm', 'in'].map((u) => (
              <button key={u} className={unit === u ? 'active' : ''} onClick={() => setUnit(u)}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>
      {lastDate && (
        <span className="meta" style={{ fontWeight: 600, marginTop: -4 }}>
          Last taped {fmtDay(lastDate)}
          {daysBetween(lastDate, localToday()) >= 14 && ' · every two weeks is plenty'}
        </span>
      )}

      <div className="list">
        {rows.map((r) => (
          <button key={r.key} className="list-row" onClick={() => onOpen(r.key)} aria-label={`${r.label} details`}>
            <span className="grow stack" style={{ gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</span>
              <span className="meta" style={{ fontSize: 11 }}>
                {r.goal != null ? `goal ${fmt(r.goal)} ${unit}` : r.latest ? 'no goal set' : 'not measured yet'}
              </span>
            </span>
            {r.delta != null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: toneColor(r.tone) }}>
                {signed(cmTo(r.delta, unit))}
              </span>
            )}
            <span className="num" style={{ fontSize: 16, minWidth: 64, textAlign: 'right' }}>
              {r.latest ? `${fmt(r.latest.value)}` : '—'}
              <span className="meta" style={{ fontSize: 11, marginLeft: 3 }}>
                {r.latest ? unit : ''}
              </span>
            </span>
            <Icon name="chevronRight" size={16} style={{ color: 'var(--muted)' }} />
          </button>
        ))}
      </div>
      <button className="btn btn-outline-accent btn-block" onClick={onLog}>
        <Icon name="plus" size={16} /> Log measurements
      </button>
    </section>
  );
}

function MeasureSheet({ onClose }) {
  const unit = useStore((s) => s.measurementUnit) === 'in' ? 'in' : 'cm';
  const logMeasurements = useStore((s) => s.logMeasurements);
  const rows = useMeasurementRows();
  const [date, setDate] = useState(localToday());
  const [vals, setVals] = useState({});

  const parsed = Object.fromEntries(
    Object.entries(vals)
      .map(([k, v]) => [k, parsePositive(v)])
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, round1(toCm(v, unit))]),
  );
  const count = Object.keys(parsed).length;
  const valid = count > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <Sheet title="Log measurements" onClose={onClose}>
      {(close) => (
        <div className="stack stack-16">
          <Field id="m-date" label="Date" type="date" value={date} onChange={setDate} />
          <div className="grid-2" style={{ gap: 12 }}>
            {rows.map((r) => (
              <Field
                key={r.key}
                id={`m-${r.key}`}
                label={r.label}
                suffix={unit}
                value={vals[r.key] ?? ''}
                onChange={(v) => setVals((p) => ({ ...p, [r.key]: v }))}
                placeholder={r.latest ? round1(cmTo(r.latest.value, unit)).toFixed(1) : ''}
              />
            ))}
          </div>
          <span className="meta">
            Fill in what you measured; blanks are left alone. Greyed numbers are last time’s.
          </span>
          <button
            className="btn btn-primary btn-block"
            disabled={!valid}
            style={{ opacity: valid ? 1 : 0.4 }}
            onClick={() => {
              logMeasurements(date, parsed);
              close();
            }}
          >
            {count ? `Save ${count} measurement${count === 1 ? '' : 's'}` : 'Save'}
          </button>
        </div>
      )}
    </Sheet>
  );
}

function MeasurementDetail({ mKey, onBack }) {
  const unit = useStore((s) => s.measurementUnit) === 'in' ? 'in' : 'cm';
  const setGoal = useStore((s) => s.setMeasurementGoal);
  const deleteMeasurement = useStore((s) => s.deleteMeasurement);
  const logMeasurement = useStore((s) => s.logMeasurement);
  const row = useMeasurementRows().find((r) => r.key === mKey);
  const [goalInput, setGoalInput] = useState('');
  const [logInput, setLogInput] = useState('');
  const [justLogged, setJustLogged] = useState(false);

  useEffect(() => registerBackButton(onBack), [onBack]);

  if (!row) return null;
  const fmt = (cm) => round1(cmTo(cm, unit)).toFixed(1);
  const pts = row.series.map((p) => ({ date: p.date, value: cmTo(p.value, unit) }));
  const goalU = row.goal != null ? cmTo(row.goal, unit) : null;
  const toGo = row.goal != null && row.latest ? row.goal - row.latest.value : null;
  const history = [...row.series].reverse();
  const today = localToday();
  const loggedToday = row.latest?.date === today ? row.latest : null;

  function handleLog() {
    const v = parsePositive(logInput);
    if (!v) return;
    const cm = round1(toCm(v, unit));
    if (cm < 10 || cm > 250) return; // a typo, not a circumference
    logMeasurement(today, row.key, cm);
    setLogInput('');
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1600);
  }

  return (
    <div className="stack stack-16">
      <div className="row" style={{ gap: 12 }}>
        <button className="icon-btn" onClick={onBack} aria-label="Back to body">
          <Icon name="arrowLeft" size={18} />
        </button>
        <span className="display display-md">{row.label}</span>
      </div>

      <div className="card card-lg stack stack-8" style={{ padding: 16 }}>
        <label htmlFor="m-log-in" className="eyebrow">
          Log today’s {row.label.toLowerCase()} ({unit})
        </label>
        <div className="row" style={{ gap: 8 }}>
          <input
            id="m-log-in"
            className="input grow"
            type="number"
            inputMode="decimal"
            step="any"
            placeholder={row.latest ? `Last: ${fmt(row.latest.value)} ${unit}` : `${row.label} in ${unit}`}
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLog()}
          />
          <button
            className="btn btn-primary"
            style={{
              minHeight: 48,
              fontSize: 15,
              padding: '0 18px',
              flexShrink: 0,
              opacity: parsePositive(logInput) || justLogged ? 1 : 0.45,
            }}
            onClick={handleLog}
            disabled={!parsePositive(logInput)}
          >
            {justLogged ? <Icon name="check" size={18} /> : 'Log'}
          </button>
        </div>
        <span className="meta">
          {loggedToday ? `Logged today: ${fmt(loggedToday.value)} ${unit}. Log again to replace it.` : HOW[row.key]}
        </span>
      </div>

      <div className="grid-3">
        <div className="card stack stack-4" style={{ padding: '14px 12px' }}>
          <span className="num" style={{ fontSize: 24 }}>
            {row.latest ? fmt(row.latest.value) : '—'}
          </span>
          <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
            now ({unit})
          </span>
        </div>
        <div className="card stack stack-4" style={{ padding: '14px 12px' }}>
          <span className="num" style={{ fontSize: 24, color: toneColor(row.tone) }}>
            {row.delta != null ? signed(cmTo(row.delta, unit)) : '—'}
          </span>
          <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
            {row.first && row.delta != null ? `since ${fmtDay(row.first.date)}` : 'change'}
          </span>
        </div>
        <div className="card stack stack-4" style={{ padding: '14px 12px' }}>
          <span className="num" style={{ fontSize: 24 }}>
            {row.goal != null ? fmt(row.goal) : '—'}
          </span>
          <span className="meta" style={{ fontSize: 11, fontWeight: 600 }}>
            {toGo != null && Math.abs(toGo) >= 0.05 ? `goal · ${round1(Math.abs(cmTo(toGo, unit)))} to go` : 'goal'}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 12px 8px' }}>
        {pts.length > 1 ? (
          <TrendChart points={pts} goal={goalU} height={180} format={(v) => round1(v).toString()} />
        ) : (
          <span className="meta" style={{ display: 'block', padding: '18px 4px', textAlign: 'center' }}>
            {pts.length ? 'One reading so far. The line starts at the second.' : 'Not measured yet.'}
          </span>
        )}
      </div>

      <div className="tile-inset stack stack-4">
        <span className="eyebrow">How to measure</span>
        <span className="meta-2">{HOW[row.key]}</span>
      </div>

      <div className="stack stack-8">
        <span className="eyebrow">Goal</span>
        <div className="row" style={{ gap: 8 }}>
          <label
            htmlFor="goal-in"
            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
          >
            {row.label} goal in {unit}
          </label>
          <input
            id="goal-in"
            className="input grow"
            type="number"
            inputMode="decimal"
            step="any"
            placeholder={row.goal != null ? `${fmt(row.goal)} ${unit}` : `Goal in ${unit}`}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
          />
          <button
            className="btn"
            style={{ minHeight: 48, flexShrink: 0 }}
            disabled={!parsePositive(goalInput)}
            onClick={() => {
              setGoal(row.key, round1(toCm(parsePositive(goalInput), unit)));
              setGoalInput('');
            }}
          >
            Set
          </button>
          {row.goal != null && (
            <button
              className="btn btn-ghost"
              style={{ minHeight: 48, flexShrink: 0 }}
              onClick={() => setGoal(row.key, null)}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="stack stack-8">
          <span className="eyebrow">History</span>
          <div className="list">
            {history.map((e, i) => {
              const prev = history[i + 1];
              return (
                <div key={e.date} className="list-row" style={{ minHeight: 48, padding: '8px 8px 8px 14px' }}>
                  <span className="grow" style={{ fontWeight: 600 }}>
                    {fmtDay(e.date)}
                    <span className="meta" style={{ marginLeft: 6 }}>
                      {e.date.slice(0, 4)}
                    </span>
                  </span>
                  {prev && <span className="meta">{signed(cmTo(e.value - prev.value, unit))}</span>}
                  <span className="num" style={{ fontSize: 16, minWidth: 64, textAlign: 'right' }}>
                    {fmt(e.value)} {unit}
                  </span>
                  <button
                    className="icon-btn"
                    style={{ width: 36, height: 36, background: 'none', border: 'none' }}
                    onClick={() => deleteMeasurement(e.date, row.key)}
                    aria-label={`Delete ${row.label} on ${fmtDay(e.date)}`}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────

function ProfileSection() {
  const heightCm = useStore((s) => s.heightCm);
  const setHeight = useStore((s) => s.setHeight);
  const gender = useStore((s) => s.gender);
  const setGender = useStore((s) => s.setGender);
  const goalKg = useStore((s) => s.weightGoalKg);
  const setWeightGoal = useStore((s) => s.setWeightGoal);
  const wUnit = useStore((s) => s.weightUnit) === 'lbs' ? 'lbs' : 'kg';
  const mUnit = useStore((s) => s.measurementUnit) === 'in' ? 'in' : 'cm';

  const [editing, setEditing] = useState(null); // 'height' | 'goal'
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const ftIn = heightCm ? cmToFtIn(heightCm) : null;
  const heightText = heightCm
    ? mUnit === 'in'
      ? `${ftIn.ft} ft ${ftIn.inches} in`
      : `${round1(heightCm)} cm`
    : 'Not set';
  const goalText = goalKg ? `${round1(kgTo(goalKg, wUnit)).toFixed(1)} ${wUnit} · ${stones(goalKg)}` : 'Not set';

  function save() {
    if (editing === 'height') {
      const cm = mUnit === 'in' ? ((parseFloat(a) || 0) * 12 + (parseFloat(b) || 0)) * 2.54 : parsePositive(a);
      if (cm && cm > 100 && cm < 250) setHeight(round1(cm));
    } else if (editing === 'goal') {
      const v = parsePositive(a);
      if (v) setWeightGoal(round1(toKg(v, wUnit)));
    }
    setEditing(null);
    setA('');
    setB('');
  }

  const editRow = (
    <div className="row" style={{ gap: 8, padding: '10px 12px 12px', borderBottom: '1px solid var(--border)' }}>
      {editing === 'height' && mUnit === 'in' ? (
        <>
          <input
            className="input grow"
            type="number"
            inputMode="numeric"
            placeholder="ft"
            aria-label="Feet"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
          <input
            className="input grow"
            type="number"
            inputMode="numeric"
            placeholder="in"
            aria-label="Inches"
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
        </>
      ) : (
        <input
          className="input grow"
          type="number"
          inputMode="decimal"
          step="any"
          aria-label={editing === 'height' ? 'Height in cm' : `Goal weight in ${wUnit}`}
          placeholder={editing === 'height' ? 'cm' : wUnit}
          value={a}
          onChange={(e) => setA(e.target.value)}
        />
      )}
      <button className="btn" style={{ minHeight: 48, flexShrink: 0 }} onClick={save}>
        Save
      </button>
    </div>
  );

  return (
    <section className="stack stack-10" aria-labelledby="prof-h">
      <span id="prof-h" className="h-section">
        Profile
      </span>
      <div className="list">
        <button
          className="list-row"
          onClick={() => setEditing(editing === 'goal' ? null : 'goal')}
          aria-expanded={editing === 'goal'}
        >
          <span className="grow" style={{ fontWeight: 600 }}>
            Goal weight
          </span>
          <span className="meta-2">{goalText}</span>
          <Icon name="note" size={14} style={{ color: 'var(--muted)' }} />
        </button>
        {editing === 'goal' && editRow}
        <button
          className="list-row"
          onClick={() => setEditing(editing === 'height' ? null : 'height')}
          aria-expanded={editing === 'height'}
        >
          <span className="grow" style={{ fontWeight: 600 }}>
            Height
          </span>
          <span className="meta-2">{heightText}</span>
          <Icon name="note" size={14} style={{ color: 'var(--muted)' }} />
        </button>
        {editing === 'height' && editRow}
        <div className="list-row">
          <span className="grow" style={{ fontWeight: 600 }}>
            Sex
          </span>
          <div className="segmented" role="group" aria-label="Sex">
            {['male', 'female'].map((g) => (
              <button
                key={g}
                className={gender === g ? 'active' : ''}
                onClick={() => setGender(g)}
                style={{ textTransform: 'capitalize' }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="meta" style={{ fontSize: 11 }}>
        Height and sex feed the tape estimate. Weight units are changed in Settings.
      </span>
    </section>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function BodyView() {
  const [detail, setDetail] = useState(null);
  const [sheet, setSheet] = useState(null);

  const open = (k) => {
    setDetail(k);
    document.body.scrollTo?.({ top: 0 });
  };

  if (detail) return <MeasurementDetail mKey={detail} onBack={() => setDetail(null)} />;

  return (
    <div className="stack stack-16" style={{ gap: 22 }}>
      <span className="display display-lg">Body</span>
      <WeightCard />
      <CompositionSection onAddScan={() => setSheet('scan')} />
      <MeasurementsSection onOpen={open} onLog={() => setSheet('measure')} />
      <ProfileSection />
      {sheet === 'scan' && <ScanSheet onClose={() => setSheet(null)} />}
      {sheet === 'measure' && <MeasureSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
