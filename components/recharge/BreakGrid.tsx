"use client";

import { ArrowLeft } from "lucide-react";
import { CATEGORY_CONFIG, type RechargeDuration, DURATION_LABELS } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";
import { BreakCard } from "./BreakCard";

interface BreakGridProps {
  breaks: RechargeBreak[];
  duration: RechargeDuration;
  onSelect: (breakItem: RechargeBreak) => void;
  onBack: () => void;
  kidName: string;
}

export function BreakGrid({
  breaks,
  duration,
  onSelect,
  onBack,
  kidName,
}: BreakGridProps) {
  // Filter breaks to selected duration
  const filtered = breaks.filter((b) => b.duration === duration);

  // Group by category
  const grouped = filtered.reduce(
    (acc, b) => {
      if (!acc[b.category]) acc[b.category] = [];
      acc[b.category].push(b);
      return acc;
    },
    {} as Record<string, RechargeBreak[]>
  );

  const categories = Object.keys(grouped) as Array<keyof typeof CATEGORY_CONFIG>;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          {DURATION_LABELS[duration]} breaks for {kidName}
        </h2>
        <p className="text-slate-500 mt-1">
          {filtered.length} {filtered.length === 1 ? "option" : "options"} available
        </p>
      </div>

      {categories.map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const items = grouped[cat];
        return (
          <div key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{config.icon}</span>
              <span className={`font-bold text-lg ${config.text}`}>
                {config.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.pill}`}
              >
                {items.length}
              </span>
            </div>

            {/* Break cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((breakItem) => (
                <BreakCard
                  key={breakItem.id}
                  breakItem={breakItem}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">No breaks for this duration yet</p>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="min-h-[48px] flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium mt-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Change Duration
      </button>
    </div>
  );
}
