// keepAwake.js
// Thin wrapper around @capacitor-community/keep-awake.
// Capacitor plugins must be statically imported.

import { KeepAwake } from '@capacitor-community/keep-awake';

export async function keepScreenAwake() {
  try {
    await KeepAwake.keepAwake();
  } catch {
    // not supported on web — silently ignore
  }
}

export async function allowScreenSleep() {
  try {
    await KeepAwake.allowSleep();
  } catch {
    // not supported on web — silently ignore
  }
}
