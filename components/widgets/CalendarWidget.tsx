'use client';

import { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCalendarColor } from '@/lib/calendar-colors';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location: string | null;
}

interface GroupedEvents {
  today: CalendarEvent[];
  tomorrow: CalendarEvent[];
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/dashboard/calendar');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch calendar:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Group events by today/tomorrow
  const groupedEvents: GroupedEvents = events.reduce(
    (acc, event) => {
      const eventDate = new Date(event.start_time);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const eventDay = new Date(eventDate);
      eventDay.setHours(0, 0, 0, 0);

      if (eventDay.getTime() === today.getTime()) {
        acc.today.push(event);
      } else if (eventDay.getTime() === tomorrow.getTime()) {
        acc.tomorrow.push(event);
      }
      return acc;
    },
    { today: [], tomorrow: [] } as GroupedEvents
  );

  const renderEvent = (event: CalendarEvent) => {
    const colors = getCalendarColor(event.calendar_name);
    return (
      <li key={event.id} className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
        <span className="text-xs text-gray-500 w-14 shrink-0">
          {formatTime(event.start_time)}
        </span>
        <span className="text-sm text-gray-800 truncate">{event.title}</span>
      </li>
    );
  };

  const totalEvents = groupedEvents.today.length + groupedEvents.tomorrow.length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Calendar</h3>
        </div>
        <Link href="/calendar" className="text-xs text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">Loading events...</span>
        </div>
      ) : totalEvents === 0 ? (
        <p className="text-sm text-gray-500">No events today or tomorrow</p>
      ) : (
        <div className="space-y-3">
          {/* Today's events */}
          {groupedEvents.today.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Today</h4>
              <ul className="space-y-1.5">
                {groupedEvents.today.slice(0, 4).map(renderEvent)}
              </ul>
            </div>
          )}

          {/* Tomorrow's events */}
          {groupedEvents.tomorrow.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Tomorrow</h4>
              <ul className="space-y-1.5">
                {groupedEvents.tomorrow.slice(0, 4).map(renderEvent)}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
