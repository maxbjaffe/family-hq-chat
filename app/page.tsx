"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Calendar,
  RefreshCw,
  Sparkles,
  Paintbrush,
  Loader2,
} from "lucide-react";
import { Clock } from "@/components/Clock";
import { SyncIndicator, startSync, endSync } from "@/components/SyncIndicator";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ChecklistItem {
  id: string;
  title: string;
  icon?: string;
  isCompleted: boolean;
}

interface ChildData {
  id: string;
  name: string;
  avatar_type: string | null;
  avatar_data: string | null;
  checklist: ChecklistItem[];
  stats: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  high: number;
  low: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  all_day?: boolean;
}

const AVATAR_COLORS = [
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-green-400 to-green-600",
];

export default function DashboardPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingItems, setTogglingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    startSync();
    try {
      await Promise.all([loadChecklist(), loadWeather(), loadCalendar()]);
      endSync(true);
    } catch {
      endSync(false);
    }
    setLoading(false);
  }

  async function refreshData() {
    setRefreshing(true);
    startSync();
    try {
      await Promise.all([loadChecklist(), loadWeather(), loadCalendar()]);
      endSync(true);
    } catch {
      endSync(false);
    }
    setRefreshing(false);
  }

  async function loadChecklist() {
    try {
      const response = await fetch("/api/checklist");
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error("Error loading checklist:", error);
    }
  }

  async function loadWeather() {
    try {
      const response = await fetch("/api/weather");
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (error) {
      console.error("Error loading weather:", error);
    }
  }

  async function loadCalendar() {
    try {
      const response = await fetch("/api/calendar");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error loading calendar:", error);
    }
  }

  async function toggleItem(childId: string, itemId: string, isCompleted: boolean) {
    const itemKey = `${childId}-${itemId}`;
    setTogglingItems((prev) => new Set(prev).add(itemKey));
    startSync();

    // Optimistic update
    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== childId) return c;
        const newChecklist = c.checklist.map((item) =>
          item.id === itemId ? { ...item, isCompleted: !isCompleted } : item
        );
        const completed = newChecklist.filter((i) => i.isCompleted).length;
        return {
          ...c,
          checklist: newChecklist,
          stats: {
            total: newChecklist.length,
            completed,
            remaining: newChecklist.length - completed,
            isComplete: completed === newChecklist.length,
          },
        };
      })
    );

    try {
      await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, itemId, isCompleted }),
      });
      endSync(true);
    } catch (error) {
      console.error("Error toggling item:", error);
      endSync(false);
      loadChecklist();
    } finally {
      setTogglingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
    }
  }

  const allComplete = children.length > 0 && children.every((c) => c.stats.isComplete);
  const totalCompleted = children.reduce((sum, c) => sum + c.stats.completed, 0);
  const totalItems = children.reduce((sum, c) => sum + c.stats.total, 0);

  const formatEventTime = (dateStr: string, allDay?: boolean) => {
    if (allDay) return "All day";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-lg text-slate-600">Loading Family HQ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            <img
              src="/Images/JaffeFamilyHubLogo.PNG"
              alt="Jaffe Family Hub"
              className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover shadow-xl"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}!
              </h1>
              <p className="text-slate-600 text-lg">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Large Clock Display */}
            <Clock size="lg" className="hidden md:block" />
            <div className="flex items-center gap-3">
              <SyncIndicator />
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
                className="min-h-[48px] min-w-[48px]"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Top Row: Weather + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Weather Card */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{weather?.icon || "🌡️"}</div>
              <div>
                <div className="text-3xl font-bold text-slate-900">
                  {weather?.temperature || "--"}°F
                </div>
                <div className="text-sm text-slate-600">
                  {weather?.description || "Loading..."}
                </div>
                {weather && (
                  <div className="text-xs text-slate-500">
                    H: {weather.high}° L: {weather.low}°
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Checklist Summary */}
          <Card className={`p-4 ${allComplete ? "bg-gradient-to-br from-green-50 to-emerald-50" : ""}`}>
            <div className="flex items-center gap-3">
              {allComplete ? (
                <Sparkles className="h-10 w-10 text-green-500" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-slate-400" />
              )}
              <div className="flex-1">
                <div className="text-lg font-bold text-slate-900">
                  {allComplete ? "All Ready!" : "Morning Checklist"}
                </div>
                <div className="text-sm text-slate-600">
                  {totalCompleted}/{totalItems} items complete
                </div>
                <Progress
                  value={totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0}
                  className="h-2 mt-2"
                />
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <div className="text-sm font-medium text-slate-600 mb-3">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild className="justify-start min-h-[48px]">
                <Link href="/chat">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Ask AI
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start min-h-[48px]">
                <Link href="/doodle">
                  <Paintbrush className="h-5 w-5 mr-2" />
                  Doodle
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Content: Checklists + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kids Checklists */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Morning Checklist
            </h2>

            {children.length === 0 ? (
              <Card className="p-6 text-center text-slate-500">
                No children configured yet
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child, index) => (
                  <Card
                    key={child.id}
                    className={`p-5 ${
                      child.stats.isComplete
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                        : ""
                    }`}
                  >
                    {/* Large Avatar Section */}
                    <div className="flex flex-col items-center mb-4">
                      {child.avatar_type === "custom" && child.avatar_data ? (
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                          <img
                            src={child.avatar_data}
                            alt={child.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${
                            AVATAR_COLORS[index % AVATAR_COLORS.length]
                          } flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-xl`}
                        >
                          {child.name.charAt(0)}
                        </div>
                      )}
                      <h3
                        className="mt-3 text-2xl font-black text-slate-800 tracking-tight"
                        style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive" }}
                      >
                        {child.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-500 font-medium">
                          {child.stats.completed}/{child.stats.total}
                        </span>
                        {child.stats.isComplete && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {child.checklist.slice(0, 5).map((item) => {
                        const itemKey = `${child.id}-${item.id}`;
                        const isToggling = togglingItems.has(itemKey);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleItem(child.id, item.id, item.isCompleted)}
                            disabled={isToggling}
                            className={`w-full flex items-center gap-2 p-3 min-h-[48px] rounded-lg cursor-pointer transition-all ${
                              item.isCompleted
                                ? "bg-green-100 text-green-800"
                                : "hover:bg-slate-100"
                            } ${isToggling ? "opacity-50" : ""}`}
                          >
                            {isToggling ? (
                              <Loader2 className="h-5 w-5 text-purple-500 animate-spin flex-shrink-0" />
                            ) : item.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            )}
                            {item.icon && <span className="text-lg">{item.icon}</span>}
                            <span
                              className={`text-sm font-medium text-left ${
                                item.isCompleted ? "line-through" : ""
                              }`}
                            >
                              {item.title}
                            </span>
                          </button>
                        );
                      })}
                      {child.checklist.length > 5 && (
                        <Link
                          href="/kiosk"
                          className="flex items-center justify-center min-h-[48px] text-sm text-blue-600 hover:underline font-medium rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          +{child.checklist.length - 5} more items
                        </Link>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming
            </h2>

            <Card className="p-4">
              {events.length === 0 ? (
                <div className="text-center text-slate-500 py-4">
                  No upcoming events
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 8).map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="text-xs font-medium text-slate-500 w-16 flex-shrink-0">
                        {formatEventDate(event.start_time)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {event.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatEventTime(event.start_time, event.all_day)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
