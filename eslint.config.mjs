// ══════════════════════════════════════════
//  eslint.config.mjs
//  The net under the refactors.
// ══════════════════════════════════════════
//
// This exists because of one bug. A rename during the stable-keys refactor left
// `{ei + 1}` behind in a badge inside StrengthGraph. Vite compiled it happily,
// the build passed, and the Progress screen threw `ReferenceError: ei is not
// defined` on every open for two days. `no-undef` catches exactly that class of
// mistake in under a second, which is the entire justification for the file.
//
// Deliberately narrow. This is not a style config — Prettier already owns
// formatting, and a wall of stylistic warnings is how a lint step gets ignored.
// Every rule here catches something that is actually broken at runtime, so a
// non-zero exit means something is genuinely wrong.
//
//   npm run lint
//
// `no-unused-vars` currently reports a handful of pre-existing dead bindings in
// files untouched by recent work. They are real, they are harmless, and they are
// worth clearing when you are next in those files.

import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'android/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': hooks },
    settings: { react: { version: 'detect' } },
    rules: {
      // The one that matters — see the note at the top of this file.
      'no-undef': 'error',
      // A warning, not an error, so `npm run lint` still exits clean. Dead
      // bindings are worth clearing but they do not break anything at runtime,
      // and a lint step that fails on day one is a lint step nobody runs.
      // React 19 with the automatic JSX runtime never references React itself.
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^React$' }],
      // Without these, every component and prop looks unused to the base rules.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // A hook behind a condition breaks silently and intermittently, which is
      // the worst way for anything to break.
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
    rules: { 'no-undef': 'error' },
  },
];
