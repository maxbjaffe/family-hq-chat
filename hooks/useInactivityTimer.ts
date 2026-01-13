"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UseInactivityTimerOptions {
  timeoutMinutes?: number; // Default 7 minutes
  warningSeconds?: number; // Warning shown at this many seconds remaining (default 60)
  enabled?: boolean;
  excludePaths?: string[]; // Paths where timer is disabled (e.g., admin)
}

interface InactivityTimerState {
  isWarningVisible: boolean;
  secondsRemaining: number;
  resetTimer: () => void;
  isEnabled: boolean;
}

export function useInactivityTimer({
  timeoutMinutes = 7,
  warningSeconds = 60,
  enabled = true,
  excludePaths = ["/admin"],
}: UseInactivityTimerOptions = {}): InactivityTimerState {
  const router = useRouter();
  const pathname = usePathname();
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningSeconds * 1000;

  // Check if timer should be active on current path
  const isExcludedPath = excludePaths.some((path) => pathname.startsWith(path));
  const isTimerEnabled = enabled && !isExcludedPath && pathname !== "/";

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarningVisible(false);
    setSecondsRemaining(warningSeconds);

    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, [warningSeconds]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isTimerEnabled) {
      resetTimer();
      return;
    }

    // Set up activity listeners
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "touchmove",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Main timer check
    const checkInactivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = timeoutMs - elapsed;

      if (remaining <= 0) {
        // Time's up - return to home
        router.replace("/");
        resetTimer();
      } else if (remaining <= warningMs && !isWarningVisible) {
        // Show warning
        setIsWarningVisible(true);
        setSecondsRemaining(Math.ceil(remaining / 1000));

        // Start countdown
        countdownRef.current = setInterval(() => {
          const newRemaining = timeoutMs - (Date.now() - lastActivityRef.current);
          if (newRemaining <= 0) {
            router.replace("/");
            resetTimer();
          } else {
            setSecondsRemaining(Math.ceil(newRemaining / 1000));
          }
        }, 1000);
      }
    };

    // Check every second
    timerRef.current = setInterval(checkInactivity, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [
    isTimerEnabled,
    timeoutMs,
    warningMs,
    isWarningVisible,
    router,
    handleActivity,
    resetTimer,
  ]);

  return {
    isWarningVisible: isTimerEnabled && isWarningVisible,
    secondsRemaining,
    resetTimer,
    isEnabled: isTimerEnabled,
  };
}
