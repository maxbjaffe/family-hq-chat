'use client';

import { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location: string | null;
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

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">Today</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">Loading events...</span>
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500">No events today</p>
      ) : (
        <ul className="space-y-2">
          {events.slice(0, 5).map((event) => (
            <li key={event.id} className="flex items-start gap-2">
              <span className="text-xs text-gray-500 w-16 shrink-0">
                {formatTime(event.start_time)}
              </span>
              <span className="text-sm text-gray-800">{event.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
