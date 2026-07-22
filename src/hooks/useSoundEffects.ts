import { useCallback, useRef } from 'react';

type SoundType =
  | 'success'
  | 'error'
  | 'delete'
  | 'click'
  | 'notification'
  | 'camera'
  | 'scanStart'
  | 'scanComplete'
  | 'warning'
  | 'coin'
  | 'toggle'
  | 'swipe'
  | 'achievement';

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx =
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
        window.AudioContext;
      audioContextRef.current = new Ctx();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.3,
      startOffset = 0,
    ) => {
      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const start = ctx.currentTime + startOffset;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);

        // Fade in
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(volume, start + 0.01);
        // Fade out
        gainNode.gain.linearRampToValueAtTime(0, start + duration);

        oscillator.start(start);
        oscillator.stop(start + duration);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    },
    [getAudioContext],
  );

  // Frekvencijski sweep (glissando) — koristi se za "scan" i "swipe".
  const playSweep = useCallback(
    (
      fromFreq: number,
      toFreq: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.2,
      startOffset = 0,
    ) => {
      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const start = ctx.currentTime + startOffset;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(fromFreq, start);
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(toFreq, 0.0001),
          start + duration,
        );

        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(volume, start + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, start + duration);

        oscillator.start(start);
        oscillator.stop(start + duration);
      } catch (error) {
        console.error('Error playing sweep:', error);
      }
    },
    [getAudioContext],
  );

  // Kratki šum za "camera" (shutter) i akcente.
  const playNoiseBurst = useCallback(
    (duration = 0.08, volume = 0.25, startOffset = 0) => {
      try {
        const ctx = getAudioContext();
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          // Malo amplitudnog ovojnika za oštriji "klik".
          const env = 1 - i / bufferSize;
          data[i] = (Math.random() * 2 - 1) * env;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime + startOffset);

        // Blagi highpass da zvuči više kao "klik" nego "šš".
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 1200;

        source.connect(highpass);
        highpass.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(ctx.currentTime + startOffset);
        source.stop(ctx.currentTime + startOffset + duration);
      } catch (error) {
        console.error('Error playing noise burst:', error);
      }
    },
    [getAudioContext],
  );

  const playSuccess = useCallback(() => {
    playTone(523.25, 0.1, 'sine', 0.2, 0);
    playTone(659.25, 0.1, 'sine', 0.2, 0.1);
    playTone(783.99, 0.15, 'sine', 0.25, 0.2);
  }, [playTone]);

  const playError = useCallback(() => {
    playTone(400, 0.15, 'square', 0.15, 0);
    playTone(300, 0.2, 'square', 0.15, 0.1);
  }, [playTone]);

  const playDelete = useCallback(() => {
    playTone(600, 0.15, 'sine', 0.2, 0);
    playTone(400, 0.15, 'sine', 0.15, 0.05);
    playTone(250, 0.2, 'sine', 0.1, 0.1);
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(800, 0.05, 'sine', 0.15);
  }, [playTone]);

  const playNotification = useCallback(() => {
    playTone(880, 0.1, 'sine', 0.2, 0);
    playTone(1046.5, 0.15, 'sine', 0.25, 0.12);
  }, [playTone]);

  // Kratki "shutter" — bijeli šum + tvrdi klik.
  const playCamera = useCallback(() => {
    playNoiseBurst(0.05, 0.3, 0);
    playTone(180, 0.04, 'square', 0.25, 0);
    playNoiseBurst(0.06, 0.22, 0.07);
  }, [playNoiseBurst, playTone]);

  // Uzlazni sweep koji prati početak AI skeniranja.
  const playScanStart = useCallback(() => {
    playSweep(300, 1200, 0.45, 'sawtooth', 0.14, 0);
  }, [playSweep]);

  // Vedri akord kad AI završi skeniranje.
  const playScanComplete = useCallback(() => {
    playTone(659.25, 0.12, 'triangle', 0.18, 0);      // E5
    playTone(783.99, 0.12, 'triangle', 0.18, 0.08);   // G5
    playTone(1046.5, 0.2, 'triangle', 0.22, 0.16);    // C6
  }, [playTone]);

  // Blago upozorenje (za PII i slično).
  const playWarning = useCallback(() => {
    playTone(660, 0.12, 'triangle', 0.2, 0);
    playTone(660, 0.12, 'triangle', 0.2, 0.18);
  }, [playTone]);

  // "Kaching" — dodan trošak / novi zapis.
  const playCoin = useCallback(() => {
    playTone(987.77, 0.08, 'square', 0.18, 0);   // B5
    playTone(1318.51, 0.16, 'square', 0.2, 0.06); // E6
  }, [playTone]);

  // Kratki tick za toggle / switch.
  const playToggle = useCallback(() => {
    playTone(1200, 0.03, 'square', 0.12, 0);
    playTone(900, 0.04, 'square', 0.1, 0.04);
  }, [playTone]);

  // Kratki "swoosh" za promjenu taba / navigaciju.
  const playSwipe = useCallback(() => {
    playSweep(1200, 400, 0.14, 'sine', 0.1, 0);
  }, [playSweep]);

  // Postignuće (npr. ispunjen mjesečni cilj).
  const playAchievement = useCallback(() => {
    playTone(523.25, 0.1, 'triangle', 0.2, 0);     // C5
    playTone(659.25, 0.1, 'triangle', 0.2, 0.1);   // E5
    playTone(783.99, 0.1, 'triangle', 0.22, 0.2);  // G5
    playTone(1046.5, 0.25, 'triangle', 0.28, 0.3); // C6
  }, [playTone]);

  const play = useCallback(
    (type: SoundType) => {
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
        case 'camera':
          playCamera();
          break;
        case 'scanStart':
          playScanStart();
          break;
        case 'scanComplete':
          playScanComplete();
          break;
        case 'warning':
          playWarning();
          break;
        case 'coin':
          playCoin();
          break;
        case 'toggle':
          playToggle();
          break;
        case 'swipe':
          playSwipe();
          break;
        case 'achievement':
          playAchievement();
          break;
      }
    },
    [
      playSuccess,
      playError,
      playDelete,
      playClick,
      playNotification,
      playCamera,
      playScanStart,
      playScanComplete,
      playWarning,
      playCoin,
      playToggle,
      playSwipe,
      playAchievement,
    ],
  );

  return {
    play,
    playSuccess,
    playError,
    playDelete,
    playClick,
    playNotification,
    playCamera,
    playScanStart,
    playScanComplete,
    playWarning,
    playCoin,
    playToggle,
    playSwipe,
    playAchievement,
  };
}
