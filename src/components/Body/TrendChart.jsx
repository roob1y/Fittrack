import React, { useLayoutEffect, useRef, useState } from 'react';
import { dayMs, fmtDay } from '../../utils/body';

// A line over time for the Body tab. Points are placed by DATE, not by index —
// weigh-ins are irregular (25 Aug, then 11 Sep), and evenly spaced dots would
// draw a two-week gap the same width as a day.
//
// Drawn in real pixels (width measured) so text and strokes never stretch.
// `compact` is the hero sparkline: no gridlines, end labels only.

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function niceTicks(min, max, count = 3) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

export default function TrendChart({ points, goal = null, height = 160, compact = false, label, format = (v) => v }) {
  const [ref, width] = useWidth();

  const pad = compact ? { t: 10, r: 8, b: 8, l: 8 } : { t: 12, r: 12, b: 26, l: 36 };
  const values = points.map((p) => p.value);
  const withGoal = goal != null && !compact ? [...values, goal] : values;
  let min = Math.min(...withGoal);
  let max = Math.max(...withGoal);
  if (max - min < 1) {
    min -= 0.5;
    max += 0.5;
  }
  const ticks = compact ? [] : niceTicks(min, max);
  if (ticks.length) {
    min = Math.min(min, ticks[0]);
    max = Math.max(max, ticks[ticks.length - 1]);
  } else {
    const slack = (max - min) * 0.12;
    min -= slack;
    max += slack;
  }

  const t0 = points.length ? dayMs(points[0].date) : 0;
  const t1 = points.length ? dayMs(points[points.length - 1].date) : 1;
  const innerW = Math.max(0, width - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;
  const x = (d) => (t1 === t0 ? pad.l + innerW / 2 : pad.l + ((dayMs(d) - t0) / (t1 - t0)) * innerW);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * innerH;

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area =
    points.length > 1
      ? `${path} L${x(points[points.length - 1].date).toFixed(1)},${pad.t + innerH} L${x(points[0].date).toFixed(1)},${pad.t + innerH} Z`
      : '';
  const last = points[points.length - 1];
  const gradId = `tc-${compact ? 'c' : 'f'}-${height}`;

  const aria =
    label ??
    (points.length
      ? `${points.length} readings, ${fmtDay(points[0].date)} to ${fmtDay(last.date)}: ${format(points[0].value)} to ${format(last.value)}`
      : 'No readings yet');

  return (
    <div ref={ref} style={{ width: '100%' }}>
      {width > 0 && points.length > 0 && (
        <svg width={width} height={height} role="img" aria-label={aria} style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
              <text
                x={pad.l - 6}
                y={y(t) + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--muted)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {format(t)}
              </text>
            </g>
          ))}

          {goal != null && !compact && (
            <g>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y(goal)}
                y2={y(goal)}
                stroke="var(--text-2)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={width - pad.r}
                y={y(goal) - 6}
                textAnchor="end"
                fontSize="11"
                fontWeight="700"
                fill="var(--text-2)"
              >
                Goal {format(goal)}
              </text>
            </g>
          )}

          {area && <path d={area} fill={`url(#${gradId})`} />}
          {points.length > 1 && (
            <path
              d={path}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={compact ? 2 : 2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {!compact &&
            points.map((p) => <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r="3" fill="var(--accent)" />)}
          <circle
            cx={x(last.date)}
            cy={y(last.value)}
            r="4.5"
            fill="var(--accent)"
            stroke="var(--card)"
            strokeWidth="2"
          />

          {!compact && (
            <>
              <text x={pad.l} y={height - 6} fontSize="11" fill="var(--muted)" textAnchor="start">
                {fmtDay(points[0].date)}
              </text>
              {points.length > 1 && (
                <text x={width - pad.r} y={height - 6} fontSize="11" fill="var(--muted)" textAnchor="end">
                  {fmtDay(last.date)}
                </text>
              )}
            </>
          )}
        </svg>
      )}
    </div>
  );
}
