'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, ChevronDown, ChevronUp, Loader2, MapPin } from 'lucide-react';
import { getCalendarColor, getCalendarsForMember } from '@/lib/calendar-colors';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location: string | null;
}

interface FamilyCalendarSectionProps {
  memberName: string;
  excludeEventTitles?: string[];
}

export function FamilyCalendarSection({ memberName, excludeEventTitles = [] }: FamilyCalendarSectionProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/calendar?days=7');
        if (res.ok) {
          const data = await res.json();
          // Filter to calendars relevant to this family member
          const relevantCalendars = getCalendarsForMember(memberName);
          let relevantEvents = (data.events || []).filter((e: CalendarEvent) =>
            !e.calendar_name || relevantCalendars.includes(e.calendar_name)
          );

          // Deduplicate: exclude events that match school event titles
          if (excludeEventTitles.length > 0) {
            relevantEvents = relevantEvents.filter((e: CalendarEvent) => {
              const title = e.title?.toLowerCase().trim() || '';
              return !excludeEventTitles.some(excluded =>
                title.includes(excluded) || excluded.includes(title)
              );
            });
          }

          setEvents(relevantEvents.slice(0, 10));
        }
      } catch {
        // Silent fail
      }
      setLoading(false);
    }
    fetchEvents();
  }, [memberName, excludeEventTitles]);

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
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventDay = new Date(date);
    eventDay.setHours(0, 0, 0, 0);

    if (eventDay.getTime() === today.getTime()) return 'Today';
    if (eventDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = formatDate(event.start_time);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  if (loading) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Upcoming Events</h2>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return null; // Don't show section if no events
  }

  return (
    <Card className="p-4 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Upcoming Events</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">{date}</h3>
              <div className="space-y-2">
                {dateEvents.map(event => {
                  const colors = getCalendarColor(event.calendar_name);
                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border-l-4 ${colors.border} ${colors.bg}`}
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        <span className={colors.text}>{formatTime(event.start_time)}</span>
                        {event.calendar_name && (
                          <span className="text-slate-400">• {event.calendar_name}</span>
                        )}
                      </div>
                      <p className="font-medium text-slate-800">{event.title}</p>
                      {event.location && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <Link
            href="/calendar"
            className="block text-center text-sm text-indigo-600 hover:underline pt-2"
          >
            View full calendar
          </Link>
        </div>
      )}
    </Card>
  );
}
