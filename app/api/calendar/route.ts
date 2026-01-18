import { NextResponse } from "next/server";
import { getCachedCalendarEvents } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14');
    const calendar = searchParams.get('calendar');

    let events = await getCachedCalendarEvents(days);

    // Filter by calendar name if specified
    if (calendar) {
      events = events.filter(e => e.calendar_name === calendar);
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
