// useBackButton.js
// Handles Android hardware back button via @capacitor/app.
// Registers a listener and returns a cleanup function.
// Must be called with a handler that returns true if the event was consumed,
// false to let the default behaviour (exit) happen.

import { App } from '@capacitor/app';

/**
 * Register an Android back button handler.
 * Call this in a useEffect — the returned cleanup removes the listener.
 *
 * @param {() => void} handler - Called when back is pressed. Should navigate or no-op.
 * @param {number} priority - Higher priority handlers run first (default 10).
 */
export function registerBackButton(handler, priority = 10) {
  let listener = null;

  App.addListener('backButton', handler)
    .then((l) => {
      listener = l;
    })
    .catch(() => {
      // Not available on web — silently ignore
    });

  // Return cleanup
  return () => {
    listener?.remove();
  };
}