"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { InactivityWarning } from "./InactivityWarning";
import { KioskModeIndicator } from "./FullscreenButton";

interface KioskContextType {
  isKioskMode: boolean;
  isEmbedded: boolean; // true when in iframe (e.g., DakBoard)
  enterKioskMode: () => Promise<void>;
  exitKioskMode: () => Promise<void>;
  inactivityTimeoutMinutes: number;
  setInactivityTimeoutMinutes: (minutes: number) => void;
}

const KioskContext = createContext<KioskContextType | null>(null);

export function useKiosk() {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error("useKiosk must be used within a KioskProvider");
  }
  return context;
}

interface KioskProviderProps {
  children: React.ReactNode;
}

export function KioskProvider({ children }: KioskProviderProps) {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(10);

  // Detect if running in iframe (DakBoard embed)
  useEffect(() => {
    try {
      const inIframe = window.self !== window.top;
      setIsEmbedded(inIframe);
      if (inIframe) {
        console.log("Running in iframe mode (DakBoard embed detected)");
      }
    } catch {
      // If we can't access window.top, we're likely in a sandboxed iframe
      setIsEmbedded(true);
    }
  }, []);

  const { isWarningVisible, secondsRemaining, resetTimer, isEnabled } =
    useInactivityTimer({
      timeoutMinutes: inactivityTimeoutMinutes,
      warningSeconds: 60,
      enabled: true,
      excludePaths: ["/admin"],
    });

  const enterKioskMode = useCallback(async () => {
    try {
      // Check if fullscreen is supported (not in iframe or restricted browser)
      if (document.fullscreenEnabled) {
        await document.documentElement.requestFullscreen();
        setIsKioskMode(true);
      } else {
        // Fullscreen not available (iframe, DakBoard embed, etc.)
        // Still enable kiosk behaviors without fullscreen
        setIsKioskMode(true);
        console.log("Fullscreen not available, enabling kiosk behaviors only");
      }
    } catch (err) {
      // Even if fullscreen fails, enable kiosk behaviors
      setIsKioskMode(true);
      console.error("Failed to enter fullscreen, kiosk mode still active:", err);
    }
  }, []);

  const exitKioskMode = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsKioskMode(false);
    } catch (err) {
      console.error("Failed to exit kiosk mode:", err);
    }
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
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
      const blockedKeys = ["F11", "Escape", "F5", "F12"];
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

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isKioskMode]);

  return (
    <KioskContext.Provider
      value={{
        isKioskMode,
        isEmbedded,
        enterKioskMode,
        exitKioskMode,
        inactivityTimeoutMinutes,
        setInactivityTimeoutMinutes,
      }}
    >
      {children}
      <InactivityWarning
        isVisible={isWarningVisible}
        secondsRemaining={secondsRemaining}
        onDismiss={resetTimer}
      />
      <KioskModeIndicator isActive={isKioskMode} />
    </KioskContext.Provider>
  );
}
