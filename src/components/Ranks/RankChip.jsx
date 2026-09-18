import React from 'react';
import RankBadge from './RankBadge';
import useRankBoard from '../../hooks/useRankBoard';

// The header chip: overall rank + progress to the next sub-rank. Shown on every
// tab so the level is always one glance away. Tapping opens the Ranks screen.
export default function RankChip({ onClick }) {
  const { board } = useRankBoard();
  const rank = board.overall.rank;
  const label = rank ? rank.name : 'Unranked';
  const progress = rank ? Math.round(rank.progress * 100) : 0;
  return (
    <button className="rank-chip" onClick={onClick} aria-label={`Your rank: ${label}`}>
      <RankBadge rank={rank} size={28} />
      <span className="rank-chip-text">
        <span className="rank-chip-name">{label}</span>
        <span className="bar">
          <i style={{ width: `${progress}%` }} />
        </span>
      </span>
    </button>
  );
}
