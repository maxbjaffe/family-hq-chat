import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const secretKey = request.headers.get('X-Shortcut-Key');
    if (secretKey !== process.env.SHORTCUTS_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events format' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Upsert events (update if exists, insert if new)
    for (const event of events) {
      await supabase
        .from('cached_calendar_events')
        .upsert({
          event_id: event.id || event.title + event.start_time,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          calendar_name: event.calendar_name,
          location: event.location,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'event_id',
        });
    }

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
