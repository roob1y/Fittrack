import React from 'react';

// The hexagon badge: tier colour outside, deeper tier colour inside, sub-rank
// numeral on top. Sized by `size`; the numeral scales with it.
export default function RankBadge({ rank, size = 28 }) {
  const tier = rank?.tier;
  const color = tier?.color ?? 'var(--border)';
  const deep = tier?.deep ?? 'var(--surface)';
  const ink = tier?.ink ?? 'var(--muted)';
  return (
    <span className="rank-badge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 84 84" aria-hidden="true">
        <polygon points="42,4 78,24 78,60 42,80 6,60 6,24" fill={color} />
        <polygon points="42,16 67,30 67,54 42,68 17,54 17,30" fill={deep} />
      </svg>
      <span style={{ fontSize: Math.round(size * 0.38), color: ink }}>{rank?.sub ?? '?'}</span>
    </span>
  );
}
