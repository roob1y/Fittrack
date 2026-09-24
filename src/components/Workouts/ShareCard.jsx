import React from 'react';
import RankBadge from '../Ranks/RankBadge';

// The 4:5 share image, as DOM. Rendered off-screen at 540×675 and rasterised at
// 2× by shareRecap() in utils/shareImage.js. Everything is inline so the rasteriser
// does not have to resolve stylesheets; colours are hard-coded rather than tokens
// for the same reason (the card is always dark).
//
// Built for other gym-goers: rank and rank-ups, today's top sets as weight × reps
// with the 30-day change, one lift's labelled top-set bars, the session as a footer.

const C = {
  bg: '#0c0d10',
  card: '#1b1e25',
  border: '#2a2e38',
  text: '#eef0f4',
  text2: '#c4c9d4',
  muted: '#9aa1af',
  bar: '#3a3f4b',
  accent: '#c8f135',
};
const display = {
  fontFamily: "'Archivo', 'Bebas Neue', sans-serif",
  fontVariationSettings: "'wdth' 72",
  fontWeight: 800,
  textTransform: 'uppercase',
  lineHeight: 0.9,
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (s) => (s ? `${parseInt(s.slice(8, 10), 10)} ${MONTHS[parseInt(s.slice(5, 7), 10) - 1]}` : '');
const fmtLong = (s) => {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const tonnage = (kg) => (kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg} kg`);

export default React.forwardRef(function ShareCard({ recap, rank, rankUps, tops, chart, past = false }, ref) {
  const W = 460; // chart width inside 40px padding
  const n = chart?.points?.length ?? 0;
  const gap = 18;
  const bw = n ? Math.min(64, (W - gap * (n - 1)) / n) : 0;
  const x0 = n ? (W - (bw * n + gap * (n - 1))) / 2 : 0;
  const max = n ? Math.max(...chart.points.map((p) => p.weight)) : 1;
  const min = n ? Math.min(...chart.points.map((p) => p.weight)) : 0;
  const floor = Math.max(0, min - (max - min) * 0.6 - max * 0.15);
  const H = 96;
  const y = (v) => 100 - ((v - floor) / (max - floor || 1)) * (H - 26);
  const first = chart?.points?.[0];
  const last = chart?.points?.[n - 1];

  return (
    <div
      ref={ref}
      style={{
        width: 540,
        height: 675,
        boxSizing: 'border-box',
        background: C.bg,
        color: C.text,
        fontFamily: "'Instrument Sans', 'DM Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 40px 30px',
        gap: 18,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            ...display,
            fontVariationSettings: "'wdth' 75",
            fontSize: 18,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          Fit<span style={{ color: C.accent }}>Track</span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
          {recap.day.focus} · {fmtLong(recap.date)} · session {recap.sessionNumber}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <RankBadge rank={rank} size={96} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.muted,
            }}
          >
            Overall rank
          </span>
          <span style={{ ...display, fontSize: 52, fontVariationSettings: "'wdth' 70" }}>
            {rank?.name ?? 'Unranked'}
          </span>
          <span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>
            {rankUps.length
              ? `${rankUps.length} rank-up${rankUps.length === 1 ? '' : 's'} this session · ${rankUps.map((u) => `${u.label} → ${u.to.name}`).join(' · ')}`
              : recap.headline}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.muted,
            }}
          >
            {past ? 'Top sets' : "Today's top sets"}
          </span>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>vs 30 days ago</span>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {tops.map((t, i) => (
            <div
              key={t.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '170px 1fr 92px',
                alignItems: 'center',
                gap: 12,
                padding: '11px 16px',
                borderBottom: i < tops.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.name}
              </span>
              <span
                style={{
                  ...display,
                  fontVariationSettings: "'wdth' 80",
                  fontSize: 24,
                  textTransform: 'none',
                  lineHeight: 1,
                }}
              >
                {t.weight}
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}> kg</span>
                {t.reps != null && <span style={{ fontSize: 16, color: C.text2, fontWeight: 700 }}> × {t.reps}</span>}
              </span>
              <span
                style={{
                  textAlign: 'right',
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.delta > 0 ? C.accent : t.delta < 0 ? C.muted : C.muted,
                }}
              >
                {t.delta == null ? 'new' : t.delta > 0 ? `+${t.delta} kg` : t.delta < 0 ? `${t.delta} kg` : 'held'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {n > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.muted,
              }}
            >
              {chart.name} · top set
            </span>
            {first && last && last.weight !== first.weight && (
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>
                {first.weight} → {last.weight} kg since {fmt(first.date)}
              </span>
            )}
          </div>
          <svg
            width={W}
            height={112}
            viewBox={`0 0 ${W} 112`}
            role="img"
            aria-label={`${chart.name} top set per session`}
          >
            <line x1="0" y1="100" x2={W} y2="100" stroke={C.border} strokeWidth="1" />
            {chart.points.map((p, i) => {
              const x = x0 + i * (bw + gap);
              const top = y(p.weight);
              const isLast = i === n - 1;
              return (
                <g key={p.date}>
                  <rect x={x} y={top} width={bw} height={100 - top} rx="4" fill={isLast ? C.accent : C.bar} />
                  <text
                    x={x + bw / 2}
                    y={top - 7}
                    textAnchor="middle"
                    fontFamily="Archivo, sans-serif"
                    fontSize="14"
                    fontWeight="700"
                    fill={C.text}
                  >
                    {p.weight}
                  </text>
                  {p.reps != null && (
                    <text
                      x={x + bw / 2}
                      y="90"
                      textAnchor="middle"
                      fontFamily="Instrument Sans, sans-serif"
                      fontSize="11"
                      fontWeight="600"
                      fill={isLast ? C.bg : C.text2}
                    >
                      ×{p.reps}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div style={{ position: 'relative', height: 16 }}>
            {chart.points.map((p, i) => (
              <span
                key={p.date}
                style={{
                  position: 'absolute',
                  left: x0 + i * (bw + gap),
                  width: bw,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: i === n - 1 ? C.text : C.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                {fmt(p.date)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${C.border}`,
          paddingTop: 12,
          marginTop: 'auto',
        }}
      >
        <span style={{ fontSize: 12, color: C.muted }}>
          {recap.mins != null ? `${recap.mins} min · ` : ''}
          {recap.sets} sets · {tonnage(recap.tonnage)} lifted · {recap.totalSessions} sessions logged
        </span>
        <span
          style={{
            ...display,
            fontVariationSettings: "'wdth' 75",
            fontSize: 13,
            letterSpacing: '0.06em',
            color: C.muted,
            lineHeight: 1,
          }}
        >
          FitTrack
        </span>
      </div>
    </div>
  );
});
