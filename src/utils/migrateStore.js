import { PROGRAMMES } from '../data/program';
import { exerciseKeyPart, setKey, dayKey, exerciseNoteKey } from './setKeys';
import { isAssisted, assistFromEffective, effectiveFromAssist } from './loads';
import { bodyweightAt } from './loads';
import { emptyProgrammeData } from '../store/shape';

// Set once the migration has actually run, so the store can shout if it is
// created first. Ordering this wrong is invisible at runtime otherwise.
export let migrationsHaveRun = false;

export function migrateStoreIfNeeded() {
  migrationsHaveRun = true;
  try {
    const raw = localStorage.getItem('fittrack-store');
    if (!raw) return; // fresh install, nothing to migrate

    const stored = JSON.parse(raw);
    const state = stored?.state;
    if (!state) return;

    // Already migrated — has the new shape
    if (state.programmeData) {
      runPostShapeMigrations(stored, state);
      return;
    }

    console.log('[FitTrack] Migrating store from v1 to v2...');

    // Pull all legacy flat keys
    const slice = {
      completedDays: state.completedDays ?? {},
      skippedDays: state.skippedDays ?? {},
      setData: state.setData ?? {},
      notes: state.notes ?? {},
      exerciseNotes: state.exerciseNotes ?? {},
      sessionTimes: state.sessionTimes ?? {},
      workoutDates: state.workoutDates ?? {},
      programmeStartDate: state.programmeStartDate ?? null,
    };

    // Build new shape
    state.activeProgrammeId = '5day';
    state.programmeData = {
      '5day': slice,
      ppl: {
        completedDays: {},
        skippedDays: {},
        setData: {},
        notes: {},
        exerciseNotes: {},
        sessionTimes: {},
        workoutDates: {},
        programmeStartDate: null,
      },
    };

    // Remove old flat keys — they're now inside programmeData
    const legacyKeys = [
      'completedDays',
      'skippedDays',
      'setData',
      'notes',
      'exerciseNotes',
      'sessionTimes',
      'workoutDates',
      'programmeStartDate',
    ];
    legacyKeys.forEach((k) => delete state[k]);

    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));

    console.log('[FitTrack] Store migration complete.');

    runPostShapeMigrations(stored, state);
  } catch (err) {
    console.error('[FitTrack] Store migration failed:', err);
    // Don't throw — a failed migration is better than a crashed app
  }
}

// ── legs-v2: Romanian Deadlifts inserted at index 1 (2026-08-22) ──────────
//
// setData / exerciseNotes are keyed by exercise INDEX, so inserting an exercise
// mid-list silently reassigns every set logged after it. The 22 Aug Legs session
// was logged before the insert, which left hack squat numbers showing under
// Romanian Deadlifts, leg extensions under hack squats, and so on.
//
// This shifts indices >= 1 up by one for legs-v2 only, restoring the original
// pairing and leaving RDLs correctly empty. Runs exactly once.
function migrateLegsRdlInsert(stored, state) {
  try {
    if (state.migrations?.legsV2RdlInsert) return;

    const slice = state.programmeData?.['ppl-v2'];
    if (slice) {
      const shift = (obj, hasSetIndex) => {
        if (!obj) return obj;
        const out = {};
        const entries = Object.entries(obj);
        // Descending index order so a shifted key never lands on one not yet moved.
        const re = hasSetIndex ? /^week(\d+)_legs-v2_(\d+)_(\d+)$/ : /^week(\d+)_legs-v2_(\d+)$/;
        const parsed = entries.map(([k, v]) => [k, v, re.exec(k)]);
        parsed.sort((a, b) => (b[2] ? +b[2][2] : -1) - (a[2] ? +a[2][2] : -1));
        for (const [k, v, m] of parsed) {
          if (!m || +m[2] < 1) {
            out[k] = v;
            continue;
          }
          const ei = +m[2] + 1;
          out[hasSetIndex ? `week${m[1]}_legs-v2_${ei}_${m[3]}` : `week${m[1]}_legs-v2_${ei}`] = v;
        }
        return out;
      };
      slice.setData = shift(slice.setData, true);
      slice.exerciseNotes = shift(slice.exerciseNotes, false);
      console.log('[FitTrack] legs-v2 RDL index shift applied.');
    }

    state.migrations = { ...(state.migrations ?? {}), legsV2RdlInsert: true };
    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));
  } catch (err) {
    console.error('[FitTrack] legs-v2 RDL migration failed:', err);
  }
}

// Migrations that assume the v2 (programmeData) shape, in the order they have to
// run: the RDL shift still speaks index keys, so it has to finish before the
// re-key turns those indices into names.
function runPostShapeMigrations(stored, state) {
  // First, so every later migration and every selector sees a complete slice.
  migrateSliceShape(stored, state);
  migrateLegsRdlInsert(stored, state);
  migrateExerciseIndexKeys(stored, state);
  migrateAssistedToAssistValue(stored, state);
  // Both address sets by slug key, so the re-key above must have finished first.
  migrateKnownMisloggedWeights(stored, state);
  migrateLegPressSplit(stored, state);
  migrateRdlMachineSplit(stored, state);
  migrateShoulderPressSplit(stored, state);
}

// ── every slice carries every field (2026-09-01) ─────────────────────────
//
// zustand's persist does a SHALLOW merge on rehydrate: the stored
// `programmeData` replaces the default outright, so a slice written before a
// field existed never gains it. Harmless until something selects it —
// `useStore((s) => s.programmeData[id]?.heldExercises ?? {})` builds a new
// object every call while the key is missing, zustand v5 reads selectors
// through useSyncExternalStore, and a snapshot that never compares equal
// re-renders forever. React error #185, black Workouts screen. Adding
// `heldExercises` did exactly that to every store persisted before 31 Aug.
//
// Selectors now fall back to a shared EMPTY, which fixes it at the read. This
// fixes it at the source, so the next field added is safe whether or not its
// selector remembers. Deliberately unflagged: it is a cheap idempotent fill
// that has to run again every time the shape grows.
function migrateSliceShape(stored, state) {
  try {
    let added = 0;
    for (const slice of Object.values(state.programmeData ?? {})) {
      if (!slice || typeof slice !== 'object') continue;
      // Rebuilt per slice — one shared {} across slices would alias them.
      for (const [key, value] of Object.entries(emptyProgrammeData())) {
        if (key in slice) continue;
        slice[key] = value;
        added++;
      }
    }
    if (!added) return;

    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));
    console.log(`[FitTrack] Slice shape: filled ${added} missing field(s).`);
  } catch (err) {
    console.error('[FitTrack] Slice shape fill failed:', err);
  }
}

// ── the two leg presses become two exercises (2026-08-31) ────────────────
//
// Robbie uses whichever is free, so one entry could never be right: 100 kg of
// plates and 130 on a pin-loaded stack are not the same load, and a single line
// through both read as a 30 kg jump when he had changed machines. `Leg Press` is
// now `Leg Press (Plates)` — id pinned, so its history stays put — and a separate
// `Leg Press (Machine)` sits beside it.
//
// One session was logged on the machine before the split: week 8, 26 Aug, noted
// at the time as "Using the machine version rather than weights as its not free".
// Those sets move across so each exercise starts honest. Identified by week rather
// than by weight, because a weight is exactly the thing that is ambiguous here.
const LEG_PRESS_MACHINE_WEEKS = [{ programmeId: 'ppl-v2', dayId: 'legs-v2', weeks: [8] }];

function migrateLegPressSplit(stored, state) {
  try {
    if (state.migrations?.legPressSplit) return;

    let moved = 0;
    for (const { programmeId, dayId, weeks } of LEG_PRESS_MACHINE_WEEKS) {
      const slice = state.programmeData?.[programmeId];
      const day = PROGRAMMES[programmeId]?.days?.find((d) => d.id === dayId);
      const plates = day?.exercises?.find((e) => e.name === 'Leg Press (Plates)');
      const machine = day?.exercises?.find((e) => e.name === 'Leg Press (Machine)');
      if (!slice?.setData || !plates || !machine) continue;

      for (const week of weeks) {
        for (let si = 0; si < plates.sets; si++) {
          const fromKey = setKey(week, dayId, plates, si);
          const entry = slice.setData[fromKey];
          if (!entry) continue;
          const toKey = setKey(week, dayId, machine, si);
          if (slice.setData[toKey]) continue; // already moved
          slice.setData[toKey] = entry;
          delete slice.setData[fromKey];
          moved++;
        }
        // The note explaining the machine choice belongs with the machine.
        const fromNote = exerciseNoteKey(week, dayId, plates);
        const toNote = exerciseNoteKey(week, dayId, machine);
        if (slice.exerciseNotes?.[fromNote] && !slice.exerciseNotes?.[toNote]) {
          slice.exerciseNotes = { ...slice.exerciseNotes, [toNote]: slice.exerciseNotes[fromNote] };
          delete slice.exerciseNotes[fromNote];
        }
      }

      const best = recomputePbFor(slice, dayId, machine);
      if (best > 0) state.pbs = { ...(state.pbs ?? {}), [machine.name]: best };
      const platesBest = recomputePbFor(slice, dayId, plates);
      state.pbs = { ...(state.pbs ?? {}), [plates.name]: platesBest };
    }

    state.migrations = { ...(state.migrations ?? {}), legPressSplit: true };
    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));
    if (moved > 0) console.log(`[FitTrack] Moved ${moved} set(s) to Leg Press (Machine).`);
  } catch (err) {
    console.error('[FitTrack] leg press split migration failed:', err);
  }
}

// ── Romanian deadlift: barbell vs the machine (2026-09-01) ───────────────
//
// Same shape as the leg press split above. 1 Sep was logged on a dedicated
// deadlift machine — "I used a dedicated deadlift machine for this" — at 80 kg,
// against 55 kg on the bar the session before. Left on one line that is a 25 kg
// jump the hamstrings never made, and it is the exact reading that produced the
// withdrawn "leg press is under-loaded, go to 145 kg" verdict.
//
// Keyed by DATE rather than week number: the week counter is a pass through the
// programme rather than a calendar week, and the date is the thing actually
// written on the session.
const RDL_MACHINE_DATES = [{ programmeId: 'ppl-v2', dayId: 'legs-v2', dates: ['2026-09-01'] }];

function migrateRdlMachineSplit(stored, state) {
  try {
    if (state.migrations?.rdlMachineSplit) return;

    let moved = 0;
    for (const { programmeId, dayId, dates } of RDL_MACHINE_DATES) {
      const slice = state.programmeData?.[programmeId];
      const day = PROGRAMMES[programmeId]?.days?.find((d) => d.id === dayId);
      const bar = day?.exercises?.find((e) => e.name === 'Romanian Deadlifts (Barbell)');
      const machine = day?.exercises?.find((e) => e.name === 'Romanian Deadlifts (Machine)');
      if (!slice?.setData || !bar || !machine) continue;

      for (let week = 1; week <= 52; week++) {
        if (!dates.includes(slice.workoutDates?.[dayKey(week, dayId)])) continue;
        for (let si = 0; si < bar.sets; si++) {
          const fromKey = setKey(week, dayId, bar, si);
          const entry = slice.setData[fromKey];
          if (!entry) continue;
          const toKey = setKey(week, dayId, machine, si);
          if (slice.setData[toKey]) continue; // already moved
          slice.setData[toKey] = entry;
          delete slice.setData[fromKey];
          moved++;
        }
        const fromNote = exerciseNoteKey(week, dayId, bar);
        const toNote = exerciseNoteKey(week, dayId, machine);
        if (slice.exerciseNotes?.[fromNote] && !slice.exerciseNotes?.[toNote]) {
          slice.exerciseNotes = { ...slice.exerciseNotes, [toNote]: slice.exerciseNotes[fromNote] };
          delete slice.exerciseNotes[fromNote];
        }
      }

      // PBs are keyed on the exercise NAME, so the rename orphans the old one and
      // both new names need recomputing from what is now under each.
      const pbs = { ...(state.pbs ?? {}) };
      delete pbs['Romanian Deadlifts'];
      pbs[bar.name] = recomputePbFor(slice, dayId, bar);
      const machineBest = recomputePbFor(slice, dayId, machine);
      if (machineBest > 0) pbs[machine.name] = machineBest;
      state.pbs = pbs;
    }

    // He reported using both of these in his gym (6 Sep: the Smith chest press;
    // 1 Sep: the deadlift machine), so tick them rather than making him re-tap
    // Full Commercial Gym before the substitutions he asked for will appear.
    // Only for a user who has already chosen equipment — a fresh install picks
    // its own in Settings.
    if (Array.isArray(state.equipment) && state.equipment.length) {
      for (const item of ['Smith Machine', 'Deadlift Machine']) {
        if (!state.equipment.includes(item)) state.equipment = [...state.equipment, item];
      }
    }

    state.migrations = { ...(state.migrations ?? {}), rdlMachineSplit: true };
    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));
    if (moved > 0) console.log(`[FitTrack] Moved ${moved} set(s) to Romanian Deadlifts (Machine).`);
  } catch (err) {
    console.error('[FitTrack] RDL machine split migration failed:', err);
  }
}

// ── shoulder press: dumbbells vs the machine (2026-09-10) ────────────────
//
// Third instance of the same shape, after the leg presses and the Romanian
// deadlifts. From 10 Sep he pressed on a pin-loaded machine — 45-50 kg of stack
// against 25 kg of dumbbells — and logged it under the dumbbell entry because the
// split did not exist yet. Left alone that is a 100% jump the delts never made.
const SHOULDER_PRESS_MACHINE_DATES = [{ programmeId: 'ppl-v2', dayId: 'push-v2', dates: ['2026-09-10', '2026-09-14'] }];

function migrateShoulderPressSplit(stored, state) {
  try {
    if (state.migrations?.shoulderPressSplit) return;

    let moved = 0;
    for (const { programmeId, dayId, dates } of SHOULDER_PRESS_MACHINE_DATES) {
      const slice = state.programmeData?.[programmeId];
      const day = PROGRAMMES[programmeId]?.days?.find((d) => d.id === dayId);
      const db = day?.exercises?.find((e) => e.name === 'Seated Dumbbell Shoulder Press');
      const machine = day?.exercises?.find((e) => e.name === 'Shoulder Press (Machine)');
      if (!slice?.setData || !db || !machine) continue;

      for (let week = 1; week <= 52; week++) {
        if (!dates.includes(slice.workoutDates?.[dayKey(week, dayId)])) continue;
        // The dumbbell entry has 2 sets and the machine 3, so read across the
        // larger of the two or a third set logged by hand would be left behind.
        for (let si = 0; si < Math.max(db.sets, machine.sets); si++) {
          const fromKey = setKey(week, dayId, db, si);
          const entry = slice.setData[fromKey];
          if (!entry) continue;
          const toKey = setKey(week, dayId, machine, si);
          if (slice.setData[toKey]) continue;
          slice.setData[toKey] = entry;
          delete slice.setData[fromKey];
          moved++;
        }
        const fromNote = exerciseNoteKey(week, dayId, db);
        const toNote = exerciseNoteKey(week, dayId, machine);
        if (slice.exerciseNotes?.[fromNote] && !slice.exerciseNotes?.[toNote]) {
          slice.exerciseNotes = { ...slice.exerciseNotes, [toNote]: slice.exerciseNotes[fromNote] };
          delete slice.exerciseNotes[fromNote];
        }
      }

      const pbs = { ...(state.pbs ?? {}) };
      pbs[db.name] = recomputePbFor(slice, dayId, db);
      const machineBest = recomputePbFor(slice, dayId, machine);
      if (machineBest > 0) pbs[machine.name] = machineBest;
      state.pbs = pbs;
    }

    // He is using it, so tick it rather than making him re-tap the equipment list.
    if (
      Array.isArray(state.equipment) &&
      state.equipment.length &&
      !state.equipment.includes('Shoulder Press Machine')
    ) {
      state.equipment = [...state.equipment, 'Shoulder Press Machine'];
    }

    state.migrations = { ...(state.migrations ?? {}), shoulderPressSplit: true };
    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));
    if (moved > 0) console.log(`[FitTrack] Moved ${moved} set(s) to Shoulder Press (Machine).`);
  } catch (err) {
    console.error('[FitTrack] shoulder press split migration failed:', err);
  }
}

// ── known mis-logged weights (2026-08-31) ────────────────────────────────
//
// Some numbers are right in the field and wrong in meaning, and no amount of
// validation catches them: 6 kg is a perfectly plausible lateral raise, it just
// happens to be one dumbbell rather than the pair. These were identified from the
// data, confirmed with Robbie, and then sat uncorrected for days because fixing
// them was a manual job. That was the actual bug — the app could always have done
// it. This is where a correction goes now.
//
// Rules for anything added here:
//   - Address ONE exact value. `from` must match or nothing is touched, which is
//     what makes it idempotent and safe against a re-import of an old backup.
//   - Say WHY in `why`. It is written into the exercise note, so the change is
//     visible in the app and in every future export rather than being a silent
//     rewrite of logged history.
//   - Never guess. Every entry below is either provable from the reps or was
//     stated outright by Robbie.
//   - An ASSISTED exercise is corrected through `fromAssist`/`toAssist`, never
//     `from`/`to`. The stack number is the measurement; the effective load is
//     derived from it and from bodyweight on the day, so rewriting the weight
//     alone would leave `assist` contradicting it and the next export would
//     disagree with the machine.
//
// ⚠ The flag is a VERSION, not a boolean, so adding an entry below re-runs the
// migration on a store that already has the earlier ones. Re-applying an old fix
// is a no-op because its `from` no longer matches — that guard is what makes
// bumping this safe. Bump it whenever you add an entry.
const KNOWN_MISLOGGED_VERSION = 2;

const KNOWN_MISLOGGED = [
  {
    programmeId: 'ppl-v2',
    week: 7,
    dayId: 'push-v2',
    exercise: 'Dumbbell Lateral Raises',
    from: '6',
    to: '12',
    // Proof is in the reps, not the convention: 20 Aug was 12 reps at "6", 24 Aug
    // was 15 reps at 12. Nobody doubles the load and adds reps.
    why: 'per-hand entry, logged before the pair-total convention',
  },
  {
    programmeId: 'ppl-v2',
    week: 7,
    dayId: 'push-v2',
    exercise: 'Seated Dumbbell Shoulder Press',
    from: '12.5',
    to: '25',
    why: 'per-hand entry — 7 reps at "12.5" became 9 reps at 25 four days later',
  },
  {
    programmeId: 'ppl-v2',
    week: 8,
    dayId: 'legs-v2',
    exercise: 'Romanian Deadlifts',
    from: '40',
    to: '55',
    why: 'went up mid-session; the pre-fill kept 40',
  },
  {
    programmeId: 'ppl-v2',
    week: 7,
    dayId: 'pull-v2',
    exercise: 'Assisted Pull-Ups',
    fromAssist: '47',
    toAssist: '49',
    // His own note on the session says so outright: "assisted chin, 49 lb assist".
    // The 47 came from reading the stack as pounds and converting; the machine is
    // in kilos, so the number he set the pin to was 49 and no conversion applies.
    why: 'his note records 49 on the stack; 47 was the pound conversion',
  },
  {
    programmeId: 'ppl-v2',
    week: 9,
    dayId: 'pull-v2',
    exercise: 'Assisted Pull-Ups',
    fromAssist: '47',
    toAssist: '42',
    // Sets 2 and 3 that day are already 42, and the note says "Today im doing
    // 42kg assist". Set 1 kept the previous session's pin as a pre-fill.
    why: 'set 1 kept the previous pre-fill; the note and sets 2-3 both say 42',
  },
];

const e1rmOf = (w, r) => w * (1 + r / 30);

// Best estimated 1RM across every logged set of one exercise. PBs are keyed by
// exercise NAME and hold an e1RM, so changing a weight without recomputing leaves
// a personal best describing a lift that no longer exists in the data.
function recomputePbFor(slice, dayId, ex) {
  let best = 0;
  for (let week = 1; week <= 52; week++) {
    for (let si = 0; si < ex.sets; si++) {
      const entry = slice.setData?.[setKey(week, dayId, ex, si)];
      if (!entry?.done) continue;
      const w = parseFloat(entry.weight);
      const r = parseInt(entry.reps, 10);
      if (w > 0 && r > 0) best = Math.max(best, e1rmOf(w, r));
    }
  }
  return best;
}

function migrateKnownMisloggedWeights(stored, state) {
  try {
    if (state.migrations?.knownMisloggedWeights === KNOWN_MISLOGGED_VERSION) return;

    const applied = [];
    for (const fix of KNOWN_MISLOGGED) {
      const slice = state.programmeData?.[fix.programmeId];
      const day = PROGRAMMES[fix.programmeId]?.days?.find((d) => d.id === fix.dayId);
      const ex = day?.exercises?.find((e) => e.name === fix.exercise);
      if (!slice?.setData || !ex) continue;

      // An assisted fix addresses the STACK number and re-derives the effective
      // load from it; everything else addresses the weight directly.
      const byAssist = fix.fromAssist !== undefined;
      if (byAssist && !isAssisted(ex)) continue;
      const bw = byAssist ? bodyweightAt(state.weightLog, slice.workoutDates?.[dayKey(fix.week, fix.dayId)]) : null;
      if (byAssist && !bw) continue;
      const effective = byAssist ? effectiveFromAssist(bw.kg, parseFloat(fix.toAssist)) : null;
      if (byAssist && effective === null) continue;

      const changedSets = [];
      for (let si = 0; si < ex.sets; si++) {
        const entry = slice.setData[setKey(fix.week, fix.dayId, ex, si)];
        if (!entry?.done) continue;
        if (byAssist) {
          if (String(entry.assist) !== fix.fromAssist) continue;
          entry.assist = fix.toAssist;
          entry.weight = String(effective);
        } else {
          if (String(entry.weight) !== fix.from) continue;
          entry.weight = fix.to;
        }
        changedSets.push(si + 1);
      }
      if (!changedSets.length) continue;

      // Leave a trail in his own data, not just in a console nobody reads.
      const noteKey = exerciseNoteKey(fix.week, fix.dayId, ex);
      const change = byAssist
        ? `${fix.fromAssist} → ${fix.toAssist} kg assist (${effective} kg effective)`
        : `${fix.from} kg → ${fix.to} kg`;
      const stamp = `[corrected] set${changedSets.length > 1 ? 's' : ''} ${changedSets.join(', ')}: ${change} — ${fix.why}`;
      const existing = slice.exerciseNotes?.[noteKey];
      slice.exerciseNotes = {
        ...(slice.exerciseNotes ?? {}),
        [noteKey]: existing ? `${existing}\n${stamp}` : stamp,
      };

      const best = recomputePbFor(slice, fix.dayId, ex);
      if (best > 0) state.pbs = { ...(state.pbs ?? {}), [ex.name]: best };
      applied.push(`${fix.exercise} week ${fix.week} (${changedSets.length} set(s))`);
    }

    state.migrations = { ...(state.migrations ?? {}), knownMisloggedWeights: KNOWN_MISLOGGED_VERSION };
    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));
    if (applied.length) console.log(`[FitTrack] Corrected mis-logged weights: ${applied.join('; ')}`);
  } catch (err) {
    console.error('[FitTrack] mis-logged weight migration failed:', err);
  }
}

// ── index keys → stable exercise keys (2026-08-25) ───────────────────────
//
// `week3_push-v2_1_0` (exercise index 1) becomes `week3_push-v2_bench-press_0`.
// See setKeys.js for why. Deliberately NOT guarded by a `migrations` flag:
// it only ever rewrites a key whose exercise segment is all digits, so running
// it a second time is a no-op. That matters because importJSON drops a backup
// straight into localStorage and reloads — a flag would let an old backup's
// index keys through untouched.
function migrateExerciseIndexKeys(stored, state) {
  try {
    // dayId → [keyPart per exercise index], across every programme.
    const byDay = {};
    for (const programme of Object.values(PROGRAMMES ?? {})) {
      for (const day of programme?.days ?? []) {
        byDay[day.id] = (day.exercises ?? []).map((ex) => exerciseKeyPart(ex));
      }
    }

    let rewritten = 0;

    // hasSetIndex distinguishes setData (`..._{ei}_{si}`) from exerciseNotes (`..._{ei}`).
    const remap = (obj, hasSetIndex) => {
      if (!obj) return obj;
      const re = hasSetIndex ? /^week(\d+)_([^_]+)_(\d+)_(\d+)$/ : /^week(\d+)_([^_]+)_(\d+)$/;
      const out = {};
      for (const [key, val] of Object.entries(obj)) {
        const m = re.exec(key);
        const parts = m ? byDay[m[2]] : null;
        const part = parts?.[+m?.[3]];
        // Anything we cannot confidently map — unknown day, index past the end
        // of the day, a key already carrying a name — is left exactly as it is.
        // Dropping it would silently delete logged sets.
        if (!part) {
          out[key] = val;
          continue;
        }
        out[hasSetIndex ? `week${m[1]}_${m[2]}_${part}_${m[4]}` : `week${m[1]}_${m[2]}_${part}`] = val;
        rewritten++;
      }
      return out;
    };

    for (const slice of Object.values(state.programmeData ?? {})) {
      if (!slice) continue;
      slice.setData = remap(slice.setData, true);
      slice.exerciseNotes = remap(slice.exerciseNotes, false);
    }

    if (rewritten > 0) {
      stored.state = state;
      localStorage.setItem('fittrack-store', JSON.stringify(stored));
      console.log(`[FitTrack] Re-keyed ${rewritten} entries from exercise index to stable id.`);
    }
  } catch (err) {
    console.error('[FitTrack] stable exercise key migration failed:', err);
  }
}

// ── assisted exercises: stored effective load → stored assist (27 Aug) ───
//
// Assisted chin-ups were logged as the EFFECTIVE load (bodyweight minus assist),
// which meant doing the subtraction by hand every session and silently going
// stale as bodyweight changed. The field now holds the assist read off the
// machine, with the effective load derived alongside it.
//
// Existing entries already hold a correct `weight`; this only adds the `assist`
// they were missing, by inverting against the bodyweight logged at the time.
// `weight` is deliberately left untouched — it is right, and every consumer reads
// it. Flag-guarded, because inverting twice would be wrong.
function migrateAssistedToAssistValue(stored, state) {
  try {
    if (state.migrations?.assistedStoresAssist) return;

    let converted = 0;
    for (const [progId, slice] of Object.entries(state.programmeData ?? {})) {
      const days = PROGRAMMES[progId]?.days ?? [];
      if (!slice?.setData) continue;
      for (const day of days) {
        for (const ex of day.exercises ?? []) {
          if (!isAssisted(ex)) continue;
          for (let week = 1; week <= 52; week++) {
            const date = slice.workoutDates?.[dayKey(week, day.id)];
            if (!date) continue;
            const bw = bodyweightAt(state.weightLog, date);
            if (!bw) continue;
            for (let si = 0; si < ex.sets; si++) {
              const entry = slice.setData[setKey(week, day.id, ex, si)];
              if (!entry || entry.assist !== undefined) continue;
              const eff = parseFloat(entry.weight);
              if (!(eff > 0)) continue;
              const assist = assistFromEffective(bw.kg, eff);
              if (assist === null) continue;
              entry.assist = String(assist);
              converted++;
            }
          }
        }
      }
    }

    state.migrations = { ...(state.migrations ?? {}), assistedStoresAssist: true };
    stored.state = state;
    localStorage.setItem('fittrack-store', JSON.stringify(stored));
    if (converted > 0) console.log(`[FitTrack] Recorded the assist value on ${converted} assisted set(s).`);
  } catch (err) {
    console.error('[FitTrack] assisted-load migration failed:', err);
  }
}
