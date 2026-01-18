import { NextResponse } from 'next/server';
import { getCachedCalendarEvents } from '@/lib/supabase';

export async function GET() {
  try {
    const events = await getCachedCalendarEvents(2); // Today + Tomorrow

    // Filter to today and tomorrow's events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const relevantEvents = events.filter(e => {
      const eventDate = new Date(e.start_time);
      return eventDate >= today && eventDate < dayAfterTomorrow;
    });

    return NextResponse.json({ events: relevantEvents });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ events: [] });
  }
}
