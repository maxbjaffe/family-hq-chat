"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RefreshCw, MapPin } from "lucide-react";
import { getCalendarColor } from "@/lib/calendar-colors";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string | null;
  all_day?: boolean;
  calendar_name?: string | null;
  location?: string | null;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const response = await fetch("/api/calendar");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }

  // Get unique calendar names from events
  const calendarNames = useMemo(() => {
    const names = new Set<string>();
    events.forEach(e => {
      if (e.calendar_name) names.add(e.calendar_name);
    });
    return Array.from(names).sort();
  }, [events]);

  // Filter events by selected calendar
  const filteredEvents = useMemo(() => {
    if (!selectedCalendar) return events;
    return events.filter(e => e.calendar_name === selectedCalendar);
  }, [events, selectedCalendar]);

  const formatEventTime = (dateStr: string, allDay?: boolean) => {
    if (allDay) return "All day";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventDay = new Date(date);
    eventDay.setHours(0, 0, 0, 0);

    if (eventDay.getTime() === today.getTime()) return "Today";
    if (eventDay.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateKey = formatEventDate(event.start_time);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Calendar
              </span>
            </h1>
            <p className="text-slate-600 mt-1">Upcoming family events</p>
          </div>
          <Button variant="outline" onClick={loadEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Calendar Filter */}
        {calendarNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCalendar(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCalendar
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({events.length})
            </button>
            {calendarNames.map(name => {
              const colors = getCalendarColor(name);
              const count = events.filter(e => e.calendar_name === name).length;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedCalendar(name === selectedCalendar ? null : name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    selectedCalendar === name
                      ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ${colors.border}`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  {name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            <p className="mt-2 text-slate-500">Loading events...</p>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <p className="text-lg text-slate-500">
              {selectedCalendar ? `No events in ${selectedCalendar}` : "No upcoming events"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {selectedCalendar
                ? "Try selecting a different calendar or show all"
                : "Events will appear here once calendar sync is configured"
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {date}
                </h2>
                <div className="space-y-2">
                  {dateEvents.map((event) => {
                    const colors = getCalendarColor(event.calendar_name);
                    return (
                      <Card
                        key={event.id}
                        className={`p-4 hover:shadow-md transition-shadow border-l-4 ${colors.border} ${colors.bg}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-16 text-center">
                            <div className={`text-sm font-medium ${colors.text}`}>
                              {formatEventTime(event.start_time, event.all_day)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900">
                              {event.title}
                            </h3>
                            {event.location && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                            {event.calendar_name && (
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                {event.calendar_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
