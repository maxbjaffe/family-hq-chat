'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  calendar_name: string;
  location: string | null;
}

interface ComingUpCardProps {
  memberName: string;
  excludeEventTitles?: string[];
}

function formatEventDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const eventDay = new Date(date);
  eventDay.setHours(0, 0, 0, 0);

  if (eventDay.getTime() === today.getTime()) return 'Today';
  if (eventDay.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ComingUpCard({ memberName, excludeEventTitles = [] }: ComingUpCardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/calendar');
        if (res.ok) {
          const data = await res.json();
          // Filter for this member's calendar or family calendars
          const memberNameLower = memberName.toLowerCase();
          const excludeTitlesLower = excludeEventTitles.map(t => t.toLowerCase());

          const filtered = (data.events || [])
            .filter((e: CalendarEvent) => {
              // Include if calendar name contains member name OR is a family calendar
              const calNameLower = e.calendar_name?.toLowerCase() || '';
              const isRelevant = calNameLower.includes(memberNameLower) ||
                calNameLower.includes('family') ||
                calNameLower.includes('jaffe');

              // Exclude if title matches school events (to avoid duplicates)
              const titleLower = e.title?.toLowerCase() || '';
              const isDuplicate = excludeTitlesLower.some(
                excl => titleLower.includes(excl) || excl.includes(titleLower)
              );

              return isRelevant && !isDuplicate;
            })
            .slice(0, 5);

          setEvents(filtered);
        }
      } catch (error) {
        console.error('Failed to load calendar:', error);
      }
      setLoading(false);
    }

    loadEvents();
  }, [memberName, excludeEventTitles]);

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-slate-800">Coming Up</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-slate-800">Coming Up</h3>
        </div>
        <p className="text-sm text-slate-500 text-center py-4">
          No upcoming events
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-slate-800">Coming Up</h3>
      </div>

      <div className="space-y-2">
        {events.map(event => (
          <div
            key={event.id}
            className="p-2 rounded-lg bg-white/50"
          >
            <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
              <span>{formatEventDate(event.start_time)}</span>
              <span className="text-slate-500">{formatEventTime(event.start_time)}</span>
            </div>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {event.title}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
