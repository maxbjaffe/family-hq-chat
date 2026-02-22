import { NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

interface UpcomingItem {
  id: string;
  title: string;
  date: string;
  type: "calendar" | "school-event" | "action";
  source: string;
  children?: string[];
  urgency?: string;
  location?: string;
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10), 1), 90);

    const supabase = getFamilyDataClient();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(startOfToday);
    endDate.setDate(endDate.getDate() + days);

    const startISO = startOfToday.toISOString();
    const endISO = endDate.toISOString();

    // Query both tables in parallel
    const [calendarResult, radarResult] = await Promise.all([
      // Source 1: Calendar events
      supabase
        .from("cached_calendar_events")
        .select("id, title, start_time, end_time, calendar_name, location")
        .gte("start_time", startISO)
        .lt("start_time", endISO)
        .order("start_time", { ascending: true }),

      // Source 2: Radar family feed (events + actions)
      supabase
        .from("radar_family_feed")
        .select("id, title, item_type, event_date, deadline, urgency, source, children, scope, created_at")
        .eq("dismissed", false)
        .in("item_type", ["event", "action"])
        .or(
          `and(event_date.gte.${startISO},event_date.lt.${endISO}),` +
          `and(deadline.gte.${startISO},deadline.lt.${endISO}),` +
          `and(deadline.is.null,event_date.is.null,created_at.gte.${startISO})`
        ),
    ]);

    const items: UpcomingItem[] = [];

    // Process calendar events
    if (calendarResult.data) {
      for (const event of calendarResult.data) {
        items.push({
          id: `cal-${event.id}`,
          title: event.title || "Untitled Event",
          date: event.start_time,
          type: "calendar",
          source: event.calendar_name || "Calendar",
          location: event.location || undefined,
        });
      }
    }

    // Process radar events and actions
    if (radarResult.data) {
      for (const item of radarResult.data) {
        const isAction = item.item_type === "action";
        const date = item.event_date || item.deadline || item.created_at;

        if (!date) continue;

        items.push({
          id: `radar-${item.id}`,
          title: item.title || "Untitled Item",
          date,
          type: isAction ? "action" : "school-event",
          source: item.source || "radar",
          children: item.children?.length ? item.children : undefined,
          urgency: isAction ? item.urgency?.toString() : undefined,
        });
      }
    }

    // Sort by date ascending
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Deduplicate by normalized title + same date
    const seen = new Set<string>();
    const deduped: UpcomingItem[] = [];

    for (const item of items) {
      const key = `${normalizeTitle(item.title)}|${item.date.slice(0, 10)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }

    // Limit to 20 items
    const result = deduped.slice(0, 20);

    return NextResponse.json({ items: result, count: result.length, days });
  } catch (error) {
    console.error("Error fetching upcoming items:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming items" },
      { status: 500 }
    );
  }
}
