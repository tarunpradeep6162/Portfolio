'use client';

import { useEffect, useRef } from 'react';
import { useAudio } from '@/lib/hooks/useAudio';

export function SoundDesign() {
  const { isMuted, playInteractionSound } = useAudio();
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    // Attach sound to interactive elements
    const buttons = document.querySelectorAll('button');
    const links = document.querySelectorAll('a:not(.no-sound)');

    const playClickSound = () => {
      if (!isMuted) {
        playInteractionSound(523.25, 80);
      }
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', playClickSound);
    });

    links.forEach(link => {
      link.addEventListener('click', playClickSound);
    });

    return () => {
      buttons.forEach(btn => {
        btn.removeEventListener('click', playClickSound);
      });
      links.forEach(link => {
        link.removeEventListener('click', playClickSound);
      });
    };
  }, [isMuted, playInteractionSound]);

  return null;
}

export function useHoverSound() {
  const { isMuted, playInteractionSound } = useAudio();

  const playHoverSound = () => {
    if (!isMuted) {
      playInteractionSound(440, 50);
    }
  };

  return { playHoverSound };
}
