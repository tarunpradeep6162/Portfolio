'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/lib/hooks/useAudio';

export function AudioToggle() {
  const { isMuted, toggleAudio } = useAudio();

  return (
    <button
      onClick={toggleAudio}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 sm:p-4 rounded-full bg-[var(--accent)] text-[var(--surface)] hover:bg-[var(--accent-secondary)] active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Toggle audio"
      title={isMuted ? "Unmute" : "Mute"}
    >
      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}
