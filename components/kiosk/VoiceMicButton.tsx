'use client';

import { Mic, Loader2, Volume2, X } from 'lucide-react';
import type { KioskJarvisState } from '@/hooks/useKioskJarvis';

interface VoiceMicButtonProps {
  state: KioskJarvisState;
  onTap: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function VoiceMicButton({ state, onTap, onCancel, disabled }: VoiceMicButtonProps) {
  const isActive = state !== 'idle';

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3">
      <button
        onClick={isActive ? onCancel : onTap}
        disabled={disabled}
        className={`
          w-16 h-16 rounded-full shadow-lg flex items-center justify-center
          transition-all active:scale-95
          ${state === 'listening'
            ? 'bg-red-500 text-white animate-pulse shadow-red-300'
            : state === 'processing'
              ? 'bg-amber-500 text-white shadow-amber-300'
              : state === 'speaking'
                ? 'bg-blue-500 text-white shadow-blue-300'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={isActive ? 'Cancel' : 'Start voice command'}
      >
        {state === 'listening' && <Mic className="h-7 w-7" />}
        {state === 'processing' && <Loader2 className="h-7 w-7 animate-spin" />}
        {state === 'speaking' && <Volume2 className="h-7 w-7" />}
        {state === 'idle' && <Mic className="h-7 w-7" />}
      </button>

      {isActive && (
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shadow hover:bg-slate-300 transition-colors"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
