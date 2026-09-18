import React from 'react';
import useStore from '../../store/useStore';
import { RANGES, DEFAULT_RANGE } from '../../utils/dateRange';

// The calendar-range chips, shared by every Progress screen so they cannot drift
// apart. The choice lives in the store rather than in each screen's state: moving
// from the session table to a strength graph and finding the range had reset to
// "all" would be its own small annoyance.
export default function RangeFilter({ note }) {
  const range = useStore((s) => s.progressRange ?? DEFAULT_RANGE);
  const setProgressRange = useStore((s) => s.setProgressRange);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setProgressRange(r.id)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: r.id === range ? 'var(--accent)' : 'var(--border)',
              background: r.id === range ? 'var(--accent)' : 'transparent',
              color: r.id === range ? '#0d0d0f' : 'var(--muted)',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      {note && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>{note}</div>}
    </div>
  );
}
