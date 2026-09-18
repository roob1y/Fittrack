// Guards the invariants that storage keys depend on.
//
//   node scripts/verify-keys.mjs
//
// setData and exerciseNotes are keyed `week{N}_{dayId}_{exerciseKey}_{setIndex}`,
// where exerciseKey comes from utils/setKeys.js. That scheme only holds if a few
// things stay true, and every one of them fails silently rather than loudly:
// two exercises in a day sharing a key means one overwrites the other's log,
// and an exercise key that is all digits is indistinguishable from the old
// index keys the migration is still looking for.
//
// Exits non-zero on any error, so it can go in front of a build.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// package.json says "type": "commonjs" for Vite's sake, so Node will not parse
// src/*.js as ES modules however they are written. Both files below are
// import-free, so loading their source through a data: URL gets us the real
// exports without a build step or a bundler dependency.
const here = dirname(fileURLToPath(import.meta.url));
const loadModule = (rel) => {
  const src = readFileSync(resolve(here, rel), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
};

const { PROGRAMMES } = await loadModule('../src/data/program.js');
const { exerciseKeyPart } = await loadModule('../src/utils/setKeys.js');

const errors = [];
const warnings = [];

for (const [progId, programme] of Object.entries(PROGRAMMES)) {
  const dayIds = new Set();

  for (const day of programme.days ?? []) {
    const where = `${progId}/${day.id}`;

    // Day ids are a key segment and are split on '_'.
    if (day.id.includes('_')) errors.push(`${where}: day id contains '_', which breaks key parsing`);
    if (dayIds.has(day.id)) errors.push(`${progId}: duplicate day id '${day.id}'`);
    dayIds.add(day.id);

    const seen = new Map();

    (day.exercises ?? []).forEach((ex, ei) => {
      const key = exerciseKeyPart(ex);
      const at = `${where}[${ei}] "${ex.name}"`;

      // Two exercises with the same key share one set of logged sets.
      if (seen.has(key)) {
        errors.push(`${at}: key '${key}' already used by "${seen.get(key)}" — give one an explicit \`id\``);
      }
      seen.set(key, ex.name);

      // An all-digit key looks exactly like an un-migrated index key.
      if (/^\d+$/.test(key)) errors.push(`${at}: key '${key}' is all digits — give it an explicit \`id\``);

      if (key === 'unknown') errors.push(`${at}: no usable name or id`);

      // Every exercise needs muscle data or it silently vanishes from the volume
      // charts — the same failure shape as an omitted export field: no error, just
      // an incomplete picture. Alternatives count too, since a swap must not drop
      // a muscle from the week's tally.
      const MUSCLES = new Set([
        'chest',
        'front-delts',
        'side-delts',
        'rear-delts',
        'triceps',
        'biceps',
        'forearms',
        'lats',
        'upper-back',
        'lower-back',
        'quads',
        'hamstrings',
        'glutes',
        'calves',
        'abs',
      ]);
      const checkMuscles = (obj, label) => {
        const m = obj?.muscles;
        if (!m?.primary?.length) {
          errors.push(`${label}: no muscles.primary — it would be invisible in volume charts`);
          return;
        }
        for (const g of [...(m.primary ?? []), ...(m.secondary ?? [])]) {
          if (!MUSCLES.has(g)) errors.push(`${label}: unknown muscle group '${g}'`);
        }
        const overlap = (m.secondary ?? []).filter((g) => (m.primary ?? []).includes(g));
        if (overlap.length) errors.push(`${label}: ${overlap.join(', ')} listed as both primary and secondary`);
      };
      checkMuscles(ex, at);
      if (ex.alternative) checkMuscles(ex.alternative, `${at} → alt "${ex.alternative.name}"`);
      if (ex.superset) checkMuscles(ex.superset, `${at} → superset "${ex.superset.name}"`);

      // reps must line up with sets, or the last target silently repeats.
      const repCount = String(ex.reps ?? '').split('/').length;
      if (repCount > 1 && repCount !== ex.sets) {
        warnings.push(`${at}: ${ex.sets} sets but ${repCount} rep targets ('${ex.reps}')`);
      }

      if (ex.restSeconds !== undefined) {
        const r = Number(ex.restSeconds);
        if (!Number.isFinite(r) || r <= 0)
          errors.push(`${at}: restSeconds must be a positive number, got ${ex.restSeconds}`);
        else if (r > 600) warnings.push(`${at}: restSeconds ${r} is over 10 minutes — intended?`);
      }

      if (ex.compound !== undefined && typeof ex.compound !== 'boolean') {
        errors.push(`${at}: compound must be a boolean, got ${typeof ex.compound}`);
      }

      // An alternative that needs the same machine as the primary is not a fallback.
      const primaryMachines = (ex.equipment ?? []).filter((e) => /machine|cable|press/i.test(e));
      const altEquip = ex.alternative?.equipment;
      if (ex.alternative && altEquip && primaryMachines.some((m) => altEquip.includes(m))) {
        warnings.push(`${at}: alternative "${ex.alternative.name}" still requires ${primaryMachines.join(', ')}`);
      }
    });
  }
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length > 0 ? 1 : 0);
