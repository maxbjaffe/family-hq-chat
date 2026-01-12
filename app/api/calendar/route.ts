import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/supabase";

export async function GET() {
  try {
    const events = await getUpcomingEvents(14); // Next 2 weeks

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
