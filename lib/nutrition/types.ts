// Nutrition Tracker — Type Definitions

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
  food?: NutritionFood;
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
  protein: number;
  veggie: number;
  sugar: number;
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
