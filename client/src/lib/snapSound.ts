/**
 * LEGO Brick Snap Sound Effect
 * Uses Web Audio API to generate a satisfying "click-snap" sound
 * when a brick is placed. No external audio files needed.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Play a satisfying LEGO brick snap sound.
 * Combines a short click with a resonant "thunk" for that classic snap feel.
 */
export function playSnapSound(volume = 0.4) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    // === Layer 1: Sharp click (high frequency transient) ===
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "square";
    clickOsc.frequency.setValueAtTime(1800, now);
    clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
    clickGain.gain.setValueAtTime(0.6, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    clickOsc.connect(clickGain);
    clickGain.connect(masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // === Layer 2: Resonant thunk (low frequency body) ===
    const thunkOsc = ctx.createOscillator();
    const thunkGain = ctx.createGain();
    thunkOsc.type = "sine";
    thunkOsc.frequency.setValueAtTime(300, now);
    thunkOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    thunkGain.gain.setValueAtTime(0.5, now + 0.005);
    thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thunkOsc.connect(thunkGain);
    thunkGain.connect(masterGain);
    thunkOsc.start(now);
    thunkOsc.stop(now + 0.12);

    // === Layer 3: Noise burst for texture ===
    const bufferSize = ctx.sampleRate * 0.04; // 40ms of noise
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    // Bandpass filter to shape the noise
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.04);

    // Cleanup: disconnect after sound finishes
    setTimeout(() => {
      masterGain.disconnect();
    }, 200);
  } catch {
    // Silently fail if Web Audio API is not available
  }
}

/**
 * Play a softer "hover snap" sound for ghost brick position changes.
 */
export function playHoverTick(volume = 0.08) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") return; // Don't resume just for hover

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);

    setTimeout(() => {
      gain.disconnect();
    }, 50);
  } catch {
    // Silently fail
  }
}

/**
 * Play a delete sound effect.
 */
export function playDeleteSound(volume = 0.3) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    // Descending tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.15);

    setTimeout(() => {
      masterGain.disconnect();
    }, 200);
  } catch {
    // Silently fail
  }
}
