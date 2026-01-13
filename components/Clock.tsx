"use client";

import { useState, useEffect } from "react";

interface ClockProps {
  className?: string;
  showDate?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Clock({ className = "", showDate = false, size = "md" }: ClockProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client
    setTime(new Date());

    // Update every second for smooth updates
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render until client-side to avoid hydration mismatch
  if (!time) {
    return (
      <div className={`${className}`}>
        <div className={`${size === "lg" ? "text-5xl" : size === "md" ? "text-3xl" : "text-xl"} font-bold tabular-nums text-transparent bg-slate-200 rounded animate-pulse`}>
          00:00 AM
        </div>
      </div>
    );
  }

  const timeString = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateString = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl md:text-6xl",
  };

  return (
    <div className={`${className}`}>
      <div
        className={`${sizeClasses[size]} font-bold tabular-nums bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}
      >
        {timeString}
      </div>
      {showDate && (
        <div className="text-slate-500 text-sm mt-1">{dateString}</div>
      )}
    </div>
  );
}

// Compact clock for header
export function HeaderClock({ className = "" }: { className?: string }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const timeString = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className={`text-lg font-semibold tabular-nums text-slate-700 ${className}`}
    >
      {timeString}
    </div>
  );
}
