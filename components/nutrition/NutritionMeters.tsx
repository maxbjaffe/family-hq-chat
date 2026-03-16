'use client';

import { cn } from '@/lib/utils';
import type { MeterPercentages, NutrientKey } from '@/lib/nutrition/types';
import { METER_CONFIG } from '@/lib/nutrition/constants';

interface NutritionMetersProps {
  percentages: MeterPercentages;
  variant?: 'full' | 'mini';
  className?: string;
}

const METER_ORDER: NutrientKey[] = ['protein', 'veggie', 'sugar', 'water', 'vitamin'];

/**
 * Get the bar color for the sugar meter based on percentage.
 * Shifts from green to red as sugar intake rises.
 */
function getSugarColor(pct: number): string {
  if (pct < 40) return '#22c55e';
  if (pct < 60) return '#eab308';
  if (pct < 80) return '#f97316';
  return '#ef4444';
}

function MiniMeters({ percentages, className }: { percentages: MeterPercentages; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {METER_ORDER.map((key) => {
        const pct = percentages[key];
        const config = METER_CONFIG[key];
        // At 0% show slate gray, otherwise the meter color with opacity based on fill
        const isZero = pct <= 0;
        const opacity = isZero ? 1 : Math.max(0.3, Math.min(1, pct / 100));

        return (
          <div
            key={key}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: isZero ? '#e2e8f0' : config.color,
              opacity: isZero ? 1 : opacity,
            }}
            title={`${config.label}: ${Math.round(pct)}%`}
          />
        );
      })}
    </div>
  );
}

function FullMeters({ percentages, className }: { percentages: MeterPercentages; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {METER_ORDER.map((key) => {
        const rawPct = percentages[key];
        const config = METER_CONFIG[key];
        // Cap display at 100 for bar width and text
        const displayPct = Math.min(100, Math.round(rawPct));
        // Sugar gets a dynamic color, all others use their config color
        const barColor = key === 'sugar' ? getSugarColor(rawPct) : config.color;

        return (
          <div key={key} className="flex items-center gap-2">
            {/* Emoji label */}
            <span className="w-5 text-center text-sm" title={config.label}>
              {config.emoji}
            </span>

            {/* Progress bar */}
            <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${displayPct}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>

            {/* Percentage text */}
            <span className="w-8 text-xs text-right font-medium text-slate-600">
              {displayPct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function NutritionMeters({
  percentages,
  variant = 'full',
  className,
}: NutritionMetersProps) {
  if (variant === 'mini') {
    return <MiniMeters percentages={percentages} className={className} />;
  }
  return <FullMeters percentages={percentages} className={className} />;
}

export type { NutritionMetersProps };
