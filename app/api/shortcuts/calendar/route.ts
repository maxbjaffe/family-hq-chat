import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const secretKey = request.headers.get('X-Shortcut-Key');
    if (secretKey !== process.env.SHORTCUTS_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Support both { events: [...] } and direct array
    const events = Array.isArray(body) ? body : body.events;

    if (!Array.isArray(events)) {
      return NextResponse.json({
        error: 'Invalid events format. Expected { events: [...] } or [...]',
        received: typeof body,
      }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Clear old events before inserting new ones (full sync approach)
    // This prevents stale events from lingering
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('cached_calendar_events')
      .delete()
      .lt('updated_at', oneWeekAgo);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Upsert events (update if exists, insert if new)
    for (const event of events) {
      try {
        // Parse dates - handle various formats from Shortcuts
        let startTime = event.start_time || event.startDate || event.start;
        let endTime = event.end_time || event.endDate || event.end;

        // If dates are Date objects or need parsing
        if (startTime && typeof startTime === 'string') {
          // Try to ensure valid ISO format
          const parsed = new Date(startTime);
          if (!isNaN(parsed.getTime())) {
            startTime = parsed.toISOString();
          }
        }
        if (endTime && typeof endTime === 'string') {
          const parsed = new Date(endTime);
          if (!isNaN(parsed.getTime())) {
            endTime = parsed.toISOString();
          }
        }

        const eventId = event.id || event.identifier || `${event.title}-${startTime}`;

        const { error } = await supabase
          .from('cached_calendar_events')
          .upsert({
            event_id: eventId,
            title: event.title || 'Untitled Event',
            start_time: startTime,
            end_time: endTime,
            calendar_name: event.calendar_name || event.calendar || null,
            location: event.location || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'event_id',
          });

        if (error) {
          errorCount++;
          errors.push(`${event.title}: ${error.message}`);
        } else {
          successCount++;
        }
      } catch (eventError) {
        errorCount++;
        errors.push(`${event.title}: ${String(eventError)}`);
      }
    }

    return NextResponse.json({
      success: true,
      synced: successCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: String(error),
    }, { status: 500 });
  }
}

// GET endpoint to check sync status
export async function GET(request: Request) {
  try {
    const secretKey = request.headers.get('X-Shortcut-Key');
    if (secretKey !== process.env.SHORTCUTS_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getFamilyDataClient();
    const { data, error } = await supabase
      .from('cached_calendar_events')
      .select('*')
      .order('start_time')
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length || 0,
      events: data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
