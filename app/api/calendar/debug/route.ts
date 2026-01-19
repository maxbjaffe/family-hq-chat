import { NextResponse } from 'next/server';
import ICAL from 'ical.js';

// Convert webcal:// to https:// for fetching
function normalizeUrl(url: string): string {
  return url.replace(/^webcal:\/\//, 'https://');
}

interface RawEvent {
  uid: string;
  summary: string;
  startDate: string | null;
  endDate: string | null;
  isRecurring: boolean;
  rrule: string | null;
  location: string | null;
}

interface CalendarDebugInfo {
  name: string;
  url: string;
  fetchStatus: 'success' | 'error';
  error?: string;
  totalEventsInFeed: number;
  recurringEvents: number;
  eventsInNext14Days: number;
  eventsInNext30Days: number;
  eventsInNext90Days: number;
  allEvents: RawEvent[];
  expandedOccurrences?: { summary: string; date: string }[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calendarName = searchParams.get('calendar');
  const showEvents = searchParams.get('events') === 'true';
  const expandRecurring = searchParams.get('expand') === 'true';
  const daysAhead = parseInt(searchParams.get('days') || '14');

  const feedsEnv = process.env.ICAL_FEEDS || '';

  if (!feedsEnv) {
    return NextResponse.json({ error: 'No ICAL_FEEDS configured' }, { status: 400 });
  }

  const feeds = feedsEnv.split(',').map(f => {
    const [name, url] = f.split('|');
    return { name: name.trim(), url: url.trim() };
  }).filter(f => f.name && f.url);

  // Filter to specific calendar if requested
  const targetFeeds = calendarName
    ? feeds.filter(f => f.name.toLowerCase() === calendarName.toLowerCase())
    : feeds;

  if (calendarName && targetFeeds.length === 0) {
    return NextResponse.json({
      error: `Calendar "${calendarName}" not found`,
      availableCalendars: feeds.map(f => f.name)
    }, { status: 404 });
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const limit30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const limit90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expandLimit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const results: CalendarDebugInfo[] = [];

  for (const feed of targetFeeds) {
    const debugInfo: CalendarDebugInfo = {
      name: feed.name,
      url: feed.url.substring(0, 50) + '...',
      fetchStatus: 'success',
      totalEventsInFeed: 0,
      recurringEvents: 0,
      eventsInNext14Days: 0,
      eventsInNext30Days: 0,
      eventsInNext90Days: 0,
      allEvents: [],
    };

    try {
      const response = await fetch(normalizeUrl(feed.url), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FamilyHQ/1.0)',
        },
      });

      if (!response.ok) {
        debugInfo.fetchStatus = 'error';
        debugInfo.error = `HTTP ${response.status}`;
        results.push(debugInfo);
        continue;
      }

      let icalData = await response.text();

      // Fix malformed multi-line fields
      icalData = icalData.replace(/\r?\n(?![A-Z-]+[:;]|[ \t]|END:|BEGIN:)/g, ' ');

      const jcalData = ICAL.parse(icalData);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents('vevent');

      debugInfo.totalEventsInFeed = vevents.length;

      const expandedOccurrences: { summary: string; date: string }[] = [];

      for (const vevent of vevents) {
        try {
          const event = new ICAL.Event(vevent);
          const startDate = event.startDate?.toJSDate();
          const endDate = event.endDate?.toJSDate();
          const rruleProp = vevent.getFirstProperty('rrule');
          const isRecurring = !!rruleProp;

          if (isRecurring) {
            debugInfo.recurringEvents++;
          }

          const rawEvent: RawEvent = {
            uid: event.uid,
            summary: event.summary || 'Untitled',
            startDate: startDate?.toISOString() || null,
            endDate: endDate?.toISOString() || null,
            isRecurring,
            rrule: rruleProp?.toICALString() || null,
            location: event.location || null,
          };

          if (showEvents) {
            debugInfo.allEvents.push(rawEvent);
          }

          // For non-recurring events, check date ranges
          if (!isRecurring && startDate) {
            if (startDate >= now && startDate <= limit14) debugInfo.eventsInNext14Days++;
            if (startDate >= now && startDate <= limit30) debugInfo.eventsInNext30Days++;
            if (startDate >= now && startDate <= limit90) debugInfo.eventsInNext90Days++;
          }

          // Expand recurring events if requested
          if (isRecurring && expandRecurring) {
            try {
              const iterator = event.iterator();
              let next = iterator.next();
              let count = 0;
              const maxOccurrences = 50; // Safety limit

              while (next && count < maxOccurrences) {
                const occurrenceDate = next.toJSDate();

                if (occurrenceDate > expandLimit) break;

                if (occurrenceDate >= now && occurrenceDate <= expandLimit) {
                  expandedOccurrences.push({
                    summary: event.summary || 'Untitled',
                    date: occurrenceDate.toISOString(),
                  });

                  if (occurrenceDate <= limit14) debugInfo.eventsInNext14Days++;
                  if (occurrenceDate <= limit30) debugInfo.eventsInNext30Days++;
                  if (occurrenceDate <= limit90) debugInfo.eventsInNext90Days++;
                }

                next = iterator.next();
                count++;
              }
            } catch (e) {
              // Some recurrence rules may fail to expand
              console.error(`Failed to expand recurring event: ${event.summary}`, e);
            }
          }
        } catch (e) {
          console.error('Error processing event:', e);
        }
      }

      if (expandRecurring && expandedOccurrences.length > 0) {
        debugInfo.expandedOccurrences = expandedOccurrences.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }

    } catch (e) {
      debugInfo.fetchStatus = 'error';
      debugInfo.error = e instanceof Error ? e.message : 'Unknown error';
    }

    results.push(debugInfo);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    dateRange: {
      now: now.toISOString(),
      limit14Days: limit14.toISOString(),
      limit30Days: limit30.toISOString(),
      limit90Days: limit90.toISOString(),
    },
    queryParams: {
      calendar: calendarName,
      showEvents,
      expandRecurring,
      daysAhead,
    },
    summary: {
      totalCalendars: results.length,
      totalEventsInFeeds: results.reduce((sum, r) => sum + r.totalEventsInFeed, 0),
      totalRecurringEvents: results.reduce((sum, r) => sum + r.recurringEvents, 0),
      eventsInNext14Days: results.reduce((sum, r) => sum + r.eventsInNext14Days, 0),
      eventsInNext30Days: results.reduce((sum, r) => sum + r.eventsInNext30Days, 0),
      eventsInNext90Days: results.reduce((sum, r) => sum + r.eventsInNext90Days, 0),
    },
    calendars: results,
  });
}
