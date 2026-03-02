"use client";

import { Button } from "@/components/ui/button";
import { Shuffle, ArrowLeft } from "lucide-react";
import {
  DURATIONS,
  DURATION_LABELS,
  DURATION_DESCRIPTIONS,
  type RechargeDuration,
} from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

interface DurationPickerProps {
  breaks: RechargeBreak[];
  onSelect: (duration: RechargeDuration) => void;
  onSurprise: () => void;
  onBack: () => void;
  kidName: string;
}

export function DurationPicker({
  breaks,
  onSelect,
  onSurprise,
  onBack,
  kidName,
}: DurationPickerProps) {
  // Count breaks per duration
  const countByDuration = (d: RechargeDuration) =>
    breaks.filter((b) => b.duration === d).length;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          How much time, {kidName}?
        </h2>
      </div>

      {/* 2x2 grid of duration buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-4">
        {DURATIONS.map((d) => {
          const count = countByDuration(d);
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className="min-h-[120px] rounded-2xl border-2 border-purple-200 bg-white hover:border-purple-400 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-1 p-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <span className="text-3xl font-black text-slate-900">
                {DURATION_LABELS[d]}
              </span>
              <span className="text-sm text-slate-500">
                {DURATION_DESCRIPTIONS[d]}
              </span>
              <span className="mt-1 px-3 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                {count} {count === 1 ? "break" : "breaks"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Surprise Me button */}
      <button
        onClick={onSurprise}
        className="min-h-[60px] w-full max-w-md rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:from-purple-600 hover:to-violet-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        <Shuffle className="h-5 w-5" />
        Surprise Me!
      </button>

      {/* Back button */}
      <button
        onClick={onBack}
        className="min-h-[48px] flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
    </div>
  );
}
