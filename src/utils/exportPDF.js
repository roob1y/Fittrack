// exportPDF.js
// Generates a branded PDF report using jsPDF.

import { jsPDF } from 'jspdf';
import { PROGRAM } from '../data/program';

const ACCENT = [200, 241, 53];    // #c8f135
const DARK = [13, 13, 15];        // #0d0d0f
const SURFACE = [22, 22, 26];     // #16161a
const CARD = [30, 30, 36];        // #1e1e24
const BORDER = [42, 42, 53];      // #2a2a35
const TEXT = [240, 240, 245];     // #f0f0f5
const MUTED = [122, 122, 140];    // #7a7a8c
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

function setDrawColor(doc, rgb) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

export function exportPDF(store) {
  const { setData, workoutDates, sessionTimes, weightLog, weightUnit } = store;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  function newPage() {
    doc.addPage();
    y = margin;
    drawPageHeader();
  }

  function checkPageBreak(needed = 10) {
    if (y + needed > pageH - margin) newPage();
  }

  function drawPageHeader() {
    // Top bar
    setFill(doc, DARK);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, ACCENT);
    doc.text('Fit', margin, 8);
    const fitWidth = doc.getTextWidth('Fit');
    setTextColor(doc, WHITE);
    doc.text('TRACK', margin + fitWidth, 8);
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
    // Bottom border
    setDrawColor(doc, BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 6, margin + contentW, y + 6);
    y += 6;
  }

  // ── Cover page ───────────────────────────────────────
  setFill(doc, DARK);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Accent bar
  setFill(doc, ACCENT);
  doc.rect(0, 0, 6, pageH, 'F');

  // Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(52);
  setTextColor(doc, ACCENT);
  doc.text('Fit', 24, 80);
  const fitW = doc.getTextWidth('Fit');
  setTextColor(doc, WHITE);
  doc.text('TRACK', 24 + fitW, 80);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, MUTED);
  doc.text('Workout & Progress Report', 24, 94);

  // Date range
  const allDates = Object.values(workoutDates || {}).filter(Boolean).sort();
  const firstDate = allDates[0]
    ? new Date(allDates[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const lastDate = allDates[allDates.length - 1]
    ? new Date(allDates[allDates.length - 1]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  doc.setFontSize(10);
  setTextColor(doc, TEXT);
  doc.text(`${firstDate} — ${lastDate}`, 24, 106);

  // Stats summary on cover
  let totalWorkouts = 0;
  let totalSets = 0;
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const key = `week${week}_${day.id}`;
      if (!workoutDates?.[key]) continue;
      totalWorkouts++;
      day.exercises.forEach((ex, ei) => {
        for (let si = 0; si < ex.sets; si++) {
          const setKey = `week${week}_${day.id}_${ei}_${si}`;
          if (setData?.[setKey]?.done) totalSets++;
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

  let rowCount = 0;
  for (let week = 1; week <= 52; week++) {
    for (const day of PROGRAM) {
      const dateKey = `week${week}_${day.id}`;
      const date = workoutDates?.[dateKey];
      if (!date) continue;
      day.exercises.forEach((ex, ei) => {
        for (let si = 0; si < ex.sets; si++) {
          const setKey = `week${week}_${day.id}_${ei}_${si}`;
          const saved = setData?.[setKey];
          if (!saved?.done) continue;
          tableRow(
            wCols,
            [date, day.label, day.focus, ex.name, `S${si + 1}`, saved.reps || '—', saved.weight || '—'],
            rowCount % 2 === 1,
          );
          rowCount++;
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
      const key = `week${week}_${day.id}`;
      const date = workoutDates?.[key];
      const mins = sessionTimes?.[key];
      if (!date || mins == null) continue;
      tableRow(sCols, [date, day.label, day.focus, mins], rowCount % 2 === 1);
      rowCount++;
    }
  }

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

  // Save
  doc.save(`fittrack-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
