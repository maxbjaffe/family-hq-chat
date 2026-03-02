"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActiveTimer {
  sessionId: string;
  childId: string;
  childName: string;
  childAvatar: string | null;
  breakId: string;
  breakName: string;
  breakEmoji: string;
  totalSeconds: number;
  remainingSeconds: number;
  pausedDuration: number;
  status: "running" | "paused" | "complete";
}

interface RechargeTimerContextValue {
  timers: ActiveTimer[];
  pauseTimer: (sessionId: string) => void;
  resumeTimer: (sessionId: string) => void;
  endTimer: (sessionId: string, rating?: number) => Promise<void>;
  expandedTimer: string | null;
  setExpandedTimer: (sessionId: string | null) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const RechargeTimerContext = createContext<RechargeTimerContextValue | null>(
  null
);

export function useRechargeTimers() {
  const ctx = useContext(RechargeTimerContext);
  if (!ctx) {
    throw new Error(
      "useRechargeTimers must be used within a RechargeTimerProvider"
    );
  }
  return ctx;
}

// ─── Custom event detail shape ───────────────────────────────────────────────

interface RechargeStartDetail {
  sessionId: string;
  childId: string;
  childName: string;
  childAvatar: string | null;
  breakId: string;
  breakName: string;
  breakEmoji: string;
  durationSeconds: number;
}

// ─── Provider ────────────────────────────────────────────────────────────────

const MAX_CONCURRENT = 3;

export function RechargeTimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [expandedTimer, setExpandedTimer] = useState<string | null>(null);
  const pauseStartRef = useRef<Record<string, number>>({});

  // ── Listen for "recharge:start" events ──────────────────────────────────

  useEffect(() => {
    function handleStart(e: Event) {
      const detail = (e as CustomEvent<RechargeStartDetail>).detail;

      setTimers((prev) => {
        // Prevent duplicate for same child
        if (prev.some((t) => t.childId === detail.childId)) {
          return prev;
        }
        // Cap at MAX_CONCURRENT
        if (prev.length >= MAX_CONCURRENT) {
          return prev;
        }

        const newTimer: ActiveTimer = {
          sessionId: detail.sessionId,
          childId: detail.childId,
          childName: detail.childName,
          childAvatar: detail.childAvatar,
          breakId: detail.breakId,
          breakName: detail.breakName,
          breakEmoji: detail.breakEmoji,
          totalSeconds: detail.durationSeconds,
          remainingSeconds: detail.durationSeconds,
          pausedDuration: 0,
          status: "running",
        };

        return [...prev, newTimer];
      });
    }

    window.addEventListener("recharge:start", handleStart);
    return () => window.removeEventListener("recharge:start", handleStart);
  }, []);

  // ── Tick running timers every second ────────────────────────────────────

  useEffect(() => {
    if (timers.length === 0) return;

    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (t.status !== "running") return t;
          const next = t.remainingSeconds - 1;
          if (next <= 0) {
            return { ...t, remainingSeconds: 0, status: "complete" as const };
          }
          return { ...t, remainingSeconds: next };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers.length]);

  // ── Auto-expand on completion ───────────────────────────────────────────

  useEffect(() => {
    const justCompleted = timers.find((t) => t.status === "complete");
    if (justCompleted && !expandedTimer) {
      setExpandedTimer(justCompleted.sessionId);
    }
  }, [timers, expandedTimer]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const pauseTimer = useCallback((sessionId: string) => {
    pauseStartRef.current[sessionId] = Date.now();
    setTimers((prev) =>
      prev.map((t) =>
        t.sessionId === sessionId ? { ...t, status: "paused" as const } : t
      )
    );
  }, []);

  const resumeTimer = useCallback((sessionId: string) => {
    const pauseStart = pauseStartRef.current[sessionId];
    const pausedMs = pauseStart ? Date.now() - pauseStart : 0;
    delete pauseStartRef.current[sessionId];

    setTimers((prev) =>
      prev.map((t) =>
        t.sessionId === sessionId
          ? {
              ...t,
              status: "running" as const,
              pausedDuration: t.pausedDuration + Math.round(pausedMs / 1000),
            }
          : t
      )
    );
  }, []);

  const endTimer = useCallback(
    async (sessionId: string, rating?: number) => {
      const timer = timers.find((t) => t.sessionId === sessionId);
      if (!timer) return;

      const durationActual = timer.totalSeconds - timer.remainingSeconds;

      try {
        await fetch("/api/recharge/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            completed: timer.status === "complete",
            duration_actual: durationActual,
            paused_duration: timer.pausedDuration,
            rating,
          }),
        });
      } catch (error) {
        console.error("[RechargeTimer] Error completing session:", error);
      }

      // Remove from state
      setTimers((prev) => prev.filter((t) => t.sessionId !== sessionId));

      // Clear expanded if this was the expanded one
      if (expandedTimer === sessionId) {
        setExpandedTimer(null);
      }
    },
    [timers, expandedTimer]
  );

  return (
    <RechargeTimerContext.Provider
      value={{
        timers,
        pauseTimer,
        resumeTimer,
        endTimer,
        expandedTimer,
        setExpandedTimer,
      }}
    >
      {children}
    </RechargeTimerContext.Provider>
  );
}
