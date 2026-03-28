// useHaptics.js
// Wraps @capacitor/haptics with a graceful fallback.
// Capacitor plugins must be statically imported — dynamic import() doesn't work.

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticsImpact() {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // not supported on web or this device — silently ignore
  }
}

export async function hapticsNotification() {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // not supported on web or this device — silently ignore
  }
}
