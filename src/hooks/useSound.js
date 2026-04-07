// useSound.js
// Generates sounds via Web Audio API — no audio files needed.
// Beeps are created programmatically and work on Android WebView.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playBeep(ctx, startTime, frequency = 880, duration = 0.12, volume = 0.4) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Fade out to avoid click artefact
  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}
export function playCountdownBeep(n) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // 3 = low, 2 = mid, 1 = high — anticipation builds
    const freq = n === 1 ? 660 : n === 2 ? 520 : 440;
    playBeep(ctx, now, freq, 0.1, 0.3);
  } catch {
    // silently ignore
  }
}
// Two quick beeps — rest timer complete
export function playRestComplete() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    playBeep(ctx, now, 880, 0.12); // first beep
    playBeep(ctx, now + 0.18, 1040, 0.14); // second beep, slightly higher
  } catch {
    // silently ignore if audio not available
  }
}
