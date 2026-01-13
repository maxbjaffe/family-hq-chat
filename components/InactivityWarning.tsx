"use client";

import { useEffect } from "react";
import { Home, Clock } from "lucide-react";

interface InactivityWarningProps {
  isVisible: boolean;
  secondsRemaining: number;
  onDismiss: () => void;
}

export function InactivityWarning({
  isVisible,
  secondsRemaining,
  onDismiss,
}: InactivityWarningProps) {
  // Play a gentle chime when warning appears
  useEffect(() => {
    if (isVisible && secondsRemaining === 60) {
      // Create a simple beep using Web Audio API
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440; // A4 note
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch {
        // Audio not available (DakBoard, iframe, etc.), that's okay
      }
    }
  }, [isVisible, secondsRemaining]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[200] animate-fade-in"
        onClick={onDismiss}
      />

      {/* Warning Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[201] pointer-events-none">
        <div
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 pointer-events-auto animate-bounce-in"
          onClick={onDismiss}
        >
          {/* Animated Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                <Home className="w-10 h-10 text-purple-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm animate-bounce">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h2
            className="text-2xl font-black text-center text-slate-800 mb-2"
            style={{
              fontFamily:
                "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
            }}
          >
            Going Home Soon!
          </h2>

          <p className="text-center text-slate-600 mb-4">
            Tap anywhere to stay on this page
          </p>

          {/* Countdown */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl px-6 py-3">
              <span className="text-white text-3xl font-bold tabular-nums">
                {secondsRemaining}
              </span>
              <span className="text-white/80 text-lg ml-2">seconds</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsRemaining / 60) * 100}%` }}
            />
          </div>

          {/* Tap hint */}
          <p className="text-center text-sm text-slate-400 mt-4 animate-pulse">
            Tap to dismiss
          </p>
        </div>
      </div>
    </>
  );
}
