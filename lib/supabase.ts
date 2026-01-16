import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// User auth types
export interface User {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid";
  integrations: Record<string, string>;
}

function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

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

// Get today's date in local timezone (EST) as YYYY-MM-DD
function getLocalDateString(): string {
  const now = new Date();
  // Use EST timezone for consistency (family is in NY area)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

// Get day of week in local timezone (0 = Sunday, 6 = Saturday)
function getLocalDayOfWeek(): number {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York",
    weekday: "short",
  };
  const dayName = new Intl.DateTimeFormat("en-US", options).format(now);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[dayName] ?? 0;
}

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
  const today = getLocalDateString(); // Use local timezone (EST)
  const dayOfWeek = getLocalDayOfWeek(); // Use local timezone (EST)
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
  const today = getLocalDateString(); // Use local timezone (EST)

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

// User auth functions
export async function getUserByPin(pin: string): Promise<User | null> {
  const supabase = getFamilyDataClient();
  const pinHash = hashPin(pin);

  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, integrations")
    .eq("pin_hash", pinHash)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, integrations")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const supabase = getFamilyDataClient();
  const pinHash = hashPin(pin);

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .eq("pin_hash", pinHash)
    .single();

  return !!data;
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, integrations")
    .order("name");

  if (error) return [];
  return (data || []) as User[];
}

// Cached data types
export interface CachedCalendarEvent {
  id: string;
  event_id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location: string | null;
}

export interface CachedReminder {
  id: string;
  reminder_id: string;
  user_id: string;
  title: string;
  due_date: string | null;
  list_name: string | null;
  priority: number;
  is_completed: boolean;
}

// Cache query functions
export async function getCachedCalendarEvents(days: number = 7): Promise<CachedCalendarEvent[]> {
  const supabase = getFamilyDataClient();
  const now = new Date().toISOString();
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("cached_calendar_events")
    .select("*")
    .gte("start_time", now)
    .lte("start_time", futureDate)
    .order("start_time");

  if (error) {
    console.error("Error fetching cached calendar:", error);
    return [];
  }

  return data || [];
}

export async function getCachedReminders(userId: string): Promise<CachedReminder[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from("cached_reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .order("due_date");

  if (error) {
    console.error("Error fetching cached reminders:", error);
    return [];
  }

  return data || [];
}
