"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Minimize2, Pause, Play, Star } from "lucide-react";
import confetti from "canvas-confetti";
import { Avatar } from "@/components/Avatar";
import { useRechargeTimers, type ActiveTimer } from "./RechargeTimerContext";
import { ENCOURAGEMENT_MESSAGES, CELEBRATION_MESSAGES } from "./constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function progressFraction(timer: ActiveTimer): number {
  if (timer.totalSeconds === 0) return 1;
  return (timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TimerFullScreenProps {
  timer: ActiveTimer;
}

export function TimerFullScreen({ timer }: TimerFullScreenProps) {
  const { pauseTimer, resumeTimer, endTimer, setExpandedTimer } =
    useRechargeTimers();

  const [encouragement, setEncouragement] = useState(
    randomItem(ENCOURAGEMENT_MESSAGES)
  );
  const [rating, setRating] = useState(0);
  const [celebrationMsg] = useState(randomItem(CELEBRATION_MESSAGES));
  const confettiFired = useRef(false);

  const isComplete = timer.status === "complete";
  const isPaused = timer.status === "paused";

  // ── Rotate encouragement every 15s ──────────────────────────────────────

  useEffect(() => {
    if (isComplete || isPaused) return;

    const interval = setInterval(() => {
      setEncouragement(randomItem(ENCOURAGEMENT_MESSAGES));
    }, 15_000);

    return () => clearInterval(interval);
  }, [isComplete, isPaused]);

  // ── Fire confetti on completion ─────────────────────────────────────────

  useEffect(() => {
    if (!isComplete || confettiFired.current) return;
    confettiFired.current = true;

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [isComplete]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleDone = useCallback(() => {
    endTimer(timer.sessionId, rating > 0 ? rating : undefined);
  }, [endTimer, timer.sessionId, rating]);

  // ── SVG progress ring values ────────────────────────────────────────────

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progressFraction(timer));

  // ── Render ──────────────────────────────────────────────────────────────

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-900/95 to-emerald-900/95 z-[90] flex flex-col items-center justify-center px-6">
        {/* Minimize */}
        <button
          onClick={() => setExpandedTimer(null)}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <Minimize2 className="h-5 w-5" />
        </button>

        {/* Celebration */}
        <div className="text-6xl mb-4">{timer.breakEmoji}</div>
        <p className="text-3xl font-black text-white text-center mb-2 animate-bounce">
          {celebrationMsg}
        </p>
        <div className="flex items-center gap-2 mb-8">
          <Avatar
            member={{ name: timer.childName, role: "kid", avatar_url: timer.childAvatar }}
            size="sm"
            className="ring-2 ring-white/30"
          />
          <p className="text-white/70 text-lg">{timer.childName}</p>
        </div>

        {/* Star rating */}
        <p className="text-white/60 text-sm mb-3">How was it?</p>
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="min-h-[56px] min-w-[56px] flex items-center justify-center"
            >
              <Star
                className={`h-10 w-10 transition-all ${
                  star <= rating
                    ? "text-yellow-400 fill-yellow-400 scale-110"
                    : "text-white/30"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Done button */}
        <button
          onClick={handleDone}
          className="px-12 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl shadow-xl transition-all hover:scale-105"
        >
          Done
        </button>
      </div>
    );
  }

  // ── Active / Paused state ───────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 to-violet-900/95 z-[90] flex flex-col items-center justify-center px-6">
      {/* Minimize */}
      <button
        onClick={() => setExpandedTimer(null)}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <Minimize2 className="h-5 w-5" />
      </button>

      {/* Break emoji + name */}
      <div className="text-6xl mb-3">{timer.breakEmoji}</div>
      <h2 className="text-2xl font-bold text-white mb-1">{timer.breakName}</h2>
      <div className="flex items-center gap-2 mb-8">
        <Avatar
          member={{ name: timer.childName, role: "kid", avatar_url: timer.childAvatar }}
          size="xs"
          className="ring-2 ring-white/20"
        />
        <p className="text-white/60 text-sm">{timer.childName}</p>
      </div>

      {/* SVG progress ring + countdown */}
      <div className="relative mb-8">
        <svg
          viewBox="0 0 100 100"
          className="w-56 h-56 -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={isPaused ? "#f59e0b" : "#a855f7"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Countdown text centered inside ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl font-black text-white tabular-nums">
            {formatTime(timer.remainingSeconds)}
          </span>
        </div>
      </div>

      {/* Encouragement or paused message */}
      <p className="text-white/70 text-lg text-center mb-10 min-h-[28px] transition-opacity">
        {isPaused ? "⏸️ Paused" : encouragement}
      </p>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() =>
            isPaused
              ? resumeTimer(timer.sessionId)
              : pauseTimer(timer.sessionId)
          }
          className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all hover:scale-105 ${
            isPaused
              ? "bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900"
              : "bg-white/15 hover:bg-white/25 text-white"
          }`}
        >
          {isPaused ? (
            <span className="flex items-center gap-2">
              <Play className="h-5 w-5" /> Resume
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Pause className="h-5 w-5" /> Pause
            </span>
          )}
        </button>

        <button
          onClick={() => endTimer(timer.sessionId)}
          className="text-white/40 hover:text-white/70 text-sm underline underline-offset-2 transition-colors"
        >
          End Early
        </button>
      </div>
    </div>
  );
}
