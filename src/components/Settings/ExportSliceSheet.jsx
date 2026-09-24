// The picker behind "One session" and "One exercise" in Settings → Export Data.
// Tap a row and the CSV goes straight to the share sheet; nothing to confirm.
//
// Portalled to <body> because Settings itself lives inside a `.bottom-sheet`,
// whose transform makes it the containing block for any `position: fixed`
// child — a sheet rendered in place would be pinned inside the scrolling
// settings panel rather than the screen.

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon';
import { PROGRAMMES } from '../../data/program';
import { sessionDates, exerciseFamilies } from '../../utils/csvSlices';
import { exportSessionCSV, exportExerciseCSV } from '../../utils/exportSlices';
import { fmtDay } from '../../utils/body';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekday = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00`).getDay()];

export default function ExportSliceSheet({ kind, state, onClose }) {
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 260);
  };

  const id = state.activeProgrammeId;
  const days = PROGRAMMES[id]?.days;
  const slice = state.programmeData?.[id];

  const dates = useMemo(() => (kind === 'session' ? sessionDates(days, slice) : []), [kind, days, slice]);
  const families = useMemo(() => (kind === 'exercise' ? exerciseFamilies(days) : []), [kind, days]);

  // Exercises grouped under the day they first appear on, in programme order.
  const byFocus = useMemo(() => {
    const out = new Map();
    for (const f of families) {
      if (!out.has(f.focus)) out.set(f.focus, []);
      out.get(f.focus).push(f);
    }
    return [...out.entries()];
  }, [families]);

  const pick = (fn) => {
    fn();
    close();
  };

  const title = kind === 'session' ? 'Export one session' : 'Export one exercise';

  return createPortal(
    <>
      <div className="scrim" style={{ zIndex: 110 }} onClick={close} />
      <div
        className={`bottom-sheet${closing ? ' closing' : ''}`}
        style={{ zIndex: 120 }}
        role="dialog"
        aria-label={title}
      >
        <div className="sheet-handle" />
        <div className="row-between" style={{ marginBottom: 6 }}>
          <span className="h-section">{title}</span>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="meta" style={{ marginBottom: 14 }}>
          {kind === 'session'
            ? 'Every set logged that day, with your notes and the session time.'
            : 'Every session of it in date order. Both machines of a ⇄ pair, and both days where it appears twice.'}
        </div>

        {kind === 'session' &&
          (dates.length ? (
            <div className="list">
              {dates.map(({ date, sessions }) => (
                <button
                  key={date}
                  className="list-row"
                  onClick={() => pick(() => exportSessionCSV(state, date))}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {weekday(date)} {fmtDay(date)}
                    </div>
                    <div className="meta">
                      {sessions
                        .map((s) => {
                          const mins = slice?.sessionTimes?.[s.key];
                          return `${s.day.focus}${mins != null ? ` · ${mins} min` : ''}`;
                        })
                        .join('  +  ')}
                    </div>
                  </div>
                  <Icon name="share" size={16} />
                </button>
              ))}
            </div>
          ) : (
            <div className="meta">No completed sessions yet.</div>
          ))}

        {kind === 'exercise' &&
          byFocus.map(([focus, fams]) => (
            <div key={focus} style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                {focus}
              </div>
              <div className="list">
                {fams.map((f) => (
                  <button
                    key={f.id}
                    className="list-row"
                    onClick={() => pick(() => exportExerciseCSV(state, f.id))}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{f.label}</div>
                      {f.days.length > 1 && <div className="meta">{f.days.join(' + ')}</div>}
                    </div>
                    <Icon name="share" size={16} />
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>,
    document.body,
  );
}
