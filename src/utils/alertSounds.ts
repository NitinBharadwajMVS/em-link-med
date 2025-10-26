import { TriageLevel } from '@/types/patient';

// Audio context for generating beep sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playBeep = (frequency: number, duration: number, volume: number) => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

export const playAlertSound = (triageLevel: TriageLevel) => {
  switch (triageLevel) {
    case 'critical':
      // Loud, urgent, multi-tone alarm
      playBeep(800, 0.15, 0.3);
      setTimeout(() => playBeep(1000, 0.15, 0.3), 150);
      setTimeout(() => playBeep(800, 0.15, 0.3), 300);
      setTimeout(() => playBeep(1000, 0.15, 0.3), 450);
      setTimeout(() => playBeep(800, 0.2, 0.3), 600);
      break;

    case 'urgent':
      // Medium intensity, double beep
      playBeep(600, 0.2, 0.2);
      setTimeout(() => playBeep(700, 0.2, 0.2), 250);
      break;

    case 'stable':
      // Gentle single beep
      playBeep(440, 0.15, 0.15);
      break;
  }
};
