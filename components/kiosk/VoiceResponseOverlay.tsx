'use client';

import { Mic, Loader2, Volume2 } from 'lucide-react';
import type { KioskJarvisState } from '@/hooks/useKioskJarvis';

interface VoiceResponseOverlayProps {
  state: KioskJarvisState;
  transcript: string;
  responseText: string;
  error: string | null;
  memberName: string;
}

export function VoiceResponseOverlay({
  state,
  transcript,
  responseText,
  error,
  memberName,
}: VoiceResponseOverlayProps) {
  if (state === 'idle' && !error) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center pointer-events-none">
      <div className="mx-4 max-w-lg w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-4 pointer-events-auto">
        {/* State indicator */}
        <div className="flex items-center gap-2 mb-2">
          {state === 'listening' && (
            <>
              <Mic className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-600">
                Listening to {memberName}...
              </span>
            </>
          )}
          {state === 'processing' && (
            <>
              <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
              <span className="text-sm font-medium text-amber-600">Thinking...</span>
            </>
          )}
          {state === 'speaking' && (
            <>
              <Volume2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">Jarvis</span>
            </>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <p className="text-slate-700 text-sm mb-1">
            <span className="font-semibold">{memberName}:</span> {transcript}
          </p>
        )}

        {/* Response */}
        {responseText && (state === 'speaking' || state === 'processing') && (
          <p className="text-blue-700 text-sm">
            <span className="font-semibold">Jarvis:</span> {responseText}
          </p>
        )}

        {/* Error */}
        {error && state === 'idle' && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}
