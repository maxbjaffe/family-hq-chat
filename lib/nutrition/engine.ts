// Nutrition Tracker — Avatar State Engine (pure functions)

import { DAILY_TARGETS, THRESHOLDS } from './constants';
import type {
  AvatarState,
  FoodImpact,
  MealCategory,
  MeterPercentages,
  MeterValues,
  NutrientKey,
  NutritionFood,
  PowerUpSuggestion,
} from './types';

/** The four "normal" (non-sugar) meters used for state calculations. */
const NORMAL_METERS: NutrientKey[] = ['protein', 'veggie', 'water', 'vitamin'];

// ---------------------------------------------------------------------------
// Meter math
// ---------------------------------------------------------------------------

/**
 * Convert raw nutrient totals to percentages of daily targets.
 * All meters are capped at 100 except sugar, which can exceed 100.
 */
export function toPercentages(totals: MeterValues): MeterPercentages {
  return {
    protein: Math.min(100, (totals.protein / DAILY_TARGETS.protein) * 100),
    veggie: Math.min(100, (totals.veggie / DAILY_TARGETS.veggie) * 100),
    sugar: (totals.sugar / DAILY_TARGETS.sugar) * 100, // can exceed 100
    water: Math.min(100, (totals.water / DAILY_TARGETS.water) * 100),
    vitamin: Math.min(100, (totals.vitamin / DAILY_TARGETS.vitamin) * 100),
  };
}

// ---------------------------------------------------------------------------
// Avatar state
// ---------------------------------------------------------------------------

/**
 * Determine the avatar state from raw totals using the priority cascade:
 *
 * 1. Fizzy  — sugar > 70 %
 * 2. Pebble — 2+ normal meters below 25 %
 * 3. Flicker — exactly 1 normal meter below 25 %
 * 4. Glow   — all normal meters > 25 % but not all > 60 %
 * 5. Sunbeam — all normal meters > 60 % AND sugar <= 70 %
 */
export function calculateAvatarState(totals: MeterValues): AvatarState {
  const pct = toPercentages(totals);

  // 1. Fizzy — too much sugar
  if (pct.sugar > THRESHOLDS.FIZZY_SUGAR) {
    return 'fizzy';
  }

  // Count how many normal meters are below the LOW threshold
  const lowCount = NORMAL_METERS.filter(
    (k) => pct[k] < THRESHOLDS.LOW_METER
  ).length;

  // 2. Pebble — multiple meters critically low
  if (lowCount >= THRESHOLDS.PEBBLE_COUNT) {
    return 'pebble';
  }

  // 3. Flicker — one meter lagging
  if (lowCount === 1) {
    return 'flicker';
  }

  // All normal meters are >= 25 %. Check if ALL are above the HIGH threshold.
  const allHigh = NORMAL_METERS.every((k) => pct[k] > THRESHOLDS.HIGH_METER);

  // 5. Sunbeam — everything is great
  if (allHigh && pct.sugar <= THRESHOLDS.FIZZY_SUGAR) {
    return 'sunbeam';
  }

  // 4. Glow — solid but not perfect
  return 'glow';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the nutrient key of the lowest non-sugar meter.
 * Used to drive the "needs bubble" hint on the avatar.
 */
export function getLowestMeter(totals: MeterValues): NutrientKey {
  const pct = toPercentages(totals);
  let lowest: NutrientKey = 'protein';
  let lowestVal = pct.protein;

  for (const key of NORMAL_METERS) {
    if (pct[key] < lowestVal) {
      lowestVal = pct[key];
      lowest = key;
    }
  }

  return lowest;
}

// ---------------------------------------------------------------------------
// Food impact preview
// ---------------------------------------------------------------------------

/**
 * Preview the meter changes and avatar state transition that would result
 * from adding a given food to the current totals.
 */
export function previewFoodImpact(
  currentTotals: MeterValues,
  food: NutritionFood
): FoodImpact {
  const before = toPercentages(currentTotals);
  const stateBefore = calculateAvatarState(currentTotals);

  const afterTotals: MeterValues = {
    protein: currentTotals.protein + food.protein_score,
    veggie: currentTotals.veggie + food.veggie_score,
    sugar: currentTotals.sugar + food.sugar_score,
    water: currentTotals.water + food.water_score,
    vitamin: currentTotals.vitamin + food.vitamin_score,
  };

  const after = toPercentages(afterTotals);
  const stateAfter = calculateAvatarState(afterTotals);

  return { before, after, stateBefore, stateAfter };
}

// ---------------------------------------------------------------------------
// Power-up suggestions
// ---------------------------------------------------------------------------

/**
 * Suggest 2-3 foods that would best improve the avatar state.
 *
 * Strategy:
 * - Identify the lowest normal meters.
 * - Score each available food by how much it helps those weak meters.
 * - Avoid suggesting high-sugar foods when sugar is already above 50 %.
 * - Optionally filter to a specific meal category.
 */
export function getPowerUpSuggestions(
  currentTotals: MeterValues,
  availableFoods: NutritionFood[],
  mealCategory?: MealCategory
): PowerUpSuggestion[] {
  const pct = toPercentages(currentTotals);

  // Filter by meal category if provided
  let candidates = availableFoods;
  if (mealCategory) {
    candidates = candidates.filter((f) =>
      f.meal_categories.includes(mealCategory)
    );
  }

  // Avoid high-sugar foods when sugar is already elevated
  const sugarHigh = pct.sugar > 50;
  if (sugarHigh) {
    candidates = candidates.filter((f) => f.sugar_score <= 1);
  }

  if (candidates.length === 0) return [];

  // Build a weight for each normal meter: the lower the meter, the higher
  // the weight so foods that boost weak areas score higher.
  const weights: Record<string, number> = {};
  for (const key of NORMAL_METERS) {
    // Invert percentage so a 10 % meter gets weight 90
    weights[key] = Math.max(0, 100 - pct[key]);
  }

  // Score each food
  const scored = candidates.map((food) => {
    const score =
      food.protein_score * weights.protein +
      food.veggie_score * weights.veggie +
      food.water_score * weights.water +
      food.vitamin_score * weights.vitamin;

    // Determine which meter this food helps the most (for the reason string)
    const contributions: { key: NutrientKey; value: number }[] = [
      { key: 'protein', value: food.protein_score * weights.protein },
      { key: 'veggie', value: food.veggie_score * weights.veggie },
      { key: 'water', value: food.water_score * weights.water },
      { key: 'vitamin', value: food.vitamin_score * weights.vitamin },
    ];
    contributions.sort((a, b) => b.value - a.value);
    const bestKey = contributions[0].key;

    return { food, score, bestKey };
  });

  // Sort descending by score, take top 3
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);

  const REASON_MAP: Record<NutrientKey, string> = {
    protein: 'Boost your protein!',
    veggie: 'Get more veggies in!',
    water: 'Help you stay hydrated!',
    vitamin: 'Packed with vitamins!',
    sugar: '', // won't be used
  };

  return top.map(({ food, bestKey }) => ({
    food,
    reason: REASON_MAP[bestKey] || 'Great choice!',
    targetMeter: bestKey,
  }));
}
