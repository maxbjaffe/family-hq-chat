"use client";

import { useRechargeTimers } from "./RechargeTimerContext";
import { TimerPill } from "./TimerPill";
import { TimerFullScreen } from "./TimerFullScreen";

export function TimerOverlay() {
  const { timers, expandedTimer } = useRechargeTimers();

  if (timers.length === 0) return null;

  const expandedTimerObj = expandedTimer
    ? timers.find((t) => t.sessionId === expandedTimer)
    : null;

  return (
    <>
      {/* Floating pill stack */}
      <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2">
        {timers.map((timer) => (
          <TimerPill key={timer.sessionId} timer={timer} />
        ))}
      </div>

      {/* Full-screen overlay for expanded timer */}
      {expandedTimerObj && <TimerFullScreen timer={expandedTimerObj} />}
    </>
  );
}
