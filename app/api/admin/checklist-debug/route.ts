import { NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getFamilyDataClient();

  // Get today's date in EST (same logic as the main code)
  const now = new Date();
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(hourFormatter.format(now));

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  let targetDate = now;
  if (hour < 2) {
    targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const parts = dateFormatter.formatToParts(targetDate);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const today = `${year}-${month}-${day}`;

  // First, get raw completions to see table structure
  const { data: rawCompletions, error: rawError } = await supabase
    .from("checklist_completions")
    .select("*")
    .limit(5);

  // Test insert to see exact error
  const testMemberId = "3255d216-e6eb-4226-85d2-160564873857"; // Riley
  const testItemId = "test-item-id";
  const { error: insertError } = await supabase
    .from("checklist_completions")
    .insert({
      member_id: testMemberId,
      item_id: testItemId,
      completion_date: today,
      user_id: "00879c1b-a586-4d52-96be-8f4b7ddf7257",
    });

  // Clean up test insert if it succeeded
  if (!insertError) {
    await supabase
      .from("checklist_completions")
      .delete()
      .eq("item_id", testItemId);
  }

  // Get recent completions - try without ordering
  const { data: recentCompletions, error: completionsError } = await supabase
    .from("checklist_completions")
    .select("*")
    .limit(20);

  // Get today's completions using completed_at instead of completion_date
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;
  const { data: todayCompletions, error: todayError } = await supabase
    .from("checklist_completions")
    .select("*")
    .gte("completed_at", todayStart)
    .lte("completed_at", todayEnd);

  // Get family members
  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("id, name, role, has_checklist")
    .eq("has_checklist", true);

  // Get checklist items count
  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("id, member_id, title")
    .eq("is_active", true);

  return NextResponse.json({
    debug: {
      currentTimeUTC: now.toISOString(),
      calculatedDate: today,
      hourInEST: hour,
      todayRange: { start: `${today}T00:00:00`, end: `${today}T23:59:59` },
    },
    testInsert: {
      error: insertError?.message,
      code: insertError?.code,
      details: insertError?.details,
      hint: insertError?.hint,
    },
    rawCompletions: {
      count: rawCompletions?.length || 0,
      data: rawCompletions,
      columns: rawCompletions?.[0] ? Object.keys(rawCompletions[0]) : [],
      error: rawError?.message,
    },
    todayCompletions: {
      count: todayCompletions?.length || 0,
      data: todayCompletions,
      error: todayError?.message,
    },
    recentCompletions: {
      count: recentCompletions?.length || 0,
      data: recentCompletions,
      error: completionsError?.message,
    },
    members: {
      count: members?.length || 0,
      data: members,
      error: membersError?.message,
    },
    items: {
      count: items?.length || 0,
      sample: items?.slice(0, 5),
      error: itemsError?.message,
    },
  });
}
