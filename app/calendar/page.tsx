"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RefreshCw, Clock } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  all_day?: boolean;
  category?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
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

        {/* Events List */}
        {loading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            <p className="mt-2 text-slate-500">Loading events...</p>
          </Card>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <p className="text-lg text-slate-500">No upcoming events</p>
            <p className="text-sm text-slate-400 mt-1">
              Events will appear here once calendar sync is configured
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
                  {dateEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="text-sm font-medium text-blue-600">
                            {formatEventTime(event.start_time, event.all_day)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 truncate">
                            {event.title}
                          </h3>
                          {event.category && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                              {event.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
