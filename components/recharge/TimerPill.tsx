"use client";

import { Pause, Play, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useRechargeTimers, type ActiveTimer } from "./RechargeTimerContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function progressPercent(timer: ActiveTimer): number {
  if (timer.totalSeconds === 0) return 100;
  return Math.round(
    ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TimerPillProps {
  timer: ActiveTimer;
}

export function TimerPill({ timer }: TimerPillProps) {
  const { pauseTimer, resumeTimer, endTimer, setExpandedTimer } =
    useRechargeTimers();

  const isRunning = timer.status === "running";
  const isPaused = timer.status === "paused";
  const isComplete = timer.status === "complete";

  // Color states
  const pillBg = isComplete
    ? "bg-green-50/95 border-green-300"
    : isPaused
      ? "bg-amber-50/95 border-amber-300"
      : "bg-white/95 border-purple-200";

  const textColor = isComplete
    ? "text-green-700"
    : isPaused
      ? "text-amber-700"
      : "text-purple-700";

  const barBg = isComplete
    ? "bg-green-400"
    : isPaused
      ? "bg-amber-400"
      : "bg-purple-500";

  return (
    <button
      onClick={() => setExpandedTimer(timer.sessionId)}
      className={`
        flex items-center gap-2 px-3 py-2 min-h-[56px]
        rounded-2xl shadow-lg backdrop-blur-sm border
        transition-all hover:shadow-xl hover:scale-[1.02]
        ${pillBg}
      `}
    >
      {/* Avatar */}
      <Avatar
        member={{
          name: timer.childName,
          role: "kid",
          avatar_url: timer.childAvatar,
        }}
        size="sm"
      />

      {/* Break emoji */}
      <span className="text-lg">{timer.breakEmoji}</span>

      {/* Countdown or "Done!" */}
      <span className={`font-bold tabular-nums text-sm min-w-[36px] ${textColor}`}>
        {isComplete ? "Done!" : formatTime(timer.remainingSeconds)}
      </span>

      {/* Mini progress bar */}
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barBg}`}
          style={{ width: `${progressPercent(timer)}%` }}
        />
      </div>

      {/* Quick controls */}
      {!isComplete && (
        <div className="flex items-center gap-1 ml-1">
          {/* Pause / Resume */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isRunning) pauseTimer(timer.sessionId);
              else resumeTimer(timer.sessionId);
            }}
            className={`p-1.5 rounded-full transition-colors ${
              isPaused
                ? "bg-amber-200 hover:bg-amber-300 text-amber-700"
                : "bg-purple-100 hover:bg-purple-200 text-purple-600"
            }`}
          >
            {isRunning ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>

          {/* End early */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              endTimer(timer.sessionId);
            }}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </button>
  );
}
