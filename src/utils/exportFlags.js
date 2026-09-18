// ══════════════════════════════════════════
//  exportFlags.js
//  Gaps the export can spot on its own.
// ══════════════════════════════════════════
//
// An export that carries only what was logged tells an incomplete story, and the
// missing parts are the ones nobody remembers to mention: the exercise that got
// skipped, the set ticked without reps, the dumbbell entry that is half what it
// should be. None of these error at the time — they quietly make the numbers mean
// something other than what they appear to.
//
// Every flag is a statement about the DATA, never about the training. It says
// "no sets logged", not "you skipped this": the log cannot tell a skipped exercise
// from one that was done and not recorded, and pretending otherwise would be its
// own kind of lie.
//
// Flags are collapsed to one line per exercise per problem. A per-set flag repeated
// four times is how a useful signal turns into something you scroll past.

import { setKey, dayKey } from './setKeys';
import { atCeiling } from './increments';

// `reps` is per-set and slash-separated: '8-12/8-12/8-12', '15/12/12', or a bare
// '12-15' applying to every set. Returns [lo, hi] or null.
function repTargetForSet(repsField, setIndex) {
  const parts = String(repsField ?? '').split('/');
  const part = (parts[setIndex] ?? parts[parts.length - 1] ?? '').trim();
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(part);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = /^(\d+)$/.exec(part);
  if (single) return [Number(single[1]), Number(single[1])];
  return null;
}

const isDumbbell = (ex) => (ex.equipment ?? []).some((e) => /dumbbell/i.test(e));
// An optional finisher that was not done is a choice, not a gap.
const isOptional = (ex) => /optional/i.test(ex.name ?? '');

// [0,1,2] -> "1-3";  [1,2] -> "2-3";  [0,2] -> "1, 3";  [0] -> "1"
function fmtSets(indices) {
  const n = [...indices].map((i) => i + 1).sort((a, b) => a - b);
  if (n.length === 1) return `Set ${n[0]}`;
  const contiguous = n.every((v, i) => i === 0 || v === n[i - 1] + 1);
  return contiguous ? `Sets ${n[0]}-${n[n.length - 1]}` : `Sets ${n.join(', ')}`;
}

const uniq = (xs) => [...new Set(xs)];

// The top load of the MOST RECENT session before `week`, or 0 if there was none.
//
// ⚠ Two earlier anchors for this check were wrong, in opposite directions.
// `defaultWeight` (bug 15) drifted upward as the programme was tuned and silently
// un-flagged old entries. Its replacement, the median of everything ever logged,
// could be moved by the suspect data itself — three halved sets in a thirteen-value
// history shifted it enough to miss them — and it also sat below the current
// working load, so a genuine 8 kg against a usual 16 scored 0.57 and fell outside
// the band. An anchor must be recent AND untouchable by the entry under test.
//
// This is the right reference for a halved entry because a per-hand slip halves
// what he is lifting NOW. An all-time median sits below the current working load —
// it still carries the 12 kg lateral raises from three weeks ago — so a genuine
// 8 kg mis-entry against a usual 16 scored 0.57 and slipped past the 0.45-0.55
// band entirely. The last session's load puts it at exactly 0.50.
function lastTopLoad(PROGRAM, setData, workoutDates, ex, week) {
  for (let w = week - 1; w >= 1; w--) {
    let top = 0;
    for (const day of PROGRAM) {
      if (!workoutDates?.[dayKey(w, day.id)]) continue;
      if (!(day.exercises ?? []).some((e) => e === ex)) continue;
      for (let si = 0; si < ex.sets; si++) {
        const saved = setData?.[setKey(w, day.id, ex, si)];
        const v = Number(saved?.weight);
        if (saved?.done && v > top) top = v;
      }
    }
    if (top > 0) return top;
  }
  return 0;
}

// Returns [{ date, day, focus, exercise, flag }], oldest first.
export function buildDataNotes(PROGRAM, setData, workoutDates, maxWeeks = 52) {
  const out = [];

  for (let week = 1; week <= maxWeeks; week++) {
    for (const day of PROGRAM) {
      const date = workoutDates?.[dayKey(week, day.id)];
      if (!date) continue; // never trained — nothing to say about it

      const add = (exercise, flag) => out.push({ date, day: day.label, focus: day.focus, exercise, flag });

      for (const ex of day.exercises ?? []) {
        const done = [];
        for (let si = 0; si < ex.sets; si++) {
          const saved = setData?.[setKey(week, day.id, ex, si)];
          if (saved?.done) done.push({ si, ...saved });
        }

        if (done.length === 0) {
          if (isOptional(ex)) continue;
          // Entries sharing a `slot` are ONE choice — the two leg presses, the two
          // Romanian deadlifts — so logging one is not skipping the other, and
          // skipping the movement is one omission rather than one per machine.
          // Reporting per entry put two "no sets logged" rows on 22 Aug for a
          // single RDL that was not in the programme yet.
          if (ex.slot) {
            const peers = (day.exercises ?? []).filter((e) => e.slot === ex.slot);
            const anyDone = peers.some((p) =>
              Array.from({ length: p.sets }, (_, s) => setData?.[setKey(week, day.id, p, s)]).some((d) => d?.done),
            );
            if (anyDone) continue;
            if (peers[0] !== ex) continue; // the slot has already reported itself
            add(peers.map((p) => p.name).join(' / '), `No sets logged (programme expects ${ex.sets} on either)`);
            continue;
          }
          add(ex.name, `No sets logged (programme expects ${ex.sets})`);
          continue;
        }
        if (done.length < ex.sets) add(ex.name, `Only ${done.length} of ${ex.sets} sets logged`);

        // ── Ticked but incomplete ──
        const noReps = done.filter((d) => !String(d.reps ?? '').trim()).map((d) => d.si);
        if (noReps.length) add(ex.name, `${fmtSets(noReps)} marked done with no reps recorded`);

        // Bodyweight movements have nothing to record, so only ask where a weight is expected.
        if ((ex.equipment ?? []).length > 0) {
          const noWeight = done.filter((d) => !String(d.weight ?? '').trim()).map((d) => d.si);
          if (noWeight.length) add(ex.name, `${fmtSets(noWeight)} marked done with no weight recorded`);
        }

        // ── Every set at or above the top of its range → the load is too light ──
        //
        // Only sets at the session's HEAVIEST load count, and the load has to have
        // been carried for every programmed set. Both were missing, and together
        // they read 17 @ 120 kg, 13 @ 130 and 12 @ 130 as "all 3 sets at the top of
        // the 8-12 range — due a weight increase" when the work at 130 was two sets,
        // and the 17 was a ramp at a lighter weight entirely. Same fault the
        // in-app suggestion had; fixed in increments.js at the same time.
        const withReps = done.filter((d) => Number(d.reps) > 0);
        const loaded = withReps.filter((d) => Number(d.weight) > 0);
        const bodyweight = (ex.equipment ?? []).length === 0;
        const scored = bodyweight ? withReps : loaded;
        const topLoad = loaded.length ? Math.max(...loaded.map((d) => Number(d.weight))) : null;
        const atTop = bodyweight ? scored : scored.filter((d) => Number(d.weight) === topLoad);
        // At an equipment ceiling (`maxWeight`) there is no increase to be due, and a
        // flag repeated every session for something that cannot change is noise — the
        // crunches said "due a weight increase" at 20 kg four sessions running.
        if (atTop.length >= 2 && atTop.length >= ex.sets && !(topLoad && atCeiling(ex, topLoad))) {
          const targets = atTop.map((d) => repTargetForSet(ex.reps, d.si));
          if (targets.every((t, i) => t && Number(atTop[i].reps) >= t[1])) {
            add(
              ex.name,
              `All ${atTop.length} sets at or above the top of the ${targets[0][0]}-${targets[0][1]} range` +
                (topLoad ? ` at ${topLoad} kg` : '') +
                ` — due a weight increase`,
            );
          }
        }

        // ── Dumbbell entry sitting at half the load he was lifting last time ──
        // Dumbbell weights are PAIR TOTALS, so a set at almost exactly half is very
        // likely a per-hand entry. See lastTopLoad above for why the reference is
        // the previous session rather than a median or a programme default.
        if (isDumbbell(ex)) {
          // A per-hand entry is a step DOWN from the load he was already lifting —
          // progressive overload does not halve — so the reference is the previous
          // session's top load, and the ratio means nothing without one.
          //
          // The cost is that the FIRST session of an exercise can never be checked
          // this way. That is the honest gap: with nothing before it, the ratio
          // cannot tell a mis-entry from a weight he had not worked up to yet. It
          // is what flagged 28 Aug's perfectly good 10 kg crunches as half of a
          // 20 kg he would not reach for another fortnight — the third time a
          // drifting reference has quietly lost its meaning (see bugs 15 and 24).
          const typical = lastTopLoad(PROGRAM, setData, workoutDates, ex, week);
          if (typical > 0) {
            const half = done.filter((d) => {
              const r = Number(d.weight) / typical;
              return Number(d.weight) > 0 && r >= 0.45 && r <= 0.55;
            });
            if (half.length) {
              const ws = uniq(half.map((d) => Number(d.weight))).sort((a, b) => a - b);
              const shown = ws.length === 1 ? `${ws[0]}` : `${ws[0]}-${ws[ws.length - 1]}`;
              add(
                ex.name,
                `${fmtSets(half.map((d) => d.si))} logged ${shown} against ${typical} last session — looks like a per-hand entry`,
              );
            }
          }
        }
      }
    }
  }

  return out;
}
