'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DailyState,
  MealCategory,
  MeterValues,
  NutritionFood,
  PowerUpSuggestion as PowerUpSuggestionType,
} from '@/lib/nutrition/types';
import { MEAL_TABS } from '@/lib/nutrition/constants';
import {
  toPercentages,
  previewFoodImpact,
  getPowerUpSuggestions,
} from '@/lib/nutrition/engine';
import { FOOD_DATABASE } from '@/lib/nutrition/food-data';
import { NutritionAvatar } from './NutritionAvatar';
import { NutritionMeters } from './NutritionMeters';
import { FoodCard } from './FoodCard';
import { FoodPreview } from './FoodPreview';
import { PowerUpSuggestionStrip } from './PowerUpSuggestion';

interface NutritionLoggerProps {
  memberId: string;
  kidName: string;
  onBack: () => void;
}

/** Determine the default meal tab based on current time of day. */
function getDefaultMealTab(): MealCategory {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 14) return 'lunch';
  if (hour < 17) return 'snack';
  return 'dinner';
}

/** Convert a DailyState to MeterValues for the engine. */
function stateToTotals(state: DailyState): MeterValues {
  return {
    protein: state.protein_total,
    veggie: state.veggie_total,
    sugar: state.sugar_total,
    water: state.water_total,
    vitamin: state.vitamin_total,
  };
}

/** Map the static food seed data to NutritionFood shape for fallback use. */
function seedToFoods(): NutritionFood[] {
  return FOOD_DATABASE.map((item, idx) => ({
    id: `local-${idx}`,
    name: item.name,
    emoji: item.emoji,
    image_url: null,
    meal_categories: item.meal_categories,
    protein_score: item.protein_score,
    veggie_score: item.veggie_score,
    sugar_score: item.sugar_score,
    water_score: item.water_score,
    vitamin_score: item.vitamin_score,
  }));
}

const DEFAULT_STATE: DailyState = {
  member_id: '',
  date: new Date().toISOString().split('T')[0],
  protein_total: 0,
  veggie_total: 0,
  sugar_total: 0,
  water_total: 0,
  vitamin_total: 0,
  avatar_state: 'pebble',
};

export function NutritionLogger({ memberId, kidName, onBack }: NutritionLoggerProps) {
  const [activeTab, setActiveTab] = useState<MealCategory>(getDefaultMealTab);
  const [state, setState] = useState<DailyState | null>(null);
  const [waterCount, setWaterCount] = useState(0);
  const [selectedFood, setSelectedFood] = useState<NutritionFood | null>(null);
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------

  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/nutrition/state/${memberId}`);
      if (!res.ok) throw new Error('state fetch failed');
      const data = await res.json();
      setState(data.state);
      setWaterCount(data.waterCount ?? 0);
    } catch {
      // Use default zeroed state on error
      setState({ ...DEFAULT_STATE, member_id: memberId });
    }
  }, [memberId]);

  const loadFoods = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/foods');
      if (!res.ok) throw new Error('foods fetch failed');
      const data = await res.json();
      if (data.foods && data.foods.length > 0) {
        setFoods(data.foods);
      } else {
        setFoods(seedToFoods());
      }
    } catch {
      // Fall back to static seed data
      setFoods(seedToFoods());
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadState(), loadFoods()]);
      setLoading(false);
    }
    init();
  }, [loadState, loadFoods]);

  // -------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------

  const effectiveState = state ?? { ...DEFAULT_STATE, member_id: memberId };
  const totals = stateToTotals(effectiveState);
  const percentages = toPercentages(totals);

  // Filter foods by active meal tab
  const filteredFoods = foods.filter((f) =>
    f.meal_categories.includes(activeTab)
  );

  // Power-up suggestions for current state + tab
  const suggestions: PowerUpSuggestionType[] =
    foods.length > 0
      ? getPowerUpSuggestions(totals, foods, activeTab)
      : [];

  // Build a Set of suggested food IDs for highlighting
  const suggestedIds = new Set(suggestions.map((s) => s.food.id));

  // Food impact preview (when a food is selected)
  const foodImpact = selectedFood
    ? previewFoodImpact(totals, selectedFood)
    : null;

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  const handleConfirm = useCallback(async () => {
    if (!selectedFood) return;

    try {
      await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          foodId: selectedFood.id,
          mealCategory: activeTab,
        }),
      });
    } catch {
      // silent fail — state will refresh anyway
    }

    setSelectedFood(null);
    loadState();
  }, [selectedFood, memberId, activeTab, loadState]);

  const handleWater = useCallback(async () => {
    // Optimistic update
    setWaterCount((c) => c + 1);

    try {
      await fetch('/api/nutrition/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
    } catch {
      // silent fail
    }

    loadState();
  }, [memberId, loadState]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full" />
        <p className="text-slate-500 mt-3 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ----------------------------------------------------------------
          Header bar
      ----------------------------------------------------------------- */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={onBack}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>

          {/* Avatar */}
          <NutritionAvatar
            kidName={kidName}
            state={effectiveState.avatar_state}
            totals={totals}
            size="md"
            showMessage
          />

          {/* Meters */}
          <NutritionMeters
            percentages={percentages}
            variant="full"
            className="flex-1"
          />

          {/* Water button */}
          <button
            onClick={handleWater}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl',
              'bg-cyan-50 border border-cyan-200',
              'hover:bg-cyan-100 active:scale-95 transition-all',
              'min-h-[48px]'
            )}
            aria-label="Log water"
          >
            <Droplets className="w-5 h-5 text-cyan-600" />
            <span className="text-xs font-bold text-cyan-700">{waterCount}</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Power-up suggestion strip
      ----------------------------------------------------------------- */}
      <PowerUpSuggestionStrip
        suggestions={suggestions}
        onTapFood={setSelectedFood}
        className="mx-4 mt-3"
      />

      {/* ----------------------------------------------------------------
          Meal tabs
      ----------------------------------------------------------------- */}
      <div className="flex gap-1 px-4 mt-3 overflow-x-auto">
        {MEAL_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
              'min-h-[44px] transition-all duration-200',
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------
          Food grid
      ----------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filteredFoods.length === 0 ? (
          <p className="text-center text-slate-400 mt-8 text-sm">
            No foods for this meal yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filteredFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onTap={setSelectedFood}
                highlighted={suggestedIds.has(food.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------
          Food preview bottom sheet
      ----------------------------------------------------------------- */}
      {selectedFood && foodImpact && (
        <FoodPreview
          food={selectedFood}
          kidName={kidName}
          before={foodImpact.before}
          after={foodImpact.after}
          stateBefore={foodImpact.stateBefore}
          stateAfter={foodImpact.stateAfter}
          onConfirm={handleConfirm}
          onCancel={() => setSelectedFood(null)}
        />
      )}
    </div>
  );
}

export type { NutritionLoggerProps };
