/**
 * useLegoSound Hook
 * Provides satisfying LEGO brick click sounds using Web Audio API
 */

import { useCallback, useRef, useEffect } from "react";

// Create a satisfying "click" sound using Web Audio API
function createClickSound(audioContext: AudioContext): void {
  const now = audioContext.currentTime;
  
  // Create oscillator for the main click
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // High frequency "click" sound
  oscillator.frequency.setValueAtTime(800, now);
  oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.05);
  
  // Quick attack and decay
  gainNode.gain.setValueAtTime(0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  
  oscillator.start(now);
  oscillator.stop(now + 0.1);
  
  // Add a secondary "snap" sound
  const snapOsc = audioContext.createOscillator();
  const snapGain = audioContext.createGain();
  
  snapOsc.connect(snapGain);
  snapGain.connect(audioContext.destination);
  
  snapOsc.type = "square";
  snapOsc.frequency.setValueAtTime(1200, now);
  snapOsc.frequency.exponentialRampToValueAtTime(400, now + 0.02);
  
  snapGain.gain.setValueAtTime(0.15, now);
  snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
  
  snapOsc.start(now);
  snapOsc.stop(now + 0.05);
}

// Create a deeper "thunk" for larger bricks
function createThunkSound(audioContext: AudioContext): void {
  const now = audioContext.currentTime;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(150, now);
  oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.1);
  
  gainNode.gain.setValueAtTime(0.4, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  oscillator.start(now);
  oscillator.stop(now + 0.2);
}

// Create a celebration sound for build completion
function createCelebrationSound(audioContext: AudioContext): void {
  const now = audioContext.currentTime;
  
  // Ascending notes
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  notes.forEach((freq, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.setValueAtTime(freq, now + index * 0.1);
    gain.gain.setValueAtTime(0.2, now + index * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.3);
    
    osc.start(now + index * 0.1);
    osc.stop(now + index * 0.1 + 0.35);
  });
}

export function useLegoSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play click sound when a brick is placed
  const playClick = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      createClickSound(ctx);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  }, [initAudio]);

  // Play thunk sound for larger bricks
  const playThunk = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      createThunkSound(ctx);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  }, [initAudio]);

  // Play celebration sound when build is complete
  const playCelebration = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      createCelebrationSound(ctx);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  }, [initAudio]);

  // Toggle sound on/off
  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playClick,
    playThunk,
    playCelebration,
    setEnabled,
    isEnabled: () => enabledRef.current,
  };
}
