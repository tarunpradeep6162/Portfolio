import { useEffect, useState } from 'react';

export function useAudio() {
  const [isMuted, setIsMuted] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
  }, []);

  const playInteractionSound = (frequency = 523.25, duration = 100) => {
    if (!audioContext || isMuted) return;
    
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + duration / 1000);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
      
      osc.start(now);
      osc.stop(now + duration / 1000);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const toggleAudio = () => {
    setIsMuted(!isMuted);
  };

  return {
    isMuted,
    toggleAudio,
    playInteractionSound,
  };
}
