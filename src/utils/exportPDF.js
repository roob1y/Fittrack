import { setKey, exerciseNoteKey, dayKey } from './setKeys';
import { buildDataNotes } from './exportFlags';
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { PROGRAMMES } from '../data/program';
import { Share } from '@capacitor/share';

const ACCENT = [200, 241, 53];
const DARK = [13, 13, 15];
const SURFACE = [22, 22, 26];
const CARD = [30, 30, 36];
const TEXT = [240, 240, 245];
const MUTED = [122, 122, 140];
const WHITE = [255, 255, 255];

function convertWeight(kg, unit) {
  if (unit === 'lbs') return Math.round(kg * 2.2046 * 10) / 10;
  return Math.round(kg * 10) / 10;
}
function setFill(doc, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setTextColor(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function showToast(msg) {
  const existing = document.getElementById('export-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'export-toast';
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1e1e24',
    color: '#f0f0f5',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: '9999',
    border: '1px solid #2a2a35',
    whiteSpace: 'normal',
    textAlign: 'center',
    maxWidth: '280px',
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

export async function exportPDF(store) {
  const activeProgrammeId = store.activeProgrammeId;
  const PROGRAM = PROGRAMMES[activeProgrammeId]?.days ?? [];
  const slice = store.programmeData?.[activeProgrammeId] ?? {};
  const { weightLog, weightUnit } = store;
  const { setData, workoutDates, sessionTimes, notes, exerciseNotes } = slice;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210,
    pageH = 297,
    margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  function newPage() {
    doc.addPage();
    setFill(doc, DARK);
    doc.rect(0, 0, pageW, pageH, 'F');
    y = margin;
    drawPageHeader();
  }

  function checkPageBreak(needed = 10) {
    if (y + needed > pageH - margin) newPage();
  }

  function drawPageHeader() {
    setFill(doc, DARK);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, ACCENT);
    doc.text('Fit', margin, 8);
    const fitW = doc.getTextWidth('Fit');
    setTextColor(doc, WHITE);
    doc.text('TRACK', margin + fitW, 8);
    setTextColor(doc, MUTED);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exported ${new Date().toLocaleDateString('en-GB')}`, pageW - margin, 8, { align: 'right' });
  }

  function sectionTitle(title) {
    checkPageBreak(16);
    y += 6;
    setFill(doc, SURFACE);
    doc.rect(margin, y, contentW, 9, 'F');
    setFill(doc, ACCENT);
    doc.rect(margin, y, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, ACCENT);
    doc.text(title, margin + 7, y + 6.2);
    y += 13;
  }

  function tableHeader(cols) {
    checkPageBreak(8);
    setFill(doc, CARD);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setTextColor(doc, MUTED);
    let x = margin + 3;
    cols.forEach(({ label, width }) => {
      doc.text(label.toUpperCase(), x, y + 4.8);
      x += width;
    });
    y += 7;
  }

  // A note under the row it belongs to. The history table has no room for a note
  // column at A4 width, and a cramped one would be less readable than this, not more.
  function noteLine(text, indent = 6) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    setTextColor(doc, ACCENT);
    const wrapped = doc.splitTextToSize(String(text), contentW - indent - 6);
    for (const line of wrapped) {
      checkPageBreak(5);
      doc.text(line, margin + indent, y + 3.6);
      y += 4.4;
    }
    y += 1.2;
  }

  function tableRow(cols, values, isAlt) {
    checkPageBreak(6.5);
    if (isAlt) {
      setFill(doc, [18, 18, 22]);
      doc.rect(margin, y, contentW, 6, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTextColor(doc, TEXT);
    let x = margin + 3;
    cols.forEach(({ width }, i) => {
      doc.text(String(values[i] ?? ''), x, y + 4.2);
      x += width;
    });
    y += 6;
  }

  // ── Cover page ───────────────────────────────────────
  setFill(doc, DARK);
  doc.rect(0, 0, pageW, pageH, 'F');
  drawPageHeader();

  setFill(doc, ACCENT);
  doc.rect(0, 60, pageW, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  setTextColor(doc, ACCENT);
  doc.text('Fit', margin, 52);
  const fw = doc.getTextWidth('Fit');
  setTextColor(doc, WHITE);
  doc.text('TRACK', margin + fw, 52);
  doc.setFontSize(13);
  setTextColor(doc, MUTED);
  doc.text('WORKOUT REPORT', margin, 58);

  // Stats
  let totalWorkouts = 0,
    totalSets = 0;
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const key = dayKey(week, day.id);
      if (!workoutDates?.[key]) continue;
      totalWorkouts++;
      day.exercises.forEach((ex) => {
        for (let si = 0; si < ex.sets; si++) {
          if (setData?.[setKey(week, day.id, ex, si)]?.done) totalSets++;
        }
      });
    }
  }

  const stats = [
    { label: 'Workouts', value: totalWorkouts },
    { label: 'Sets logged', value: totalSets },
    { label: 'Weights logged', value: Object.keys(weightLog || {}).length },
  ];

  let sx = 24;
  stats.forEach(({ label, value }) => {
    setFill(doc, SURFACE);
    doc.roundedRect(sx, 124, 50, 28, 3, 3, 'F');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    setTextColor(doc, ACCENT);
    doc.text(String(value), sx + 8, 140);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, MUTED);
    doc.text(label, sx + 8, 147);
    sx += 56;
  });

  // ── Page 2+ ──────────────────────────────────────────
  doc.addPage();
  setFill(doc, DARK);
  doc.rect(0, 0, pageW, pageH, 'F');
  y = margin;
  drawPageHeader();
  y = 18;

  // ── Workout History ──────────────────────────────────
  sectionTitle('WORKOUT HISTORY');

  const wCols = [
    { label: 'Date', width: 24 },
    { label: 'Day', width: 16 },
    { label: 'Focus', width: 36 },
    { label: 'Exercise', width: 50 },
    { label: 'Set', width: 10 },
    { label: 'Reps', width: 14 },
    { label: 'kg', width: 18 },
  ];
  tableHeader(wCols);

  const placedNotes = new Set();
  let rowCount = 0;
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const dateKey = dayKey(week, day.id);
      const date = workoutDates?.[dateKey];
      if (!date) continue;
      let sessionNoteDrawn = false;
      day.exercises.forEach((ex) => {
        const repTargets = ex.reps.split('/');
        let exNoteDrawn = false;
        for (let si = 0; si < ex.sets; si++) {
          const key = setKey(week, day.id, ex, si);
          const saved = setData?.[key];
          if (!saved?.done) continue;

          const sessNote = notes?.[dateKey];
          if (sessNote && !sessionNoteDrawn) {
            noteLine(`${date} — ${sessNote}`, 3);
            placedNotes.add(dateKey);
            sessionNoteDrawn = true;
          }

          const repTarget = repTargets[si] ?? repTargets[repTargets.length - 1] ?? ex.reps;
          const displayReps = saved.reps || repTarget || '—';
          const displayWeight = saved.weight || (ex.defaultWeight != null ? ex.defaultWeight : '—');
          tableRow(
            wCols,
            [date, day.label, day.focus, ex.name, `S${si + 1}`, displayReps, displayWeight],
            rowCount % 2 === 1,
          );
          rowCount++;

          const nKey = exerciseNoteKey(week, day.id, ex);
          if (exerciseNotes?.[nKey] && !exNoteDrawn) {
            noteLine(exerciseNotes[nKey]);
            placedNotes.add(nKey);
            exNoteDrawn = true;
          }
        }
      });
    }
  }

  // ── Session Times ────────────────────────────────────
  sectionTitle('SESSION TIMES');

  const sCols = [
    { label: 'Date', width: 30 },
    { label: 'Day', width: 20 },
    { label: 'Focus', width: 80 },
    { label: 'Duration (mins)', width: 48 },
  ];
  tableHeader(sCols);

  rowCount = 0;
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const key = dayKey(week, day.id);
      const date = workoutDates?.[key];
      const mins = sessionTimes?.[key];
      if (!date || mins == null) continue;
      tableRow(sCols, [date, day.label, day.focus, mins], rowCount % 2 === 1);
      rowCount++;
    }
  }

  // ── Notes that had no row to sit on ──────────────────
  const orphanNotes = [];
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const dKey = dayKey(week, day.id);
      const date = workoutDates?.[dKey];
      if (!date) continue;
      if (notes?.[dKey] && !placedNotes.has(dKey)) orphanNotes.push([date, '(whole session)', notes[dKey]]);
      for (const ex of day.exercises) {
        const nKey = exerciseNoteKey(week, day.id, ex);
        if (exerciseNotes?.[nKey] && !placedNotes.has(nKey)) orphanNotes.push([date, ex.name, exerciseNotes[nKey]]);
      }
    }
  }

  if (orphanNotes.length) {
    sectionTitle('NOTES WITH NO LOGGED SETS');
    const oCols = [
      { label: 'Date', width: 26 },
      { label: 'Exercise', width: 52 },
      { label: 'Note', width: 100 },
    ];
    tableHeader(oCols);
    rowCount = 0;
    for (const o of orphanNotes) {
      tableRow(oCols, o, rowCount % 2 === 1);
      rowCount++;
    }
  }

  // ── Data notes ───────────────────────────────────────
  sectionTitle('DATA NOTES (GENERATED)');

  const dCols = [
    { label: 'Date', width: 26 },
    { label: 'Exercise', width: 48 },
    { label: 'Observation', width: 104 },
  ];
  tableHeader(dCols);

  rowCount = 0;
  const dataNotes = buildDataNotes(PROGRAM, setData, workoutDates);
  for (const n of dataNotes) {
    tableRow(dCols, [n.date, n.exercise, n.flag], rowCount % 2 === 1);
    rowCount++;
  }
  if (rowCount === 0) tableRow(dCols, ['—', 'Nothing flagged', ''], false);

  // ── Body Weight ──────────────────────────────────────
  sectionTitle(`BODY WEIGHT LOG (${weightUnit.toUpperCase()})`);

  const bCols = [
    { label: 'Date', width: 50 },
    { label: `Weight (${weightUnit})`, width: 50 },
  ];
  tableHeader(bCols);

  rowCount = 0;
  const sortedDates = Object.keys(weightLog || {}).sort();
  for (const date of sortedDates) {
    tableRow(bCols, [date, convertWeight(weightLog[date], weightUnit)], rowCount % 2 === 1);
    rowCount++;
  }

  // ── Save ─────────────────────────────────────────────
  const filename = `fittrack-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      await Filesystem.writeFile({
        path: filename,
        data: pdfBase64,
        directory: Directory.Cache,
      });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      await Share.share({ title: filename, url: uri, dialogTitle: 'Save or share your report' });
    } catch (e) {
      showToast('Export failed — storage permission may be needed');
      console.error('PDF export error:', e);
    }
  } else {
    doc.save(filename);
  }
}
