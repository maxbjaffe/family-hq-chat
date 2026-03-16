'use client';

import { cn } from '@/lib/utils';
import type {
  AvatarState,
  MeterPercentages,
  NutritionFood,
  NutrientKey,
} from '@/lib/nutrition/types';
import { METER_CONFIG } from '@/lib/nutrition/constants';
import { NutritionAvatar } from './NutritionAvatar';
import { NutritionMeters } from './NutritionMeters';

interface FoodPreviewProps {
  food: NutritionFood;
  kidName: string;
  before: MeterPercentages;
  after: MeterPercentages;
  stateBefore: AvatarState;
  stateAfter: AvatarState;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The score keys on NutritionFood that map to nutrient meters. */
const SCORE_KEYS: { scoreKey: keyof NutritionFood; nutrientKey: NutrientKey }[] = [
  { scoreKey: 'protein_score', nutrientKey: 'protein' },
  { scoreKey: 'veggie_score', nutrientKey: 'veggie' },
  { scoreKey: 'sugar_score', nutrientKey: 'sugar' },
  { scoreKey: 'water_score', nutrientKey: 'water' },
  { scoreKey: 'vitamin_score', nutrientKey: 'vitamin' },
];

export function FoodPreview({
  food,
  kidName,
  before,
  after,
  stateBefore,
  stateAfter,
  onConfirm,
  onCancel,
}: FoodPreviewProps) {
  const stateChanged = stateBefore !== stateAfter;

  // Build contribution dots for non-zero scores
  const contributions = SCORE_KEYS.filter(
    ({ scoreKey }) => (food[scoreKey] as number) > 0
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'animate-in slide-in-from-bottom duration-300'
        )}
      >
        <div className="bg-white rounded-t-2xl shadow-2xl p-6 pb-8 max-w-lg mx-auto">
          {/* Food header */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-4xl">{food.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{food.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                {contributions.map(({ nutrientKey }) => (
                  <div
                    key={nutrientKey}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: METER_CONFIG[nutrientKey].color }}
                    title={METER_CONFIG[nutrientKey].label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Before / After meters */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 text-center">
                Before
              </p>
              <NutritionMeters percentages={before} variant="full" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 text-center">
                After
              </p>
              <NutritionMeters percentages={after} variant="full" />
            </div>
          </div>

          {/* Avatar state change preview */}
          {stateChanged && (
            <div className="flex items-center justify-center gap-3 mb-5 py-3 bg-purple-50 rounded-xl">
              <NutritionAvatar kidName={kidName} state={stateBefore} size="sm" />
              <span className="text-xl text-slate-400">{'\u2192'}</span>
              <NutritionAvatar kidName={kidName} state={stateAfter} size="sm" />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={cn(
                'flex-1 min-h-[48px] rounded-xl border border-slate-300',
                'text-slate-600 font-medium',
                'hover:bg-slate-50 active:scale-95 transition-all duration-200'
              )}
            >
              Back
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                'flex-1 min-h-[48px] rounded-xl',
                'bg-purple-600 text-white font-bold',
                'hover:bg-purple-700 active:scale-95 transition-all duration-200'
              )}
            >
              Log it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export type { FoodPreviewProps };
