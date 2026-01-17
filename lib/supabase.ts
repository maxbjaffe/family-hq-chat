import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// User auth types
export interface User {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid";
  integrations: Record<string, string>;
}

export interface ProfileVisibility {
  birthday: boolean;
  age: boolean;
  bloodType: boolean;
  allergies: boolean;
  medications: boolean;
  conditions: boolean;
  emergencyNotes: boolean;
  doctors: boolean;
  patientPortal: boolean;
  school: boolean;
  teachers: boolean;
  activities: boolean;
}

export const DEFAULT_PROFILE_VISIBILITY: ProfileVisibility = {
  birthday: true,
  age: true,
  bloodType: true,
  allergies: true,
  medications: true,
  conditions: true,
  emergencyNotes: true,
  doctors: true,
  patientPortal: true,
  school: true,
  teachers: true,
  activities: true,
};

export interface FamilyMember {
  id: string;
  name: string;
  role: 'admin' | 'adult' | 'kid' | 'pet';
  pin_hash?: string | null;
  avatar_url?: string | null;
  has_checklist: boolean;
  profile_visibility?: ProfileVisibility;
  created_at?: string;
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
export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  display_order: number;
  weekdays_only: boolean;
  active_days?: string; // JSON array: ["mon","tue","wed","thu","fri","sat","sun"]
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

// Get day abbreviation in EST (mon, tue, wed, thu, fri, sat, sun)
function getLocalDayAbbrev(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York",
    weekday: "short",
  };
  return new Intl.DateTimeFormat("en-US", options).format(now).toLowerCase();
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
  const member = await getFamilyMemberByPin(pin);
  if (!member) return null;

  // Map FamilyMember to User interface (for backward compatibility)
  // Note: The User interface doesn't include 'pet' role, but pets don't have PINs anyway
  return {
    id: member.id,
    name: member.name,
    role: member.role as 'admin' | 'adult' | 'kid',
    integrations: {},
  };
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

// Family member functions
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, role, pin_hash, avatar_url, has_checklist, created_at")
    .order("name");

  if (error) {
    console.error("Error fetching family members:", error);
    return [];
  }

  return (data || []) as FamilyMember[];
}

export async function getFamilyMembersWithChecklists(): Promise<FamilyMember[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, role, pin_hash, avatar_url, has_checklist, created_at")
    .eq("has_checklist", true)
    .order("name");

  if (error) {
    console.error("Error fetching family members with checklists:", error);
    return [];
  }

  return (data || []) as FamilyMember[];
}

export async function getFamilyMemberByPin(pin: string): Promise<FamilyMember | null> {
  const supabase = getFamilyDataClient();
  const pinHash = hashPin(pin);

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, role, pin_hash, avatar_url, has_checklist, created_at")
    .eq("pin_hash", pinHash)
    .single();

  if (error || !data) return null;
  return data as FamilyMember;
}

export async function getChecklistForMember(memberId: string): Promise<{
  items: (ChecklistItem & { isCompleted: boolean })[];
  stats: { total: number; completed: number; remaining: number; isComplete: boolean };
}> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();
  const dayOfWeek = getLocalDayOfWeek();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const todayAbbrev = getLocalDayAbbrev();

  const { data: allItems, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("member_id", memberId)
    .eq("is_active", true)
    .order("display_order");

  if (itemsError) {
    console.error("Error fetching checklist items for member:", itemsError);
    return { items: [], stats: { total: 0, completed: 0, remaining: 0, isComplete: false } };
  }

  // Filter items by active_days (fallback to weekdays_only for backwards compatibility)
  const items = (allItems || []).filter(item => {
    if (item.active_days) {
      try {
        const activeDays = JSON.parse(item.active_days);
        return activeDays.includes(todayAbbrev);
      } catch {
        return true; // If parse fails, show item
      }
    }
    // Fallback to old weekdays_only logic
    if (item.weekdays_only && isWeekend) {
      return false;
    }
    return true;
  });

  // Get today's completions for this member
  const { data: completions } = await supabase
    .from("checklist_completions")
    .select("item_id")
    .eq("member_id", memberId)
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

export async function toggleMemberChecklistItem(
  memberId: string,
  itemId: string,
  isCurrentlyCompleted: boolean
): Promise<boolean> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();

  if (isCurrentlyCompleted) {
    // Remove completion
    const { error } = await supabase
      .from("checklist_completions")
      .delete()
      .eq("member_id", memberId)
      .eq("item_id", itemId)
      .eq("completion_date", today);

    return !error;
  } else {
    // Add completion
    const { error } = await supabase.from("checklist_completions").insert({
      member_id: memberId,
      item_id: itemId,
      completion_date: today,
      user_id: FAMILY_USER_ID,
    });

    return !error;
  }
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

// Weekly Priorities
export interface WeeklyPriority {
  id?: string;
  created_at?: string;
  updated_at?: string;
  week_start: string; // YYYY-MM-DD (Monday)
  priority_number: number; // 1-5
  content: string;
}

// Helper: get Monday of current week
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

// Helper: get Monday of previous week
export function getPreviousWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

export async function getWeeklyPriorities(weekStart?: string): Promise<WeeklyPriority[]> {
  const supabase = getFamilyDataClient();
  const targetWeek = weekStart || getCurrentWeekStart();

  const { data, error } = await supabase
    .from('weekly_priorities')
    .select('*')
    .eq('week_start', targetWeek)
    .order('priority_number', { ascending: true });

  if (error) {
    console.error("Error fetching weekly priorities:", error);
    return [];
  }
  return data || [];
}

export async function setWeeklyPriorities(priorities: string[]): Promise<void> {
  const supabase = getFamilyDataClient();
  const weekStart = getCurrentWeekStart();

  // Delete existing priorities for this week
  await supabase
    .from('weekly_priorities')
    .delete()
    .eq('week_start', weekStart);

  // Insert new priorities
  const rows = priorities.slice(0, 5).map((content, index) => ({
    week_start: weekStart,
    priority_number: index + 1,
    content,
  }));

  const { error } = await supabase
    .from('weekly_priorities')
    .insert(rows);

  if (error) throw new Error(`Failed to set priorities: ${error.message}`);
}

export async function updateWeeklyPriority(priorityNumber: number, content: string): Promise<void> {
  const supabase = getFamilyDataClient();
  const weekStart = getCurrentWeekStart();

  const { error } = await supabase
    .from('weekly_priorities')
    .upsert({
      week_start: weekStart,
      priority_number: priorityNumber,
      content,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'week_start,priority_number',
    });

  if (error) throw new Error(`Failed to update priority: ${error.message}`);
}
