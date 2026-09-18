// Must be the first import in main.jsx. Nothing in this file's import graph may
// reach store/useStore.js.
//
// `useStore` is created — and zustand's `persist` middleware hydrates it from
// localStorage — the instant store/useStore.js is first evaluated, which happens
// via `import App` at the top of main.jsx. ES modules evaluate every import
// before the first statement of the importing module's body, so calling
// migrateStoreIfNeeded() from main.jsx's body was always too late:
//
//   1. import App        -> store hydrates, holding the PRE-migration keys
//   2. migrateStoreIfNeeded() rewrites localStorage to the new keys
//   3. components read the stale in-memory copy and find nothing
//   4. the first set() persists that stale copy back over the migrated data
//
// The migration looked like it worked — it logged, and the data on disk was
// correct — while the app showed empty fields and no ticked sets, then quietly
// undid itself. Importing it here keeps it ahead of hydration.

import { migrateStoreIfNeeded } from './utils/migrateStore';

migrateStoreIfNeeded();
