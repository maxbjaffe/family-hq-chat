'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
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

export function UpcomingEventsCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/calendar?days=3');
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events?.slice(0, 4) || []);
        }
      } catch {
        // Silent fail
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const eventDay = new Date(date);
    eventDay.setHours(0, 0, 0, 0);

    if (eventDay.getTime() === today.getTime()) return 'Today';
    if (eventDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Upcoming</h3>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Upcoming</h3>
        </div>
        <Link href="/calendar" className="text-xs text-indigo-600 hover:underline">
          View all
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">No upcoming events</p>
      ) : (
        <div className="space-y-2">
          {events.map(event => {
            const colors = getCalendarColor(event.calendar_name);
            return (
              <div
                key={event.id}
                className={`p-2 rounded-lg border-l-4 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium">{formatDate(event.start_time)}</span>
                  <span className={colors.text}>{formatTime(event.start_time)}</span>
                </div>
                <p className="font-medium text-slate-800 text-sm truncate">
                  {event.title}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
