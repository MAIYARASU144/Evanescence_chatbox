/**
 * Sound notification utility using Web Audio API.
 * No external files — sounds are generated programmatically.
 * All sounds respect user's OS mute setting via AudioContext.
 */

let audioCtx = null;

const getCtx = () => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume suspended context (browsers require user gesture first)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

/**
 * Play a short tone.
 * @param {number} frequency - Hz
 * @param {number} duration  - seconds
 * @param {number} volume    - 0 to 1
 * @param {'sine'|'square'|'triangle'|'sawtooth'} type
 */
const playTone = (frequency, duration, volume = 0.15, type = 'sine') => {
  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Fade in + fade out to avoid clicking artifacts
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // AudioContext not available (e.g., server-side, blocked)
  }
};

/**
 * Soft two-note chime for incoming messages.
 * Only plays when the sender is not the current user.
 */
export const playMessageSound = () => {
  playTone(880, 0.12, 0.12, 'sine');
  setTimeout(() => playTone(1100, 0.15, 0.10, 'sine'), 80);
};

/**
 * Ascending tone when someone joins.
 */
export const playJoinSound = () => {
  playTone(660, 0.1, 0.1, 'sine');
  setTimeout(() => playTone(880, 0.15, 0.1, 'sine'), 100);
};

/**
 * Descending tone when someone leaves.
 */
export const playLeaveSound = () => {
  playTone(660, 0.1, 0.08, 'sine');
  setTimeout(() => playTone(440, 0.15, 0.08, 'sine'), 100);
};

/**
 * Short alert for important events (e.g., session ending soon).
 */
export const playAlertSound = () => {
  playTone(440, 0.08, 0.12, 'triangle');
  setTimeout(() => playTone(440, 0.08, 0.12, 'triangle'), 180);
};
