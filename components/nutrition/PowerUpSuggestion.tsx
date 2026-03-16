'use client';

import { cn } from '@/lib/utils';
import type { NutritionFood, PowerUpSuggestion } from '@/lib/nutrition/types';
import { METER_CONFIG } from '@/lib/nutrition/constants';

interface PowerUpSuggestionProps {
  suggestions: PowerUpSuggestion[];
  onTapFood: (food: NutritionFood) => void;
  className?: string;
}

export function PowerUpSuggestionStrip({
  suggestions,
  onTapFood,
  className,
}: PowerUpSuggestionProps) {
  if (suggestions.length === 0) return null;

  // Use the first suggestion's reason as the header message
  const message = suggestions[0].reason;

  return (
    <div className={cn('bg-purple-50 rounded-xl p-3', className)}>
      {/* Header message */}
      <p className="text-xs font-medium text-purple-700 mb-2">{message}</p>

      {/* Horizontal scroll row */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {suggestions.map((suggestion) => {
          const meterConfig = METER_CONFIG[suggestion.targetMeter];

          return (
            <button
              key={suggestion.food.id}
              onClick={() => onTapFood(suggestion.food)}
              className={cn(
                'flex items-center gap-2 flex-shrink-0',
                'bg-white rounded-lg px-3 py-2 shadow-sm',
                'border border-purple-200 hover:border-purple-400',
                'active:scale-95 transition-all duration-200',
                'min-h-[48px]'
              )}
            >
              <span className="text-xl leading-none">{suggestion.food.emoji}</span>
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                {suggestion.food.name}
              </span>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: meterConfig.color }}
                title={meterConfig.label}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { PowerUpSuggestionProps };
