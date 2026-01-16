import { NextResponse } from 'next/server';
import { getCachedCalendarEvents } from '@/lib/supabase';

export async function GET() {
  try {
    const events = await getCachedCalendarEvents(1); // Today only

    // Filter to today's events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.start_time);
      return eventDate >= today && eventDate < tomorrow;
    });

    return NextResponse.json({ events: todayEvents });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ events: [] });
  }
}
