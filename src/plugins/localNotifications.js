// localNotifications.js
// Thin wrapper around @capacitor/local-notifications.
// Handles permission requests, scheduling, and cancellation.
// Capacitor plugins must be statically imported.

import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNotificationPermission() {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleLocalNotification({ id, title, body, delaySeconds }) {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
          sound: null,       // uses default system notification sound
          smallIcon: 'ic_launcher_foreground',
          channelId: 'fittrack_alerts',
        },
      ],
    });
  } catch {
    // silently ignore on web
  }
}

export async function cancelLocalNotification(id) {
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {
    // silently ignore on web
  }
}

export async function createNotificationChannel() {
  try {
    await LocalNotifications.createChannel({
      id: 'fittrack_alerts',
      name: 'FitTrack Alerts',
      importance: 4,        // HIGH
      sound: 'default',
      vibration: true,
    });
  } catch {
    // Android only — silently ignore elsewhere
  }
}