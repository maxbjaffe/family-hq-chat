// Nutrition Tracker — Database Helpers
//
// All Supabase queries for the nutrition system.
// Uses the shared family data client (singleton lazy-init).

import { getFamilyDataClient } from '@/lib/supabase';
import { calculateAvatarState } from '@/lib/nutrition/engine';
import { WATER_PER_GLASS } from '@/lib/nutrition/constants';
import type {
  AvatarState,
  DailyState,
  MealCategory,
  MeterValues,
  NutritionFood,
  NutritionLog,
} from '@/lib/nutrition/types';

// ---------------------------------------------------------------------------
// Date helper — EST with 2 am rollover (matches checklist system)
// ---------------------------------------------------------------------------

function getLocalDateString(): string {
  const now = new Date();
  const est = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  if (est.getHours() < 2) {
    est.setDate(est.getDate() - 1);
  }
  return est.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Foods
// ---------------------------------------------------------------------------

export async function getFoods(): Promise<NutritionFood[]> {
  try {
    const supabase = getFamilyDataClient();
    const { data, error } = await supabase
      .from('nutrition_foods')
      .select('*')
      .order('name');

    if (error) {
      console.error('[Nutrition] Error fetching foods:', error);
      return [];
    }

    return (data || []) as NutritionFood[];
  } catch (err) {
    console.error('[Nutrition] Unexpected error in getFoods:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Logging food
// ---------------------------------------------------------------------------

export async function logFood(
  memberId: string,
  foodId: string,
  mealCategory: MealCategory
): Promise<NutritionLog | null> {
  try {
    const supabase = getFamilyDataClient();
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        member_id: memberId,
        food_id: foodId,
        meal_category: mealCategory,
      })
      .select('*, food:nutrition_foods(*)')
      .single();

    if (error) {
      console.error('[Nutrition] Error logging food:', error);
      return null;
    }

    // Recompute daily state after logging
    await recomputeDailyState(memberId);

    return data as NutritionLog;
  } catch (err) {
    console.error('[Nutrition] Unexpected error in logFood:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Deleting a log
// ---------------------------------------------------------------------------

export async function deleteLog(logId: string): Promise<boolean> {
  try {
    const supabase = getFamilyDataClient();

    // Get the member_id before deleting so we can recompute
    const { data: log, error: fetchError } = await supabase
      .from('nutrition_logs')
      .select('member_id')
      .eq('id', logId)
      .single();

    if (fetchError || !log) {
      console.error('[Nutrition] Error fetching log for delete:', fetchError);
      return false;
    }

    const { error: deleteError } = await supabase
      .from('nutrition_logs')
      .delete()
      .eq('id', logId);

    if (deleteError) {
      console.error('[Nutrition] Error deleting log:', deleteError);
      return false;
    }

    // Recompute daily state after deletion
    await recomputeDailyState(log.member_id);

    return true;
  } catch (err) {
    console.error('[Nutrition] Unexpected error in deleteLog:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Water logging
// ---------------------------------------------------------------------------

export async function logWater(memberId: string): Promise<boolean> {
  try {
    const supabase = getFamilyDataClient();
    const { error } = await supabase
      .from('nutrition_water_logs')
      .insert({ member_id: memberId });

    if (error) {
      console.error('[Nutrition] Error logging water:', error);
      return false;
    }

    // Recompute daily state after water log
    await recomputeDailyState(memberId);

    return true;
  } catch (err) {
    console.error('[Nutrition] Unexpected error in logWater:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Today's logs
// ---------------------------------------------------------------------------

export async function getTodayLogs(memberId: string): Promise<NutritionLog[]> {
  try {
    const supabase = getFamilyDataClient();
    const today = getLocalDateString();

    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*, food:nutrition_foods(*)')
      .eq('member_id', memberId)
      .gte('logged_at', `${today}T00:00:00`)
      .lt('logged_at', `${today}T23:59:59.999999`)
      .order('logged_at', { ascending: true });

    if (error) {
      console.error('[Nutrition] Error fetching today logs:', error);
      return [];
    }

    return (data || []) as NutritionLog[];
  } catch (err) {
    console.error('[Nutrition] Unexpected error in getTodayLogs:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Today's water count
// ---------------------------------------------------------------------------

export async function getTodayWaterCount(memberId: string): Promise<number> {
  try {
    const supabase = getFamilyDataClient();
    const today = getLocalDateString();

    const { count, error } = await supabase
      .from('nutrition_water_logs')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .gte('logged_at', `${today}T00:00:00`)
      .lt('logged_at', `${today}T23:59:59.999999`);

    if (error) {
      console.error('[Nutrition] Error fetching water count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error('[Nutrition] Unexpected error in getTodayWaterCount:', err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Daily state
// ---------------------------------------------------------------------------

export async function getDailyState(
  memberId: string
): Promise<DailyState | null> {
  try {
    const supabase = getFamilyDataClient();
    const today = getLocalDateString();

    const { data, error } = await supabase
      .from('nutrition_daily_state')
      .select('*')
      .eq('member_id', memberId)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      // PGRST116 = no rows found — perfectly normal for a new day
      if (error.code === 'PGRST116') return null;
      console.error('[Nutrition] Error fetching daily state:', error);
      return null;
    }

    return data as DailyState | null;
  } catch (err) {
    console.error('[Nutrition] Unexpected error in getDailyState:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// All kids' daily states (family dashboard)
// ---------------------------------------------------------------------------

export async function getAllKidsDailyState(): Promise<DailyState[]> {
  try {
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

    return (data || []) as DailyState[];
  } catch (err) {
    console.error(
      '[Nutrition] Unexpected error in getAllKidsDailyState:',
      err
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export async function getHistory(
  memberId: string,
  days: number = 7
): Promise<DailyState[]> {
  try {
    const supabase = getFamilyDataClient();
    const today = getLocalDateString();

    // Calculate start date
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('nutrition_daily_state')
      .select('*')
      .eq('member_id', memberId)
      .gte('date', startDateStr)
      .lte('date', today)
      .order('date', { ascending: false });

    if (error) {
      console.error('[Nutrition] Error fetching history:', error);
      return [];
    }

    return (data || []) as DailyState[];
  } catch (err) {
    console.error('[Nutrition] Unexpected error in getHistory:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Recompute daily state (private — called after every mutation)
// ---------------------------------------------------------------------------

async function recomputeDailyState(memberId: string): Promise<DailyState> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();

  // Fetch today's logs and water in parallel
  const [logs, waterCount] = await Promise.all([
    getTodayLogs(memberId),
    getTodayWaterCount(memberId),
  ]);

  // Sum nutrient scores from food logs
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

  // Calculate avatar state from engine
  const avatarState: AvatarState = calculateAvatarState(totals);

  const stateRow = {
    member_id: memberId,
    date: today,
    protein_total: totals.protein,
    veggie_total: totals.veggie,
    sugar_total: totals.sugar,
    water_total: totals.water,
    vitamin_total: totals.vitamin,
    avatar_state: avatarState,
  };

  // Upsert into daily state (unique on member_id + date)
  const { data, error } = await supabase
    .from('nutrition_daily_state')
    .upsert(stateRow, { onConflict: 'member_id,date' })
    .select()
    .single();

  if (error) {
    console.error('[Nutrition] Error upserting daily state:', error);
    // Return the computed state even if upsert fails
    return stateRow as DailyState;
  }

  return data as DailyState;
}
