'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/lib/hooks/useAudio';

export function AudioToggle() {
  const { isMuted, toggleAudio } = useAudio();

  return (
    <button
      onClick={toggleAudio}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-[var(--accent)] text-[var(--surface)] hover:bg-[var(--accent-secondary)] transition-all duration-300 shadow-lg hover:shadow-xl"
      aria-label="Toggle audio"
      title={isMuted ? "Unmute" : "Mute"}
    >
      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}
