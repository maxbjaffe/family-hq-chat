"use client";

import { ArrowLeft, Play } from "lucide-react";
import { CATEGORY_CONFIG, DURATION_LABELS, type RechargeDuration } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

interface BreakDetailProps {
  breakItem: RechargeBreak;
  onStart: (breakItem: RechargeBreak) => void;
  onBack: () => void;
}

export function BreakDetail({ breakItem, onStart, onBack }: BreakDetailProps) {
  const config = CATEGORY_CONFIG[breakItem.category];
  const durationLabel =
    DURATION_LABELS[breakItem.duration as RechargeDuration] ||
    `${breakItem.duration} min`;

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="min-h-[48px] flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium self-start"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </button>

      {/* Detail card */}
      <div
        className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6 md:p-8 flex flex-col items-center text-center gap-4`}
      >
        <span className="text-7xl">{breakItem.emoji}</span>

        <h2 className="text-3xl font-black text-slate-900">
          {breakItem.name}
        </h2>

        {/* Pills row */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${config.pill}`}
          >
            {config.icon} {config.label}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
            {durationLabel}
          </span>
        </div>

        {/* Description */}
        {breakItem.description && (
          <p className="text-slate-600 text-base max-w-md leading-relaxed">
            {breakItem.description}
          </p>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart(breakItem)}
        className="min-h-[72px] w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-2xl font-black flex items-center justify-center gap-3 hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        <Play className="h-7 w-7" />
        START
      </button>
    </div>
  );
}
