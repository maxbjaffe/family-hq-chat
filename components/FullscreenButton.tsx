"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Maximize, Minimize, Lock, Unlock } from "lucide-react";

interface FullscreenButtonProps {
  className?: string;
}

// Secret exit sequence: tap logo 5 times within 3 seconds
const EXIT_TAP_COUNT = 5;
const EXIT_TAP_WINDOW = 3000;

export function FullscreenButton({ className = "" }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setIsKioskMode(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Prevent keyboard shortcuts in kiosk mode
  useEffect(() => {
    if (!isKioskMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common exit/navigation keys
      const blockedKeys = [
        "F11",
        "Escape",
        "F5",
        "F12",
      ];
      const blockedCombos = [
        { key: "Tab", alt: true },
        { key: "F4", alt: true },
        { key: "w", ctrl: true },
        { key: "t", ctrl: true },
        { key: "n", ctrl: true },
        { key: "r", ctrl: true },
        { key: "l", ctrl: true },
        { key: "d", ctrl: true },
      ];

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      for (const combo of blockedCombos) {
        if (
          e.key.toLowerCase() === combo.key.toLowerCase() &&
          ((combo.alt && e.altKey) || (combo.ctrl && e.ctrlKey))
        ) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent window from being closed/navigated away
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isKioskMode]);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsKioskMode(true);
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsKioskMode(false);
    } catch (err) {
      console.error("Failed to exit fullscreen:", err);
    }
  }, []);

  return (
    <button
      onClick={isFullscreen ? exitFullscreen : enterFullscreen}
      className={`inline-flex items-center justify-center min-h-[48px] min-w-[48px] p-3 rounded-xl transition-all ${
        isKioskMode
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      } ${className}`}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Kiosk Mode"}
    >
      {isFullscreen ? (
        <>
          {isKioskMode ? (
            <Lock className="h-5 w-5" />
          ) : (
            <Minimize className="h-5 w-5" />
          )}
        </>
      ) : (
        <Maximize className="h-5 w-5" />
      )}
    </button>
  );
}

// Logo component that can be tapped to exit kiosk mode
interface KioskExitLogoProps {
  children: React.ReactNode;
  onExitKiosk: () => void;
  className?: string;
}

export function KioskExitLogo({
  children,
  onExitKiosk,
  className = "",
}: KioskExitLogoProps) {
  const tapTimesRef = useRef<number[]>([]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    // Remove taps outside the window
    tapTimesRef.current = tapTimesRef.current.filter(
      (time) => now - time < EXIT_TAP_WINDOW
    );
    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length >= EXIT_TAP_COUNT) {
      tapTimesRef.current = [];
      onExitKiosk();
    }
  }, [onExitKiosk]);

  return (
    <div onClick={handleTap} className={className}>
      {children}
    </div>
  );
}

// Kiosk mode indicator
export function KioskModeIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-2 right-2 z-[100] flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium opacity-50 hover:opacity-100 transition-opacity">
      <Lock className="h-3 w-3" />
      <span>Kiosk Mode</span>
    </div>
  );
}
