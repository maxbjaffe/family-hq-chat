import { createClient, SupabaseClient } from "@supabase/supabase-js";

let familyDataClient: SupabaseClient | null = null;

export function getFamilyDataClient(): SupabaseClient {
  if (familyDataClient) return familyDataClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Family data Supabase not configured");
  }

  familyDataClient = createClient(url, key);
  return familyDataClient;
}

// Types for family data
export interface Child {
  id: string;
  name: string;
  age?: number;
  grade?: string;
  avatar_type: string | null;
  avatar_data: string | null;
  avatar_background: string | null;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  display_order: number;
  weekdays_only: boolean;
  is_active: boolean;
}

export interface ChecklistCompletion {
  item_id: string;
  child_id: string;
  completion_date: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  all_day?: boolean;
  category?: string;
  color?: string;
}

// Hardcoded user ID for your family (from gift-tracker)
const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";

export async function getChildren(): Promise<Child[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from("children")
    .select("id, name, age, grade, avatar_type, avatar_data, avatar_background")
    .eq("user_id", FAMILY_USER_ID)
    .order("name");

  if (error) {
    console.error("Error fetching children:", error);
    return [];
  }

  return data || [];
}

export async function getChecklistForChild(childId: string): Promise<{
  items: (ChecklistItem & { isCompleted: boolean })[];
  stats: { total: number; completed: number; remaining: number; isComplete: boolean };
}> {
  const supabase = getFamilyDataClient();
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Get checklist items
  let query = supabase
    .from("checklist_items")
    .select("*")
    .eq("child_id", childId)
    .eq("is_active", true)
    .order("display_order");

  if (isWeekend) {
    query = query.eq("weekdays_only", false);
  }

  const { data: items, error: itemsError } = await query;

  if (itemsError) {
    console.error("Error fetching checklist items:", itemsError);
    return { items: [], stats: { total: 0, completed: 0, remaining: 0, isComplete: false } };
  }

  // Get today's completions
  const { data: completions } = await supabase
    .from("checklist_completions")
    .select("item_id")
    .eq("child_id", childId)
    .eq("completion_date", today);

  const completedItemIds = new Set(completions?.map((c) => c.item_id) || []);

  const enrichedItems = (items || []).map((item) => ({
    ...item,
    isCompleted: completedItemIds.has(item.id),
  }));

  const stats = {
    total: enrichedItems.length,
    completed: enrichedItems.filter((item) => item.isCompleted).length,
    remaining: enrichedItems.filter((item) => !item.isCompleted).length,
    isComplete: enrichedItems.length > 0 && enrichedItems.every((item) => item.isCompleted),
  };

  return { items: enrichedItems, stats };
}

export async function toggleChecklistItem(
  childId: string,
  itemId: string,
  isCurrentlyCompleted: boolean
): Promise<boolean> {
  const supabase = getFamilyDataClient();
  const today = new Date().toISOString().split("T")[0];

  if (isCurrentlyCompleted) {
    // Remove completion
    const { error } = await supabase
      .from("checklist_completions")
      .delete()
      .eq("child_id", childId)
      .eq("item_id", itemId)
      .eq("completion_date", today);

    return !error;
  } else {
    // Add completion
    const { error } = await supabase.from("checklist_completions").insert({
      child_id: childId,
      item_id: itemId,
      completion_date: today,
      user_id: FAMILY_USER_ID,
    });

    return !error;
  }
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const supabase = getFamilyDataClient();
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", FAMILY_USER_ID)
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .order("start_time");

  if (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }

  return data || [];
}

export async function getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
  const supabase = getFamilyDataClient();
  const now = new Date().toISOString();
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", FAMILY_USER_ID)
    .gte("start_time", now)
    .lte("start_time", futureDate)
    .order("start_time")
    .limit(10);

  if (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }

  return data || [];
}
