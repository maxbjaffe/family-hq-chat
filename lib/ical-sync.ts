import ICAL from 'ical.js';
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
    // Fetch the iCal feed (Apple requires User-Agent header)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FamilyHQ/1.0)',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status}`);
    }
    let icalData = await response.text();

    // Fix malformed multi-line fields (Apple sometimes has improperly folded lines)
    // Standard iCal folding uses a space or tab at the start of continuation lines
    // This regex fixes lines that don't start with a valid iCal property
    icalData = icalData.replace(/\r?\n(?![A-Z-]+[:;]|[ \t]|END:|BEGIN:)/g, ' ');

    // Parse with ical.js
    const jcalData = ICAL.parse(icalData);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    // Get date range: today to 30 days from now
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const futureLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent);
        const baseUid = event.uid;
        const summary = event.summary || 'Untitled Event';
        const location = event.location || null;
        const duration = event.duration;

        // Check if this is a recurring event
        const isRecurring = !!vevent.getFirstProperty('rrule');

        if (isRecurring) {
          // Expand recurring events
          try {
            const iterator = event.iterator();
            let next = iterator.next();
            let count = 0;
            const maxOccurrences = 100; // Safety limit

            while (next && count < maxOccurrences) {
              const occurrenceStart = next.toJSDate();

              // Stop if past our window
              if (occurrenceStart > futureLimit) break;

              // Only sync if within our date range
              if (occurrenceStart >= now && occurrenceStart <= futureLimit) {
                // Create unique ID for this occurrence
                const occurrenceUid = `${baseUid}_${occurrenceStart.toISOString()}`;

                // Calculate end time based on duration
                let occurrenceEnd: Date | null = null;
                if (duration) {
                  occurrenceEnd = new Date(occurrenceStart.getTime() + duration.toSeconds() * 1000);
                }

                const { error } = await supabase
                  .from('cached_calendar_events')
                  .upsert({
                    event_id: occurrenceUid,
                    title: summary,
                    start_time: occurrenceStart.toISOString(),
                    end_time: occurrenceEnd?.toISOString() || null,
                    calendar_name: feed.name,
                    location: location,
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'event_id',
                  });

                if (error) {
                  console.error(`Error syncing recurring event ${summary}:`, error);
                  errors++;
                } else {
                  synced++;
                }
              }

              next = iterator.next();
              count++;
            }
          } catch (recurError) {
            console.error(`Error expanding recurring event ${summary}:`, recurError);
            errors++;
          }
        } else {
          // Non-recurring event - original logic
          const startDate = event.startDate?.toJSDate();
          const endDate = event.endDate?.toJSDate();

          // Skip events outside our date range
          if (!startDate || startDate < now || startDate > futureLimit) continue;

          const { error } = await supabase
            .from('cached_calendar_events')
            .upsert({
              event_id: baseUid,
              title: summary,
              start_time: startDate.toISOString(),
              end_time: endDate?.toISOString() || null,
              calendar_name: feed.name,
              location: location,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'event_id',
            });

          if (error) {
            console.error(`Error syncing event ${summary}:`, error);
            errors++;
          } else {
            synced++;
          }
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
