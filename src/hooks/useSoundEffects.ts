import { useCallback, useRef } from 'react';

type SoundType = 'success' | 'error' | 'delete' | 'click' | 'notification';

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Fade in
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      
      // Fade out
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [getAudioContext]);

  const playSuccess = useCallback(() => {
    const ctx = getAudioContext();
    
    // Play ascending notes
    setTimeout(() => playTone(523.25, 0.1, 'sine', 0.2), 0);    // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.2), 100);  // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.25), 200); // G5
  }, [getAudioContext, playTone]);

  const playError = useCallback(() => {
    // Play descending dissonant notes
    setTimeout(() => playTone(400, 0.15, 'square', 0.15), 0);
    setTimeout(() => playTone(300, 0.2, 'square', 0.15), 100);
  }, [playTone]);

  const playDelete = useCallback(() => {
    // Play "whoosh" effect with descending tone
    playTone(600, 0.15, 'sine', 0.2);
    setTimeout(() => playTone(400, 0.15, 'sine', 0.15), 50);
    setTimeout(() => playTone(250, 0.2, 'sine', 0.1), 100);
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(800, 0.05, 'sine', 0.15);
  }, [playTone]);

  const playNotification = useCallback(() => {
    // Gentle two-tone notification
    setTimeout(() => playTone(880, 0.1, 'sine', 0.2), 0);    // A5
    setTimeout(() => playTone(1046.5, 0.15, 'sine', 0.25), 120); // C6
  }, [playTone]);

  const play = useCallback((type: SoundType) => {
    switch (type) {
      case 'success':
        playSuccess();
        break;
      case 'error':
        playError();
        break;
      case 'delete':
        playDelete();
        break;
      case 'click':
        playClick();
        break;
      case 'notification':
        playNotification();
        break;
    }
  }, [playSuccess, playError, playDelete, playClick, playNotification]);

  return { play, playSuccess, playError, playDelete, playClick, playNotification };
}
