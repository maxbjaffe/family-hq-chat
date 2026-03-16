# Nutrition Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a nutrition tracking module where Riley, Parker, and Devin log food via one-tap visual cards, see avatar state changes based on 5 nutrient meters, and preview the impact of food choices before confirming.

**Architecture:** Kiosk-style `/nutrition` page with per-kid logging views. Food items pre-seeded in Supabase with USDA-backed 0-3 nutrition scores. Avatar state computed via priority cascade on every log. FamilyAvatarRow on home page gets a checklist/nutrition toggle. Parent dashboard gets a nutrition card with delete capability.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, shadcn/ui, Supabase (existing project `fpxardwqswlofxrupyhz`)

---

## Task 1: Database Migration SQL

**Files:**
- Create: `docs/migrations/011-nutrition-tracker.sql`

**Step 1: Write the migration SQL**

```sql
-- Nutrition Tracker Tables
-- Run this in Supabase Dashboard SQL Editor

-- 1. Food catalog (~120 items, pre-seeded)
CREATE TABLE nutrition_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  image_url TEXT,
  meal_categories TEXT[] NOT NULL DEFAULT '{}',
  protein_score INT NOT NULL DEFAULT 0 CHECK (protein_score BETWEEN 0 AND 3),
  veggie_score INT NOT NULL DEFAULT 0 CHECK (veggie_score BETWEEN 0 AND 3),
  sugar_score INT NOT NULL DEFAULT 0 CHECK (sugar_score BETWEEN 0 AND 3),
  water_score INT NOT NULL DEFAULT 0 CHECK (water_score BETWEEN 0 AND 3),
  vitamin_score INT NOT NULL DEFAULT 0 CHECK (vitamin_score BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_foods_categories ON nutrition_foods USING GIN (meal_categories);

ALTER TABLE nutrition_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON nutrition_foods
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Food logs (one row per item logged)
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES nutrition_foods(id) ON DELETE CASCADE,
  meal_category TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_logs_member_date ON nutrition_logs(member_id, logged_at DESC);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON nutrition_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Daily state cache (recomputed on every log)
CREATE TABLE nutrition_daily_state (
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  protein_total INT NOT NULL DEFAULT 0,
  veggie_total INT NOT NULL DEFAULT 0,
  sugar_total INT NOT NULL DEFAULT 0,
  water_total INT NOT NULL DEFAULT 0,
  vitamin_total INT NOT NULL DEFAULT 0,
  avatar_state TEXT NOT NULL DEFAULT 'pebble',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, date)
);

ALTER TABLE nutrition_daily_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON nutrition_daily_state
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Water logs (separate from food)
CREATE TABLE nutrition_water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_water_logs_member_date ON nutrition_water_logs(member_id, logged_at DESC);

ALTER TABLE nutrition_water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON nutrition_water_logs
  FOR ALL USING (true) WITH CHECK (true);
```

**Step 2: Run migration in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration SQL. Verify all 4 tables appear under Table Editor.

**Step 3: Commit**

```bash
git add docs/migrations/011-nutrition-tracker.sql
git commit -m "feat: add nutrition tracker migration SQL (4 tables)"
```

---

## Task 2: Types and Constants

**Files:**
- Create: `lib/nutrition/types.ts`
- Create: `lib/nutrition/constants.ts`

**Step 1: Create the types file**

```typescript
// lib/nutrition/types.ts

export type AvatarState = 'sunbeam' | 'glow' | 'flicker' | 'pebble' | 'fizzy';

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';

export type NutrientKey = 'protein' | 'veggie' | 'sugar' | 'water' | 'vitamin';

export interface NutritionFood {
  id: string;
  name: string;
  emoji: string;
  image_url: string | null;
  meal_categories: MealCategory[];
  protein_score: number;
  veggie_score: number;
  sugar_score: number;
  water_score: number;
  vitamin_score: number;
}

export interface NutritionLog {
  id: string;
  member_id: string;
  food_id: string;
  meal_category: MealCategory;
  logged_at: string;
  food?: NutritionFood; // joined
}

export interface NutritionWaterLog {
  id: string;
  member_id: string;
  logged_at: string;
}

export interface DailyState {
  member_id: string;
  date: string;
  protein_total: number;
  veggie_total: number;
  sugar_total: number;
  water_total: number;
  vitamin_total: number;
  avatar_state: AvatarState;
}

export interface MeterValues {
  protein: number;
  veggie: number;
  sugar: number;
  water: number;
  vitamin: number;
}

export interface MeterPercentages {
  protein: number;  // 0-100
  veggie: number;
  sugar: number;    // 0-100 (higher = worse)
  water: number;
  vitamin: number;
}

export interface FoodImpact {
  before: MeterPercentages;
  after: MeterPercentages;
  stateBefore: AvatarState;
  stateAfter: AvatarState;
}

export interface PowerUpSuggestion {
  food: NutritionFood;
  reason: string;
  targetMeter: NutrientKey;
}
```

**Step 2: Create the constants file**

```typescript
// lib/nutrition/constants.ts

import { AvatarState, NutrientKey } from './types';

// Daily targets — how many score-points represent a "full" meter
// Based on ~3 meals + 2 snacks per day with moderate nutrient content
export const DAILY_TARGETS = {
  protein: 10,   // ~3 meals with protein score 2-3 + snacks
  veggie: 8,     // 2-3 servings of veggies/fiber foods
  sugar: 9,      // budget: 3 items at score 3 maxes out
  water: 10,     // 6-8 glasses of water + food moisture
  vitamin: 8,    // variety across meals
} as const;

// Avatar state thresholds (as percentage of daily target)
export const THRESHOLDS = {
  FIZZY_SUGAR: 70,     // sugar above 70% → fizzy
  LOW_METER: 25,       // meter below 25% → counts as "low"
  HIGH_METER: 60,      // meter above 60% → counts as "good"
  PEBBLE_COUNT: 2,     // 2+ low meters → pebble
} as const;

// Water score per glass (each tap of water button)
export const WATER_PER_GLASS = 1;

// Meter display config
export const METER_CONFIG: Record<NutrientKey, {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
  inverse: boolean;
}> = {
  protein: {
    label: 'Protein',
    color: '#3b82f6',       // blue-500
    bgColor: '#dbeafe',     // blue-100
    emoji: '🍗',
    inverse: false,
  },
  veggie: {
    label: 'Veggies',
    color: '#22c55e',       // green-500
    bgColor: '#dcfce7',     // green-100
    emoji: '🥦',
    inverse: false,
  },
  sugar: {
    label: 'Sugar',
    color: '#f97316',       // orange-500
    bgColor: '#ffedd5',     // orange-100
    emoji: '🍬',
    inverse: true,          // filling UP is bad
  },
  water: {
    label: 'Water',
    color: '#06b6d4',       // cyan-500
    bgColor: '#cffafe',     // cyan-100
    emoji: '💧',
    inverse: false,
  },
  vitamin: {
    label: 'Vitamins',
    color: '#eab308',       // yellow-500
    bgColor: '#fef9c3',     // yellow-100
    emoji: '✨',
    inverse: false,
  },
};

// Avatar state config
export const AVATAR_STATE_CONFIG: Record<AvatarState, {
  label: string;
  message: string;
  needsBubble: boolean;
}> = {
  sunbeam: {
    label: 'Sunbeam',
    message: 'Full power! Your character is glowing!',
    needsBubble: false,
  },
  glow: {
    label: 'Glow',
    message: 'Nice! Your character is growing strong today',
    needsBubble: false,
  },
  flicker: {
    label: 'Flicker',
    message: 'Almost there — your character could use a boost',
    needsBubble: true,
  },
  pebble: {
    label: 'Pebble',
    message: "Your character is sleepy — they're looking for fuel!",
    needsBubble: true,
  },
  fizzy: {
    label: 'Fizzy',
    message: 'Whoa, your character has the zoomies! Maybe some protein to balance out?',
    needsBubble: true,
  },
};

// Avatar image path helper
export function getAvatarStatePath(kidName: string, state: AvatarState): string {
  const stateNumber: Record<AvatarState, number> = {
    sunbeam: 1,
    fizzy: 2,
    glow: 3,
    flicker: 4,
    pebble: 5,
  };
  const name = kidName.toLowerCase();
  return `/Images/Avatars/states/${name}/${name}_state${stateNumber[state]}_${state}.png`;
}

// Meal tab config
export const MEAL_TABS: { key: string; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '🥪' },
  { key: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { key: 'snack', label: 'Snacks', emoji: '🍎' },
  { key: 'drink', label: 'Drinks', emoji: '🥤' },
];
```

**Step 3: Verify imports resolve**

```bash
cd ~/Developer/active/family-hq-chat && npx tsc --noEmit lib/nutrition/types.ts lib/nutrition/constants.ts 2>&1 | head -20
```

If type errors, fix. Otherwise proceed.

**Step 4: Commit**

```bash
git add lib/nutrition/types.ts lib/nutrition/constants.ts
git commit -m "feat: add nutrition tracker types and constants"
```

---

## Task 3: Avatar State Engine

**Files:**
- Create: `lib/nutrition/engine.ts`

**Step 1: Write the avatar state engine**

This is a pure function — takes meter totals, returns the avatar state and related data.

```typescript
// lib/nutrition/engine.ts

import { AvatarState, MeterValues, MeterPercentages, NutrientKey, NutritionFood, PowerUpSuggestion } from './types';
import { DAILY_TARGETS, THRESHOLDS, METER_CONFIG } from './constants';

/**
 * Convert raw score totals to percentages of daily targets.
 * Capped at 100 for display (except sugar which can exceed for "overloaded" visual).
 */
export function toPercentages(totals: MeterValues): MeterPercentages {
  return {
    protein: Math.min(100, Math.round((totals.protein / DAILY_TARGETS.protein) * 100)),
    veggie: Math.min(100, Math.round((totals.veggie / DAILY_TARGETS.veggie) * 100)),
    sugar: Math.round((totals.sugar / DAILY_TARGETS.sugar) * 100), // can exceed 100
    water: Math.min(100, Math.round((totals.water / DAILY_TARGETS.water) * 100)),
    vitamin: Math.min(100, Math.round((totals.vitamin / DAILY_TARGETS.vitamin) * 100)),
  };
}

/**
 * Priority cascade: evaluate top-to-bottom, first match wins.
 * 1. Fizzy — sugar > 70%
 * 2. Pebble — 2+ meters below 25%
 * 3. Flicker — exactly 1 meter below 25%
 * 4. Glow — all meters > 25%, not all > 60%
 * 5. Sunbeam — all meters > 60% AND sugar < 70%
 */
export function calculateAvatarState(totals: MeterValues): AvatarState {
  const pct = toPercentages(totals);

  // 1. Fizzy — sugar overloaded
  if (pct.sugar > THRESHOLDS.FIZZY_SUGAR) {
    return 'fizzy';
  }

  // Count low meters (sugar excluded — it's inverse, low sugar is good)
  const normalMeters: NutrientKey[] = ['protein', 'veggie', 'water', 'vitamin'];
  const lowCount = normalMeters.filter(k => pct[k] < THRESHOLDS.LOW_METER).length;

  // 2. Pebble — 2+ meters low
  if (lowCount >= THRESHOLDS.PEBBLE_COUNT) {
    return 'pebble';
  }

  // 3. Flicker — exactly 1 meter low
  if (lowCount === 1) {
    return 'flicker';
  }

  // 4/5. All normal meters above 25%. Check if all above 60% for sunbeam.
  const allHigh = normalMeters.every(k => pct[k] >= THRESHOLDS.HIGH_METER);

  if (allHigh && pct.sugar <= THRESHOLDS.FIZZY_SUGAR) {
    return 'sunbeam';
  }

  return 'glow';
}

/**
 * Find the lowest non-sugar meter — used for needs bubble icon.
 */
export function getLowestMeter(totals: MeterValues): NutrientKey {
  const normalMeters: NutrientKey[] = ['protein', 'veggie', 'water', 'vitamin'];
  const pct = toPercentages(totals);
  let lowest: NutrientKey = 'protein';
  let lowestVal = pct.protein;
  for (const key of normalMeters) {
    if (pct[key] < lowestVal) {
      lowest = key;
      lowestVal = pct[key];
    }
  }
  return lowest;
}

/**
 * Preview the impact of adding a food item to current totals.
 */
export function previewFoodImpact(
  currentTotals: MeterValues,
  food: NutritionFood
): { before: MeterPercentages; after: MeterPercentages; stateBefore: AvatarState; stateAfter: AvatarState } {
  const after: MeterValues = {
    protein: currentTotals.protein + food.protein_score,
    veggie: currentTotals.veggie + food.veggie_score,
    sugar: currentTotals.sugar + food.sugar_score,
    water: currentTotals.water + food.water_score,
    vitamin: currentTotals.vitamin + food.vitamin_score,
  };

  return {
    before: toPercentages(currentTotals),
    after: toPercentages(after),
    stateBefore: calculateAvatarState(currentTotals),
    stateAfter: calculateAvatarState(after),
  };
}

/**
 * Generate 2-3 power-up suggestions based on current meter levels.
 * Finds lowest meters and recommends foods that help.
 */
export function getPowerUpSuggestions(
  currentTotals: MeterValues,
  availableFoods: NutritionFood[],
  mealCategory?: string
): PowerUpSuggestion[] {
  const pct = toPercentages(currentTotals);

  // Find meters that need help (sorted by lowest first)
  const needyMeters: { key: NutrientKey; pct: number }[] = [];
  const normalMeters: NutrientKey[] = ['protein', 'veggie', 'water', 'vitamin'];
  for (const key of normalMeters) {
    if (pct[key] < THRESHOLDS.HIGH_METER) {
      needyMeters.push({ key, pct: pct[key] });
    }
  }
  needyMeters.sort((a, b) => a.pct - b.pct);

  // Also suggest low-sugar foods if sugar is getting high
  const sugarHigh = pct.sugar > 50;

  const suggestions: PowerUpSuggestion[] = [];
  const usedFoodIds = new Set<string>();

  for (const { key } of needyMeters.slice(0, 3)) {
    const scoreKey = `${key}_score` as keyof NutritionFood;
    // Find best food for this meter that also doesn't spike sugar
    const candidates = availableFoods
      .filter(f => !usedFoodIds.has(f.id))
      .filter(f => mealCategory ? f.meal_categories.includes(mealCategory as never) : true)
      .filter(f => (f[scoreKey] as number) >= 2)
      .filter(f => !sugarHigh || f.sugar_score <= 1)
      .sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number));

    if (candidates.length > 0) {
      const food = candidates[0];
      usedFoodIds.add(food.id);
      suggestions.push({
        food,
        reason: `Your character is looking for ${METER_CONFIG[key].label.toLowerCase()} power`,
        targetMeter: key,
      });
    }
  }

  return suggestions.slice(0, 3);
}
```

**Step 2: Verify it compiles**

```bash
cd ~/Developer/active/family-hq-chat && npx tsc --noEmit lib/nutrition/engine.ts 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add lib/nutrition/engine.ts
git commit -m "feat: add avatar state engine with priority cascade and food preview"
```

---

## Task 4: Food Database Seed Data

**Files:**
- Create: `lib/nutrition/food-data.ts`

**Step 1: Create the food database**

This is the ~120 item catalog with USDA-backed nutrition scores. Each item gets scored 0-3 on protein, veggie/fiber, sugar, water, vitamin. Scores derived from USDA FoodData Central + Dietary Guidelines for Americans (ages 4-13).

The file is a static TypeScript array — it gets inserted into Supabase via a seed script or directly via the API. Using it as a TS constant also lets the client load foods without a DB call (faster initial render).

```typescript
// lib/nutrition/food-data.ts

import { MealCategory } from './types';

export interface FoodSeedItem {
  name: string;
  emoji: string;
  meal_categories: MealCategory[];
  protein_score: number;  // 0-3: <2g, 2-7g, 8-15g, 16g+
  veggie_score: number;   // 0-3: fiber + veggie content
  sugar_score: number;    // 0-3: <2g, 2-6g, 7-15g, 16g+ added sugar
  water_score: number;    // 0-3: hydration contribution
  vitamin_score: number;  // 0-3: micronutrient density
}

export const FOOD_DATABASE: FoodSeedItem[] = [
  // ============================================
  // BREAKFAST (~25 items)
  // ============================================
  { name: 'Pancakes', emoji: '🥞', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 1 },
  { name: 'Waffles', emoji: '🧇', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 1 },
  { name: 'French Toast', emoji: '🍞', meal_categories: ['breakfast'], protein_score: 2, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 1 },
  { name: 'Scrambled Eggs', emoji: '🥚', meal_categories: ['breakfast'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 1, vitamin_score: 2 },
  { name: 'Fried Egg', emoji: '🍳', meal_categories: ['breakfast'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Oatmeal', emoji: '🥣', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 2, sugar_score: 1, water_score: 1, vitamin_score: 2 },
  { name: 'Sugary Cereal', emoji: '🥣', meal_categories: ['breakfast'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 1 },
  { name: 'Healthy Cereal', emoji: '🥣', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 2, sugar_score: 1, water_score: 0, vitamin_score: 2 },
  { name: 'Toast', emoji: '🍞', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Bagel', emoji: '🥯', meal_categories: ['breakfast'], protein_score: 2, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Bagel & Cream Cheese', emoji: '🥯', meal_categories: ['breakfast'], protein_score: 2, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Muffin', emoji: '🧁', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 1 },
  { name: 'Yogurt', emoji: '🥛', meal_categories: ['breakfast', 'snack'], protein_score: 2, veggie_score: 0, sugar_score: 1, water_score: 1, vitamin_score: 2 },
  { name: 'Yogurt Parfait', emoji: '🥛', meal_categories: ['breakfast', 'snack'], protein_score: 2, veggie_score: 1, sugar_score: 2, water_score: 1, vitamin_score: 2 },
  { name: 'Breakfast Burrito', emoji: '🌯', meal_categories: ['breakfast'], protein_score: 3, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Bacon', emoji: '🥓', meal_categories: ['breakfast'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Sausage', emoji: '🌭', meal_categories: ['breakfast'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Hash Browns', emoji: '🥔', meal_categories: ['breakfast'], protein_score: 0, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Fruit Salad', emoji: '🍓', meal_categories: ['breakfast', 'snack'], protein_score: 0, veggie_score: 2, sugar_score: 2, water_score: 2, vitamin_score: 3 },
  { name: 'Banana', emoji: '🍌', meal_categories: ['breakfast', 'snack'], protein_score: 0, veggie_score: 1, sugar_score: 2, water_score: 1, vitamin_score: 2 },
  { name: 'Smoothie Bowl', emoji: '🥣', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 2, sugar_score: 2, water_score: 2, vitamin_score: 3 },
  { name: 'Granola Bar', emoji: '🍫', meal_categories: ['breakfast', 'snack'], protein_score: 1, veggie_score: 1, sugar_score: 2, water_score: 0, vitamin_score: 1 },
  { name: 'Pop-Tart', emoji: '🍪', meal_categories: ['breakfast'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 0 },
  { name: 'Donut', emoji: '🍩', meal_categories: ['breakfast', 'snack'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 0 },
  { name: 'Acai Bowl', emoji: '🫐', meal_categories: ['breakfast'], protein_score: 1, veggie_score: 2, sugar_score: 2, water_score: 2, vitamin_score: 3 },
  { name: 'Overnight Oats', emoji: '🥣', meal_categories: ['breakfast'], protein_score: 2, veggie_score: 2, sugar_score: 1, water_score: 1, vitamin_score: 2 },

  // ============================================
  // LUNCH (~25 items)
  // ============================================
  { name: 'PB&J', emoji: '🥪', meal_categories: ['lunch'], protein_score: 2, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 1 },
  { name: 'Grilled Cheese', emoji: '🧀', meal_categories: ['lunch'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Turkey Sandwich', emoji: '🥪', meal_categories: ['lunch'], protein_score: 3, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Ham Sandwich', emoji: '🥪', meal_categories: ['lunch'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Chicken Nuggets', emoji: '🍗', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Mac & Cheese', emoji: '🧀', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Cheese Pizza', emoji: '🍕', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 0, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Pepperoni Pizza', emoji: '🍕', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 0, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Hot Dog', emoji: '🌭', meal_categories: ['lunch'], protein_score: 1, veggie_score: 0, sugar_score: 1, water_score: 0, vitamin_score: 0 },
  { name: 'Burger', emoji: '🍔', meal_categories: ['lunch', 'dinner'], protein_score: 3, veggie_score: 0, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Quesadilla', emoji: '🫔', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Wrap / Burrito', emoji: '🌯', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Soup', emoji: '🍜', meal_categories: ['lunch', 'dinner'], protein_score: 1, veggie_score: 2, sugar_score: 0, water_score: 2, vitamin_score: 2 },
  { name: 'Salad', emoji: '🥗', meal_categories: ['lunch', 'dinner'], protein_score: 1, veggie_score: 3, sugar_score: 0, water_score: 2, vitamin_score: 3 },
  { name: 'Pasta with Sauce', emoji: '🍝', meal_categories: ['lunch', 'dinner'], protein_score: 1, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Rice & Beans', emoji: '🍚', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 2, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Fish Sticks', emoji: '🐟', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Sushi / Rice Roll', emoji: '🍣', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 2 },
  { name: 'Hummus & Pita', emoji: '🫓', meal_categories: ['lunch', 'snack'], protein_score: 1, veggie_score: 2, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Lunchable', emoji: '🧃', meal_categories: ['lunch'], protein_score: 1, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 0 },
  { name: 'Corn Dog', emoji: '🌭', meal_categories: ['lunch'], protein_score: 1, veggie_score: 0, sugar_score: 1, water_score: 0, vitamin_score: 0 },
  { name: 'Taco', emoji: '🌮', meal_categories: ['lunch', 'dinner'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'BLT', emoji: '🥪', meal_categories: ['lunch'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 1, vitamin_score: 1 },
  { name: 'Chicken Salad', emoji: '🥗', meal_categories: ['lunch'], protein_score: 3, veggie_score: 1, sugar_score: 0, water_score: 1, vitamin_score: 2 },
  { name: 'Sub Sandwich', emoji: '🥖', meal_categories: ['lunch'], protein_score: 2, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 1 },

  // ============================================
  // DINNER (~25 items)
  // ============================================
  { name: 'Chicken Breast', emoji: '🍗', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Steak', emoji: '🥩', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Salmon', emoji: '🐟', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 3 },
  { name: 'Pork Chop', emoji: '🍖', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Meatballs', emoji: '🧆', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Pasta & Meatballs', emoji: '🍝', meal_categories: ['dinner'], protein_score: 3, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Stir Fry', emoji: '🥘', meal_categories: ['dinner'], protein_score: 2, veggie_score: 3, sugar_score: 0, water_score: 1, vitamin_score: 3 },
  { name: 'Fried Rice', emoji: '🍚', meal_categories: ['dinner'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Roast Chicken', emoji: '🍗', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 2 },
  { name: 'Tacos', emoji: '🌮', meal_categories: ['dinner'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Burritos', emoji: '🌯', meal_categories: ['dinner'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Lasagna', emoji: '🍝', meal_categories: ['dinner'], protein_score: 2, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Casserole', emoji: '🍲', meal_categories: ['dinner'], protein_score: 2, veggie_score: 1, sugar_score: 0, water_score: 1, vitamin_score: 1 },
  { name: 'Roasted Veggies', emoji: '🥕', meal_categories: ['dinner'], protein_score: 0, veggie_score: 3, sugar_score: 0, water_score: 1, vitamin_score: 3 },
  { name: 'Mashed Potatoes', emoji: '🥔', meal_categories: ['dinner'], protein_score: 0, veggie_score: 1, sugar_score: 0, water_score: 1, vitamin_score: 1 },
  { name: 'Corn on the Cob', emoji: '🌽', meal_categories: ['dinner'], protein_score: 1, veggie_score: 2, sugar_score: 0, water_score: 1, vitamin_score: 2 },
  { name: 'Broccoli', emoji: '🥦', meal_categories: ['dinner'], protein_score: 1, veggie_score: 3, sugar_score: 0, water_score: 1, vitamin_score: 3 },
  { name: 'Green Beans', emoji: '🫘', meal_categories: ['dinner'], protein_score: 1, veggie_score: 3, sugar_score: 0, water_score: 1, vitamin_score: 2 },
  { name: 'Rice', emoji: '🍚', meal_categories: ['dinner'], protein_score: 1, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Bread Roll', emoji: '🍞', meal_categories: ['dinner'], protein_score: 1, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Baked Potato', emoji: '🥔', meal_categories: ['dinner'], protein_score: 1, veggie_score: 2, sugar_score: 0, water_score: 1, vitamin_score: 2 },
  { name: 'Curry', emoji: '🍛', meal_categories: ['dinner'], protein_score: 2, veggie_score: 2, sugar_score: 0, water_score: 1, vitamin_score: 2 },
  { name: 'Ramen', emoji: '🍜', meal_categories: ['dinner'], protein_score: 2, veggie_score: 1, sugar_score: 1, water_score: 2, vitamin_score: 1 },
  { name: 'Ribs', emoji: '🍖', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 1, water_score: 0, vitamin_score: 1 },
  { name: 'Grilled Shrimp', emoji: '🦐', meal_categories: ['dinner'], protein_score: 3, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 2 },

  // ============================================
  // SNACKS + DESSERTS (~25 items)
  // ============================================
  { name: 'Apple', emoji: '🍎', meal_categories: ['snack'], protein_score: 0, veggie_score: 2, sugar_score: 2, water_score: 2, vitamin_score: 2 },
  { name: 'Banana', emoji: '🍌', meal_categories: ['snack'], protein_score: 0, veggie_score: 1, sugar_score: 2, water_score: 1, vitamin_score: 2 },
  { name: 'Grapes', emoji: '🍇', meal_categories: ['snack'], protein_score: 0, veggie_score: 1, sugar_score: 2, water_score: 2, vitamin_score: 2 },
  { name: 'Strawberries', emoji: '🍓', meal_categories: ['snack'], protein_score: 0, veggie_score: 1, sugar_score: 1, water_score: 2, vitamin_score: 3 },
  { name: 'Orange', emoji: '🍊', meal_categories: ['snack'], protein_score: 0, veggie_score: 2, sugar_score: 2, water_score: 2, vitamin_score: 3 },
  { name: 'Carrots & Ranch', emoji: '🥕', meal_categories: ['snack'], protein_score: 0, veggie_score: 2, sugar_score: 0, water_score: 1, vitamin_score: 3 },
  { name: 'Celery & PB', emoji: '🥜', meal_categories: ['snack'], protein_score: 2, veggie_score: 2, sugar_score: 0, water_score: 1, vitamin_score: 2 },
  { name: 'Cheese Stick', emoji: '🧀', meal_categories: ['snack'], protein_score: 2, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 1 },
  { name: 'Crackers', emoji: '🍘', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 0 },
  { name: 'Goldfish', emoji: '🐟', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 0 },
  { name: 'Pretzels', emoji: '🥨', meal_categories: ['snack'], protein_score: 1, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 0 },
  { name: 'Trail Mix', emoji: '🥜', meal_categories: ['snack'], protein_score: 2, veggie_score: 1, sugar_score: 1, water_score: 0, vitamin_score: 2 },
  { name: 'Popcorn', emoji: '🍿', meal_categories: ['snack'], protein_score: 0, veggie_score: 1, sugar_score: 0, water_score: 0, vitamin_score: 0 },
  { name: 'Chips', emoji: '🍟', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 0, water_score: 0, vitamin_score: 0 },
  { name: 'Cookies', emoji: '🍪', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 0 },
  { name: 'Ice Cream', emoji: '🍦', meal_categories: ['snack'], protein_score: 1, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 1 },
  { name: 'Candy', emoji: '🍬', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 0 },
  { name: 'Brownie', emoji: '🍫', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 0 },
  { name: 'Cupcake', emoji: '🧁', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 0 },
  { name: 'Fruit Snacks', emoji: '🍬', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 0, vitamin_score: 0 },
  { name: 'Rice Krispie Treat', emoji: '🍚', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 0 },
  { name: 'Popsicle', emoji: '🧊', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 2, water_score: 1, vitamin_score: 0 },
  { name: 'Pudding', emoji: '🍮', meal_categories: ['snack'], protein_score: 1, veggie_score: 0, sugar_score: 2, water_score: 0, vitamin_score: 1 },
  { name: 'Jello', emoji: '🟢', meal_categories: ['snack'], protein_score: 0, veggie_score: 0, sugar_score: 2, water_score: 1, vitamin_score: 0 },
  { name: 'Granola Bar', emoji: '🍫', meal_categories: ['snack'], protein_score: 1, veggie_score: 1, sugar_score: 2, water_score: 0, vitamin_score: 1 },

  // ============================================
  // DRINKS (~20 items)
  // ============================================
  { name: 'Water', emoji: '💧', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 0, water_score: 3, vitamin_score: 0 },
  { name: 'Milk', emoji: '🥛', meal_categories: ['drink'], protein_score: 2, veggie_score: 0, sugar_score: 1, water_score: 2, vitamin_score: 2 },
  { name: 'Chocolate Milk', emoji: '🥛', meal_categories: ['drink'], protein_score: 2, veggie_score: 0, sugar_score: 2, water_score: 2, vitamin_score: 2 },
  { name: 'Orange Juice', emoji: '🍊', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 2, water_score: 2, vitamin_score: 3 },
  { name: 'Apple Juice', emoji: '🧃', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 2, vitamin_score: 1 },
  { name: 'Lemonade', emoji: '🍋', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 2, vitamin_score: 1 },
  { name: 'Smoothie', emoji: '🥤', meal_categories: ['drink'], protein_score: 1, veggie_score: 2, sugar_score: 2, water_score: 2, vitamin_score: 3 },
  { name: 'Sports Drink', emoji: '🥤', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 2, vitamin_score: 0 },
  { name: 'Soda', emoji: '🥤', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 1, vitamin_score: 0 },
  { name: 'Hot Chocolate', emoji: '☕', meal_categories: ['drink'], protein_score: 1, veggie_score: 0, sugar_score: 2, water_score: 1, vitamin_score: 1 },
  { name: 'Iced Tea', emoji: '🧊', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 2, water_score: 2, vitamin_score: 0 },
  { name: 'Sparkling Water', emoji: '💧', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 0, water_score: 3, vitamin_score: 0 },
  { name: 'Coconut Water', emoji: '🥥', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 1, water_score: 3, vitamin_score: 2 },
  { name: 'Milkshake', emoji: '🥤', meal_categories: ['drink'], protein_score: 2, veggie_score: 0, sugar_score: 3, water_score: 1, vitamin_score: 1 },
  { name: 'Juice Box', emoji: '🧃', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 1, vitamin_score: 1 },
  { name: 'Capri Sun', emoji: '🧃', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 3, water_score: 1, vitamin_score: 0 },
  { name: 'Protein Shake', emoji: '🥤', meal_categories: ['drink'], protein_score: 3, veggie_score: 0, sugar_score: 1, water_score: 2, vitamin_score: 2 },
  { name: 'Herbal Tea', emoji: '🍵', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 0, water_score: 3, vitamin_score: 1 },
  { name: 'Lemon Water', emoji: '🍋', meal_categories: ['drink'], protein_score: 0, veggie_score: 0, sugar_score: 0, water_score: 3, vitamin_score: 1 },
  { name: 'Chocolate Shake', emoji: '🥤', meal_categories: ['drink'], protein_score: 2, veggie_score: 0, sugar_score: 3, water_score: 1, vitamin_score: 1 },
];
```

**Step 2: Verify item count and compile**

```bash
cd ~/Developer/active/family-hq-chat && node -e "const d = require('./lib/nutrition/food-data'); console.log('Total foods:', d.FOOD_DATABASE.length)"
```

Expected: `Total foods: 120` (approximately)

**Step 3: Commit**

```bash
git add lib/nutrition/food-data.ts
git commit -m "feat: add 120-item food database with USDA-backed nutrition scores"
```

---

## Task 5: Nutrition DB Helpers

**Files:**
- Create: `lib/nutrition/db.ts`

**Step 1: Write the Supabase query helpers**

```typescript
// lib/nutrition/db.ts

import { getFamilyDataClient } from '@/lib/supabase';
import { NutritionFood, NutritionLog, DailyState, MeterValues, MealCategory } from './types';
import { calculateAvatarState } from './engine';
import { WATER_PER_GLASS } from './constants';

function getLocalDateString(): string {
  // Same pattern as checklist — EST timezone, treats 12am-1:59am as previous day
  const now = new Date();
  const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  if (est.getHours() < 2) {
    est.setDate(est.getDate() - 1);
  }
  return est.toISOString().split('T')[0];
}

/** Get all foods from the database */
export async function getFoods(): Promise<NutritionFood[]> {
  const supabase = getFamilyDataClient();
  const { data, error } = await supabase
    .from('nutrition_foods')
    .select('*')
    .order('name');

  if (error) {
    console.error('[Nutrition] Error fetching foods:', error);
    return [];
  }
  return data || [];
}

/** Log a food item for a member */
export async function logFood(
  memberId: string,
  foodId: string,
  mealCategory: MealCategory
): Promise<NutritionLog | null> {
  const supabase = getFamilyDataClient();
  const { data, error } = await supabase
    .from('nutrition_logs')
    .insert({ member_id: memberId, food_id: foodId, meal_category: mealCategory })
    .select()
    .single();

  if (error) {
    console.error('[Nutrition] Error logging food:', error);
    return null;
  }

  // Recompute daily state
  await recomputeDailyState(memberId);
  return data;
}

/** Delete a food log entry (parent edit mode) */
export async function deleteLog(logId: string): Promise<boolean> {
  const supabase = getFamilyDataClient();

  // Get the log first to know the member_id
  const { data: log } = await supabase
    .from('nutrition_logs')
    .select('member_id')
    .eq('id', logId)
    .single();

  const { error } = await supabase
    .from('nutrition_logs')
    .delete()
    .eq('id', logId);

  if (error) {
    console.error('[Nutrition] Error deleting log:', error);
    return false;
  }

  // Recompute daily state
  if (log?.member_id) {
    await recomputeDailyState(log.member_id);
  }
  return true;
}

/** Log a glass of water */
export async function logWater(memberId: string): Promise<boolean> {
  const supabase = getFamilyDataClient();
  const { error } = await supabase
    .from('nutrition_water_logs')
    .insert({ member_id: memberId });

  if (error) {
    console.error('[Nutrition] Error logging water:', error);
    return false;
  }

  await recomputeDailyState(memberId);
  return true;
}

/** Get today's logs for a member (with food details) */
export async function getTodayLogs(memberId: string): Promise<NutritionLog[]> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*, food:nutrition_foods(*)')
    .eq('member_id', memberId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: false });

  if (error) {
    console.error('[Nutrition] Error fetching logs:', error);
    return [];
  }
  return data || [];
}

/** Get today's water count for a member */
export async function getTodayWaterCount(memberId: string): Promise<number> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;

  const { count, error } = await supabase
    .from('nutrition_water_logs')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay);

  if (error) {
    console.error('[Nutrition] Error counting water:', error);
    return 0;
  }
  return count || 0;
}

/** Get current daily state for a member */
export async function getDailyState(memberId: string): Promise<DailyState | null> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();

  const { data, error } = await supabase
    .from('nutrition_daily_state')
    .select('*')
    .eq('member_id', memberId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows — that's fine for a new day
    console.error('[Nutrition] Error fetching daily state:', error);
  }

  return data || null;
}

/** Get daily states for all kids (for the family dashboard) */
export async function getAllKidsDailyState(): Promise<DailyState[]> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();

  const { data, error } = await supabase
    .from('nutrition_daily_state')
    .select('*')
    .eq('date', today);

  if (error) {
    console.error('[Nutrition] Error fetching all daily states:', error);
    return [];
  }
  return data || [];
}

/** Get historical daily states for a member (parent view) */
export async function getHistory(
  memberId: string,
  days: number = 7
): Promise<DailyState[]> {
  const supabase = getFamilyDataClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('nutrition_daily_state')
    .select('*')
    .eq('member_id', memberId)
    .gte('date', start)
    .order('date', { ascending: false });

  if (error) {
    console.error('[Nutrition] Error fetching history:', error);
    return [];
  }
  return data || [];
}

/** Recompute daily state from today's logs + water */
async function recomputeDailyState(memberId: string): Promise<DailyState> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();

  // Fetch today's food logs with scores
  const [logs, waterCount] = await Promise.all([
    getTodayLogs(memberId),
    getTodayWaterCount(memberId),
  ]);

  // Sum up all nutrient scores
  const totals: MeterValues = {
    protein: 0,
    veggie: 0,
    sugar: 0,
    water: waterCount * WATER_PER_GLASS,
    vitamin: 0,
  };

  for (const log of logs) {
    if (log.food) {
      totals.protein += log.food.protein_score;
      totals.veggie += log.food.veggie_score;
      totals.sugar += log.food.sugar_score;
      totals.water += log.food.water_score;
      totals.vitamin += log.food.vitamin_score;
    }
  }

  const avatarState = calculateAvatarState(totals);

  const state: DailyState = {
    member_id: memberId,
    date: today,
    protein_total: totals.protein,
    veggie_total: totals.veggie,
    sugar_total: totals.sugar,
    water_total: totals.water,
    vitamin_total: totals.vitamin,
    avatar_state: avatarState,
  };

  // Upsert into nutrition_daily_state
  const { error } = await supabase
    .from('nutrition_daily_state')
    .upsert(state, { onConflict: 'member_id,date' });

  if (error) {
    console.error('[Nutrition] Error upserting daily state:', error);
  }

  return state;
}
```

**Step 2: Verify it compiles**

```bash
cd ~/Developer/active/family-hq-chat && npx tsc --noEmit lib/nutrition/db.ts 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add lib/nutrition/db.ts
git commit -m "feat: add nutrition Supabase query helpers"
```

---

## Task 6: API Routes

**Files:**
- Create: `app/api/nutrition/foods/route.ts`
- Create: `app/api/nutrition/log/route.ts`
- Create: `app/api/nutrition/water/route.ts`
- Create: `app/api/nutrition/state/[memberId]/route.ts`
- Create: `app/api/nutrition/history/[memberId]/route.ts`

**Step 1: Foods route (GET — returns food catalog)**

```typescript
// app/api/nutrition/foods/route.ts

import { NextResponse } from 'next/server';
import { getFoods } from '@/lib/nutrition/db';

export async function GET() {
  try {
    const foods = await getFoods();
    return NextResponse.json({ foods });
  } catch (error) {
    console.error('[Nutrition API] Error fetching foods:', error);
    return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 });
  }
}
```

**Step 2: Log route (POST — log food, DELETE — remove log)**

```typescript
// app/api/nutrition/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { logFood, deleteLog } from '@/lib/nutrition/db';

export async function POST(request: NextRequest) {
  try {
    const { memberId, foodId, mealCategory } = await request.json();

    if (!memberId || !foodId || !mealCategory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const log = await logFood(memberId, foodId, mealCategory);
    if (!log) {
      return NextResponse.json({ error: 'Failed to log food' }, { status: 500 });
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('[Nutrition API] Error logging food:', error);
    return NextResponse.json({ error: 'Failed to log food' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { logId } = await request.json();

    if (!logId) {
      return NextResponse.json({ error: 'Log ID required' }, { status: 400 });
    }

    const success = await deleteLog(logId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Nutrition API] Error deleting log:', error);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
}
```

**Step 3: Water route (POST — log a glass)**

```typescript
// app/api/nutrition/water/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { logWater } from '@/lib/nutrition/db';

export async function POST(request: NextRequest) {
  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const success = await logWater(memberId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to log water' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[Nutrition API] Error logging water:', error);
    return NextResponse.json({ error: 'Failed to log water' }, { status: 500 });
  }
}
```

**Step 4: State route (GET — current daily state + meters + logs)**

```typescript
// app/api/nutrition/state/[memberId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDailyState, getTodayLogs, getTodayWaterCount } from '@/lib/nutrition/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    const [state, logs, waterCount] = await Promise.all([
      getDailyState(memberId),
      getTodayLogs(memberId),
      getTodayWaterCount(memberId),
    ]);

    return NextResponse.json({
      state: state || {
        member_id: memberId,
        date: new Date().toISOString().split('T')[0],
        protein_total: 0,
        veggie_total: 0,
        sugar_total: 0,
        water_total: 0,
        vitamin_total: 0,
        avatar_state: 'pebble',
      },
      logs,
      waterCount,
    });
  } catch (error) {
    console.error('[Nutrition API] Error fetching state:', error);
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
  }
}
```

**Step 5: History route (GET — historical daily states)**

```typescript
// app/api/nutrition/history/[memberId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/nutrition/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);

    const history = await getHistory(memberId, days);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('[Nutrition API] Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
```

**Step 6: Verify routes compile**

```bash
cd ~/Developer/active/family-hq-chat && npx tsc --noEmit 2>&1 | head -30
```

**Step 7: Commit**

```bash
git add app/api/nutrition/
git commit -m "feat: add nutrition API routes (foods, log, water, state, history)"
```

---

## Task 7: Seed Script for Food Database

**Files:**
- Create: `scripts/seed-nutrition-foods.ts`

**Step 1: Write the seed script**

```typescript
// scripts/seed-nutrition-foods.ts

import { createClient } from '@supabase/supabase-js';
import { FOOD_DATABASE } from '../lib/nutrition/food-data';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

async function seed() {
  const supabase = createClient(url, key);

  console.log(`Seeding ${FOOD_DATABASE.length} food items...`);

  // Clear existing foods first
  const { error: deleteError } = await supabase
    .from('nutrition_foods')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

  if (deleteError) {
    console.error('Error clearing existing foods:', deleteError);
    return;
  }

  // Insert in batches of 25
  const batchSize = 25;
  let inserted = 0;

  for (let i = 0; i < FOOD_DATABASE.length; i += batchSize) {
    const batch = FOOD_DATABASE.slice(i, i + batchSize);
    const { error } = await supabase
      .from('nutrition_foods')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      return;
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${FOOD_DATABASE.length}`);
  }

  console.log('Done! Food database seeded successfully.');
}

seed().catch(console.error);
```

**Step 2: Run the seed script** (after migration has been run in Supabase Dashboard)

```bash
cd ~/Developer/active/family-hq-chat && npx tsx scripts/seed-nutrition-foods.ts
```

Expected output:
```
Seeding 120 food items...
  Inserted 25/120
  Inserted 50/120
  Inserted 75/120
  Inserted 100/120
  Inserted 120/120
Done! Food database seeded successfully.
```

**Step 3: Commit**

```bash
git add scripts/seed-nutrition-foods.ts
git commit -m "feat: add nutrition food seed script"
```

---

## Task 8: NutritionAvatar Component

**Files:**
- Create: `components/nutrition/NutritionAvatar.tsx`

**Step 1: Build the avatar component with needs bubble**

```typescript
// components/nutrition/NutritionAvatar.tsx

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AvatarState, MeterValues, NutrientKey } from '@/lib/nutrition/types';
import { getAvatarStatePath, AVATAR_STATE_CONFIG, METER_CONFIG } from '@/lib/nutrition/constants';
import { getLowestMeter } from '@/lib/nutrition/engine';

interface NutritionAvatarProps {
  kidName: string;
  state: AvatarState;
  totals?: MeterValues;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showMessage?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
};

const IMAGE_SIZES = {
  sm: '64px',
  md: '96px',
  lg: '128px',
  xl: '160px',
};

export function NutritionAvatar({
  kidName,
  state,
  totals,
  size = 'lg',
  showMessage = false,
  className,
}: NutritionAvatarProps) {
  const config = AVATAR_STATE_CONFIG[state];
  const imagePath = getAvatarStatePath(kidName, state);
  const needsBubble = config.needsBubble && totals;
  const lowestMeter: NutrientKey | null = totals ? getLowestMeter(totals) : null;

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* Avatar image */}
      <div className={cn('relative rounded-full overflow-hidden', SIZE_MAP[size])}>
        <Image
          src={imagePath}
          alt={`${kidName} - ${config.label}`}
          fill
          className="object-cover"
          sizes={IMAGE_SIZES[size]}
        />
      </div>

      {/* Needs bubble */}
      {needsBubble && lowestMeter && state !== 'fizzy' && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-slate-200 animate-bounce">
          <span className="text-lg">{METER_CONFIG[lowestMeter].emoji}</span>
        </div>
      )}

      {/* Fizzy bubble — sugar-specific */}
      {needsBubble && state === 'fizzy' && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-orange-200 animate-bounce">
          <span className="text-lg">⚡</span>
        </div>
      )}

      {/* State message */}
      {showMessage && (
        <p className="text-xs text-center text-slate-600 mt-2 max-w-[160px] leading-tight">
          {config.message}
        </p>
      )}
    </div>
  );
}
```

**Step 2: Verify it compiles**

```bash
cd ~/Developer/active/family-hq-chat && npx tsc --noEmit components/nutrition/NutritionAvatar.tsx 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add components/nutrition/NutritionAvatar.tsx
git commit -m "feat: add NutritionAvatar component with needs bubble"
```

---

## Task 9: NutritionMeters Component

**Files:**
- Create: `components/nutrition/NutritionMeters.tsx`

**Step 1: Build the meters component (full + mini variants)**

```typescript
// components/nutrition/NutritionMeters.tsx

'use client';

import { cn } from '@/lib/utils';
import { MeterPercentages, NutrientKey } from '@/lib/nutrition/types';
import { METER_CONFIG } from '@/lib/nutrition/constants';

interface NutritionMetersProps {
  percentages: MeterPercentages;
  variant?: 'full' | 'mini';
  className?: string;
}

const METER_ORDER: NutrientKey[] = ['protein', 'veggie', 'sugar', 'water', 'vitamin'];

function getSugarBarColor(pct: number): string {
  if (pct < 40) return '#22c55e';     // green — good
  if (pct < 60) return '#eab308';     // yellow — caution
  if (pct < 80) return '#f97316';     // orange — high
  return '#ef4444';                    // red — overloaded
}

export function NutritionMeters({ percentages, variant = 'full', className }: NutritionMetersProps) {
  if (variant === 'mini') {
    return (
      <div className={cn('flex gap-1.5 items-center', className)}>
        {METER_ORDER.map((key) => {
          const config = METER_CONFIG[key];
          const pct = percentages[key];
          const color = key === 'sugar' ? getSugarBarColor(pct) : config.color;
          return (
            <div
              key={key}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: pct > 0 ? color : '#e2e8f0',
                opacity: Math.max(0.3, pct / 100),
              }}
              title={`${config.label}: ${Math.min(pct, 100)}%`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {METER_ORDER.map((key) => {
        const config = METER_CONFIG[key];
        const pct = percentages[key];
        const displayPct = Math.min(pct, 100);
        const barColor = key === 'sugar' ? getSugarBarColor(pct) : config.color;

        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">{config.emoji}</span>
            <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${displayPct}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
            <span className="text-xs text-slate-500 w-8 text-right">{displayPct}%</span>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/nutrition/NutritionMeters.tsx
git commit -m "feat: add NutritionMeters component (full bars + mini dots)"
```

---

## Task 10: FoodCard and FoodPreview Components

**Files:**
- Create: `components/nutrition/FoodCard.tsx`
- Create: `components/nutrition/FoodPreview.tsx`

**Step 1: Build the FoodCard**

```typescript
// components/nutrition/FoodCard.tsx

'use client';

import { cn } from '@/lib/utils';
import { NutritionFood, NutrientKey } from '@/lib/nutrition/types';

interface FoodCardProps {
  food: NutritionFood;
  onTap: (food: NutritionFood) => void;
  highlighted?: boolean;
  highlightColor?: string;
  className?: string;
}

export function FoodCard({ food, onTap, highlighted, highlightColor, className }: FoodCardProps) {
  return (
    <button
      type="button"
      onClick={() => onTap(food)}
      className={cn(
        'flex flex-col items-center justify-center p-2 rounded-xl',
        'bg-white shadow-sm border-2 transition-all duration-200',
        'hover:shadow-md hover:scale-105 active:scale-95',
        'min-h-[80px] min-w-[80px]',
        highlighted
          ? 'border-opacity-100'
          : 'border-transparent',
        className
      )}
      style={highlighted ? { borderColor: highlightColor || '#8b5cf6' } : undefined}
    >
      <span className="text-3xl">{food.emoji}</span>
      <span className="text-xs text-slate-700 font-medium mt-1 text-center leading-tight">
        {food.name}
      </span>
    </button>
  );
}
```

**Step 2: Build the FoodPreview bottom sheet**

```typescript
// components/nutrition/FoodPreview.tsx

'use client';

import { cn } from '@/lib/utils';
import { NutritionFood, MeterPercentages, AvatarState, NutrientKey } from '@/lib/nutrition/types';
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

const SCORE_KEYS: { key: NutrientKey; scoreKey: keyof NutritionFood }[] = [
  { key: 'protein', scoreKey: 'protein_score' },
  { key: 'veggie', scoreKey: 'veggie_score' },
  { key: 'sugar', scoreKey: 'sugar_score' },
  { key: 'water', scoreKey: 'water_score' },
  { key: 'vitamin', scoreKey: 'vitamin_score' },
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={onCancel} />

      {/* Panel */}
      <div className="relative bg-white rounded-t-2xl shadow-2xl p-6 pb-8 max-w-lg mx-auto">
        {/* Food header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{food.emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{food.name}</h3>
            {/* Nutrient dots */}
            <div className="flex gap-1 mt-1">
              {SCORE_KEYS.map(({ key, scoreKey }) => {
                const score = food[scoreKey] as number;
                if (score === 0) return null;
                const config = METER_CONFIG[key];
                return Array.from({ length: score }, (_, i) => (
                  <div
                    key={`${key}-${i}`}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                    title={config.label}
                  />
                ));
              })}
            </div>
          </div>
        </div>

        {/* Before/After meters */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium">Now</p>
            <NutritionMeters percentages={before} variant="full" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium">After</p>
            <NutritionMeters percentages={after} variant="full" />
          </div>
        </div>

        {/* Avatar preview if state changes */}
        {stateChanged && (
          <div className="flex items-center justify-center gap-4 mb-4 py-2 bg-slate-50 rounded-xl">
            <NutritionAvatar kidName={kidName} state={stateBefore} size="sm" />
            <span className="text-slate-400">→</span>
            <NutritionAvatar kidName={kidName} state={stateAfter} size="sm" />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium min-h-[48px]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-purple-600 text-white font-bold min-h-[48px] hover:bg-purple-700 active:bg-purple-800"
          >
            Log it!
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/nutrition/FoodCard.tsx components/nutrition/FoodPreview.tsx
git commit -m "feat: add FoodCard and FoodPreview components"
```

---

## Task 11: PowerUpSuggestion Component

**Files:**
- Create: `components/nutrition/PowerUpSuggestion.tsx`

**Step 1: Build the suggestion strip**

```typescript
// components/nutrition/PowerUpSuggestion.tsx

'use client';

import { cn } from '@/lib/utils';
import { PowerUpSuggestion as Suggestion, NutritionFood } from '@/lib/nutrition/types';
import { METER_CONFIG } from '@/lib/nutrition/constants';

interface PowerUpSuggestionProps {
  suggestions: Suggestion[];
  onTapFood: (food: NutritionFood) => void;
  className?: string;
}

export function PowerUpSuggestionStrip({ suggestions, onTapFood, className }: PowerUpSuggestionProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn('bg-purple-50 rounded-xl p-3', className)}>
      <p className="text-xs font-medium text-purple-700 mb-2">
        {suggestions[0].reason}
      </p>
      <div className="flex gap-2 overflow-x-auto">
        {suggestions.map((s) => (
          <button
            key={s.food.id}
            type="button"
            onClick={() => onTapFood(s.food)}
            className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-2 shadow-sm border border-purple-200 hover:border-purple-400 transition-colors shrink-0"
          >
            <span className="text-xl">{s.food.emoji}</span>
            <span className="text-xs font-medium text-slate-700">{s.food.name}</span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: METER_CONFIG[s.targetMeter].color }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/nutrition/PowerUpSuggestion.tsx
git commit -m "feat: add PowerUpSuggestion strip component"
```

---

## Task 12: NutritionLogger (Main Logging View)

**Files:**
- Create: `components/nutrition/NutritionLogger.tsx`

**Step 1: Build the full logging view**

This is the main component a kid sees after tapping their avatar. Contains: avatar + meters strip, meal tabs, food grid, water button, and the FoodPreview bottom sheet.

```typescript
// components/nutrition/NutritionLogger.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NutritionFood, MealCategory, DailyState, MeterValues, NutritionLog } from '@/lib/nutrition/types';
import { MEAL_TABS, DAILY_TARGETS } from '@/lib/nutrition/constants';
import { toPercentages, previewFoodImpact, getPowerUpSuggestions } from '@/lib/nutrition/engine';
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

export function NutritionLogger({ memberId, kidName, onBack }: NutritionLoggerProps) {
  const [activeTab, setActiveTab] = useState<string>('breakfast');
  const [state, setState] = useState<DailyState | null>(null);
  const [waterCount, setWaterCount] = useState(0);
  const [selectedFood, setSelectedFood] = useState<NutritionFood | null>(null);
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial state
  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/nutrition/state/${memberId}`);
      const data = await res.json();
      setState(data.state);
      setWaterCount(data.waterCount);
    } catch (err) {
      console.error('Failed to load nutrition state:', err);
    }
  }, [memberId]);

  const loadFoods = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/foods');
      const data = await res.json();
      setFoods(data.foods);
    } catch {
      // Fall back to static data
      setFoods(FOOD_DATABASE as unknown as NutritionFood[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
    loadFoods();
  }, [loadState, loadFoods]);

  // Current meter totals
  const totals: MeterValues = state
    ? {
        protein: state.protein_total,
        veggie: state.veggie_total,
        sugar: state.sugar_total,
        water: state.water_total,
        vitamin: state.vitamin_total,
      }
    : { protein: 0, veggie: 0, sugar: 0, water: 0, vitamin: 0 };

  const percentages = toPercentages(totals);
  const avatarState = state?.avatar_state || 'pebble';

  // Filter foods for active tab
  const tabFoods = foods.filter(f =>
    f.meal_categories.includes(activeTab as MealCategory)
  );

  // Power-up suggestions
  const suggestions = getPowerUpSuggestions(totals, tabFoods, activeTab);
  const suggestedIds = new Set(suggestions.map(s => s.food.id));

  // Food preview
  const preview = selectedFood ? previewFoodImpact(totals, selectedFood) : null;

  // Log food
  const handleConfirm = async () => {
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
      setSelectedFood(null);
      await loadState();
    } catch (err) {
      console.error('Failed to log food:', err);
    }
  };

  // Log water
  const handleWater = async () => {
    try {
      await fetch('/api/nutrition/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      setWaterCount(prev => prev + 1);
      await loadState();
    } catch (err) {
      console.error('Failed to log water:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header: back button + avatar + meters */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <NutritionAvatar
            kidName={kidName}
            state={avatarState as never}
            totals={totals}
            size="md"
            showMessage
          />

          <div className="flex-1">
            <NutritionMeters percentages={percentages} variant="full" />
          </div>

          {/* Water button */}
          <button
            type="button"
            onClick={handleWater}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 min-h-[48px] min-w-[48px]"
          >
            <Droplets className="w-5 h-5 text-cyan-500" />
            <span className="text-xs font-bold text-cyan-700">{waterCount}</span>
          </button>
        </div>
      </div>

      {/* Power-up suggestions */}
      <PowerUpSuggestionStrip
        suggestions={suggestions}
        onTapFood={setSelectedFood}
        className="mx-4 mt-3"
      />

      {/* Meal tabs */}
      <div className="flex gap-1 px-4 mt-3 overflow-x-auto">
        {MEAL_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] transition-colors',
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Food grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {tabFoods.map((food) => (
            <FoodCard
              key={food.id || food.name}
              food={food}
              onTap={setSelectedFood}
              highlighted={suggestedIds.has(food.id)}
              highlightColor="#8b5cf6"
            />
          ))}
        </div>
      </div>

      {/* Food preview bottom sheet */}
      {selectedFood && preview && (
        <FoodPreview
          food={selectedFood}
          kidName={kidName}
          before={preview.before}
          after={preview.after}
          stateBefore={preview.stateBefore}
          stateAfter={preview.stateAfter}
          onConfirm={handleConfirm}
          onCancel={() => setSelectedFood(null)}
        />
      )}
    </div>
  );
}
```

**Step 2: Verify it compiles**

```bash
cd ~/Developer/active/family-hq-chat && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add components/nutrition/NutritionLogger.tsx
git commit -m "feat: add NutritionLogger component (meal tabs, food grid, preview flow)"
```

---

## Task 13: Nutrition Kiosk Page

**Files:**
- Create: `app/nutrition/page.tsx`

**Step 1: Build the kiosk page**

```typescript
// app/nutrition/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NutritionAvatar } from '@/components/nutrition/NutritionAvatar';
import { NutritionMeters } from '@/components/nutrition/NutritionMeters';
import { NutritionLogger } from '@/components/nutrition/NutritionLogger';
import { toPercentages } from '@/lib/nutrition/engine';
import { DailyState, AvatarState, MeterValues } from '@/lib/nutrition/types';
import { AVATAR_STATE_CONFIG } from '@/lib/nutrition/constants';

interface KidInfo {
  id: string;
  name: string;
}

const KIDS: KidInfo[] = [
  { id: '', name: 'Riley' },
  { id: '', name: 'Parker' },
  { id: '', name: 'Devin' },
];

export default function NutritionPage() {
  const router = useRouter();
  const [kids, setKids] = useState<KidInfo[]>(KIDS);
  const [dailyStates, setDailyStates] = useState<Record<string, DailyState>>({});
  const [activeKid, setActiveKid] = useState<KidInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Load family members to get real IDs
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/family');
        const data = await res.json();
        const kidMembers = (data.members || [])
          .filter((m: { role: string }) => m.role === 'kid')
          .map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));

        if (kidMembers.length > 0) {
          setKids(kidMembers);

          // Fetch daily states for all kids
          const states: Record<string, DailyState> = {};
          await Promise.all(
            kidMembers.map(async (kid: KidInfo) => {
              const stateRes = await fetch(`/api/nutrition/state/${kid.id}`);
              const stateData = await stateRes.json();
              states[kid.id] = stateData.state;
            })
          );
          setDailyStates(states);
        }
      } catch (err) {
        console.error('Failed to load family data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // When returning from logger, refresh states
  const handleBack = async () => {
    setActiveKid(null);
    // Refresh all states
    const states: Record<string, DailyState> = {};
    await Promise.all(
      kids.map(async (kid) => {
        const res = await fetch(`/api/nutrition/state/${kid.id}`);
        const data = await res.json();
        states[kid.id] = data.state;
      })
    );
    setDailyStates(states);
  };

  // Show logger for active kid
  if (activeKid) {
    return (
      <div className="h-screen">
        <NutritionLogger
          memberId={activeKid.id}
          kidName={activeKid.name}
          onBack={handleBack}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Nutrition Tracker</h1>
        <p className="text-slate-500">Tap your character to start logging!</p>
      </div>

      {/* Kid avatars row */}
      <div className="flex items-start justify-center gap-8 md:gap-12">
        {kids.map((kid) => {
          const state = dailyStates[kid.id];
          const avatarState: AvatarState = (state?.avatar_state as AvatarState) || 'pebble';
          const totals: MeterValues = state
            ? {
                protein: state.protein_total,
                veggie: state.veggie_total,
                sugar: state.sugar_total,
                water: state.water_total,
                vitamin: state.vitamin_total,
              }
            : { protein: 0, veggie: 0, sugar: 0, water: 0, vitamin: 0 };
          const pct = toPercentages(totals);

          return (
            <button
              key={kid.id || kid.name}
              type="button"
              onClick={() => setActiveKid(kid)}
              className="flex flex-col items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
            >
              <NutritionAvatar
                kidName={kid.name}
                state={avatarState}
                totals={totals}
                size="xl"
              />
              <span className="font-bold text-lg text-slate-900">{kid.name}</span>
              <NutritionMeters percentages={pct} variant="mini" />
              <span className="text-xs text-slate-500">
                {AVATAR_STATE_CONFIG[avatarState].label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Back to home */}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="mt-12 text-sm text-slate-400 hover:text-slate-600"
      >
        ← Back to Home
      </button>
    </div>
  );
}
```

**Step 2: Verify the page loads**

```bash
cd ~/Developer/active/family-hq-chat && npm run dev &
# Then open http://localhost:3000/nutrition in a browser
```

Expected: See three avatars (Riley, Parker, Devin) in pebble state. Tapping one opens the logger.

**Step 3: Commit**

```bash
git add app/nutrition/page.tsx
git commit -m "feat: add /nutrition kiosk page with kid avatar selection"
```

---

## Task 14: FamilyAvatarRow Toggle

**Files:**
- Modify: `components/home/FamilyAvatarRow.tsx`

**Step 1: Add checklist/nutrition toggle to the existing component**

Add a mode toggle and nutrition state rendering. The existing checklist mode stays as-is. Add a new `nutritionStates` prop and toggle UI.

Key changes:
- New props: `nutritionStates?: Record<string, DailyState>`, `mode?: 'checklist' | 'nutrition'`, `onModeChange?: (mode: string) => void`
- Pill toggle in the header (checkmark icon / utensils icon)
- Time-aware default: before noon = checklist, after = nutrition
- In nutrition mode: render `NutritionAvatar` instead of `Avatar`, show mini meters, navigate to `/nutrition` on tap

The component should remain backwards-compatible — if `nutritionStates` is not passed, it behaves exactly as before.

**Step 2: Update the home page to pass nutrition data**

Modify `app/page.tsx` to fetch `getAllKidsDailyState()` and pass it to `FamilyAvatarRow`.

**Step 3: Verify toggle works**

Run dev server, check that the FamilyAvatarRow shows the toggle and switches between modes. Before noon defaults to checklists, after noon defaults to nutrition.

**Step 4: Commit**

```bash
git add components/home/FamilyAvatarRow.tsx app/page.tsx
git commit -m "feat: add checklist/nutrition toggle to FamilyAvatarRow"
```

---

## Task 15: Parent Nutrition Card

**Files:**
- Create: `components/nutrition/ParentNutritionCard.tsx`
- Modify: `app/parents/page.tsx` (add the card)

**Step 1: Build the parent nutrition card**

Shows per-kid: meters with percentages, today's food log (scrollable), avatar state label, edit mode with delete buttons.

```typescript
// components/nutrition/ParentNutritionCard.tsx
// Full card with:
// - Kid name + avatar state label
// - 5 meter bars with percentages
// - Scrollable food log list
// - Edit button → red X on each log entry
// - Delete calls /api/nutrition/log DELETE, refreshes state
```

**Step 2: Add card to parent dashboard**

In `app/parents/page.tsx`, add a `ParentNutritionCard` for each kid in the dashboard grid. Fetch nutrition state data in the page's parallel data load.

**Step 3: Verify parent view**

Run dev server, go to `/parents`, log in, verify the nutrition card shows for each kid with correct data and delete functionality works.

**Step 4: Commit**

```bash
git add components/nutrition/ParentNutritionCard.tsx app/parents/page.tsx
git commit -m "feat: add parent nutrition card with edit/delete capability"
```

---

## Task 16: Final Integration and Polish

**Files:**
- Multiple files for final wiring

**Step 1: Auto-detect meal time for tab default**

In `NutritionLogger`, set the initial `activeTab` based on current time:
- Before 10am → breakfast
- 10am-2pm → lunch
- 2pm-5pm → snack
- After 5pm → dinner

**Step 2: Add `/nutrition` to navigation**

Add a link to `/nutrition` in the appropriate navigation component (check where `/kiosk` is linked and follow the same pattern).

**Step 3: End-to-end test**

1. Run migration in Supabase Dashboard
2. Run seed script: `npx tsx scripts/seed-nutrition-foods.ts`
3. Start dev server: `npm run dev`
4. Go to `/nutrition` — see 3 kids in pebble state
5. Tap Riley → see breakfast tab with ~25 food cards
6. Tap "Scrambled Eggs" → preview shows protein +3, meters shift
7. Tap "Log it!" → meters update, avatar may change
8. Tap water glass → water count increments
9. Go back → Riley's avatar reflects new state
10. Go to `/` → FamilyAvatarRow shows nutrition toggle
11. Go to `/parents` → nutrition card shows Riley's log with delete button

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: nutrition tracker final integration and polish"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration (4 tables) | `docs/migrations/011-nutrition-tracker.sql` |
| 2 | Types and constants | `lib/nutrition/types.ts`, `lib/nutrition/constants.ts` |
| 3 | Avatar state engine | `lib/nutrition/engine.ts` |
| 4 | Food database (~120 items) | `lib/nutrition/food-data.ts` |
| 5 | Supabase DB helpers | `lib/nutrition/db.ts` |
| 6 | API routes (5 routes) | `app/api/nutrition/*` |
| 7 | Seed script | `scripts/seed-nutrition-foods.ts` |
| 8 | NutritionAvatar component | `components/nutrition/NutritionAvatar.tsx` |
| 9 | NutritionMeters component | `components/nutrition/NutritionMeters.tsx` |
| 10 | FoodCard + FoodPreview | `components/nutrition/FoodCard.tsx`, `FoodPreview.tsx` |
| 11 | PowerUpSuggestion strip | `components/nutrition/PowerUpSuggestion.tsx` |
| 12 | NutritionLogger (main view) | `components/nutrition/NutritionLogger.tsx` |
| 13 | Nutrition kiosk page | `app/nutrition/page.tsx` |
| 14 | FamilyAvatarRow toggle | `components/home/FamilyAvatarRow.tsx`, `app/page.tsx` |
| 15 | Parent nutrition card | `components/nutrition/ParentNutritionCard.tsx`, `app/parents/page.tsx` |
| 16 | Final integration + polish | Multiple files |
