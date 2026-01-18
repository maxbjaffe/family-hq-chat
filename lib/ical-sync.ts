import ical from 'node-ical';
import { getFamilyDataClient } from './supabase';

interface CalendarFeed {
  name: string;
  url: string;
}

// Convert webcal:// to https:// for fetching
function normalizeUrl(url: string): string {
  return url.replace(/^webcal:\/\//, 'https://');
}

export async function syncCalendarFeed(feed: CalendarFeed): Promise<{ synced: number; errors: number }> {
  const supabase = getFamilyDataClient();
  const url = normalizeUrl(feed.url);

  let synced = 0;
  let errors = 0;

  try {
    // Fetch and parse the iCal feed
    const events = await ical.async.fromURL(url);

    // Get date range: today to 14 days from now
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const futureLimit = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    for (const [uid, event] of Object.entries(events)) {
      // Skip non-event entries (like VTIMEZONE)
      if (event.type !== 'VEVENT') continue;

      try {
        const startDate = event.start ? new Date(event.start as Date) : null;
        const endDate = event.end ? new Date(event.end as Date) : null;

        // Skip events outside our date range
        if (!startDate || startDate < now || startDate > futureLimit) continue;

        const { error } = await supabase
          .from('cached_calendar_events')
          .upsert({
            event_id: uid,
            title: event.summary || 'Untitled Event',
            start_time: startDate.toISOString(),
            end_time: endDate?.toISOString() || null,
            calendar_name: feed.name,
            location: event.location || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'event_id',
          });

        if (error) {
          console.error(`Error syncing event ${event.summary}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (eventError) {
        console.error(`Error processing event:`, eventError);
        errors++;
      }
    }
  } catch (fetchError) {
    console.error(`Error fetching calendar ${feed.name}:`, fetchError);
    throw fetchError;
  }

  return { synced, errors };
}

export async function syncAllCalendars(): Promise<{
  total: number;
  synced: number;
  errors: number;
  calendars: { name: string; synced: number; errors: number }[];
}> {
  // Get calendar feeds from environment variable
  // Format: NAME1|URL1,NAME2|URL2
  const feedsEnv = process.env.ICAL_FEEDS || '';

  if (!feedsEnv) {
    return { total: 0, synced: 0, errors: 0, calendars: [] };
  }

  const feeds: CalendarFeed[] = feedsEnv.split(',').map(f => {
    const [name, url] = f.split('|');
    return { name: name.trim(), url: url.trim() };
  }).filter(f => f.name && f.url);

  // Clean up old events before syncing
  const supabase = getFamilyDataClient();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from('cached_calendar_events')
    .delete()
    .lt('start_time', oneWeekAgo);

  let totalSynced = 0;
  let totalErrors = 0;
  const calendarResults: { name: string; synced: number; errors: number }[] = [];

  for (const feed of feeds) {
    try {
      const result = await syncCalendarFeed(feed);
      totalSynced += result.synced;
      totalErrors += result.errors;
      calendarResults.push({ name: feed.name, ...result });
    } catch (error) {
      console.error(`Failed to sync ${feed.name}:`, error);
      calendarResults.push({ name: feed.name, synced: 0, errors: 1 });
      totalErrors++;
    }
  }

  return {
    total: feeds.length,
    synced: totalSynced,
    errors: totalErrors,
    calendars: calendarResults,
  };
}
