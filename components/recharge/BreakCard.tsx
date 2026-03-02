"use client";

import { CATEGORY_CONFIG } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

interface BreakCardProps {
  breakItem: RechargeBreak;
  onSelect: (breakItem: RechargeBreak) => void;
}

export function BreakCard({ breakItem, onSelect }: BreakCardProps) {
  const config = CATEGORY_CONFIG[breakItem.category];

  return (
    <button
      onClick={() => onSelect(breakItem)}
      className={`w-full rounded-2xl border-2 ${config.border} ${config.bg} p-4 flex items-center gap-4 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[48px]`}
    >
      <span className="text-4xl flex-shrink-0">{breakItem.emoji}</span>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-bold text-lg text-slate-900">{breakItem.name}</p>
        {breakItem.description && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {breakItem.description}
          </p>
        )}
      </div>
    </button>
  );
}
