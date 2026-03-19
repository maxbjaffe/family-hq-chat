'use client';

import { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCalendarColor } from '@/lib/calendar-colors';
import { FAMILY_TIMEZONE } from '@/lib/constants';
import Link from 'next/link';

interface UpcomingItem {
  id: string;
  title: string;
  date: string;
  type: 'calendar' | 'school-event' | 'action';
  source: string;
  children?: string[];
  urgency?: string;
  location?: string;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  icon: string;
  description: string;
}

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  high: number;
  low: number;
  forecast?: ForecastDay[];
}

interface TodayHeroCardProps {
  items: UpcomingItem[];
  className?: string;
  kioskMode?: boolean;
  hideWeather?: boolean;
}

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: FAMILY_TIMEZONE });
}

function isToday(dateStr: string): boolean {
  const eventDay = new Date(dateStr).toLocaleDateString('en-CA', { timeZone: FAMILY_TIMEZONE });
  return eventDay === getTodayStr();
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: FAMILY_TIMEZONE,
  });
}

function getLeftBorderColor(item: UpcomingItem): string {
  if (item.type === 'school-event') return 'border-amber-400';
  if (item.type === 'action') return 'border-rose-400';
  const colors = getCalendarColor(item.source);
  return colors.border;
}

export function TodayHeroCard({ items, className, kioskMode, hideWeather }: TodayHeroCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    if (hideWeather) {
      setWeatherLoading(false);
      return;
    }
    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather');
        if (res.ok) setWeather(await res.json());
      } catch {
        // silent
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchWeather();
  }, [hideWeather]);

  const todayItems = items.filter((item) => isToday(item.date));
  const maxVisible = kioskMode ? 6 : 3;
  const visible = todayItems.slice(0, maxVisible);
  const extraCount = todayItems.length - maxVisible;

  // Schedule-only mode: no weather, full-width schedule
  if (hideWeather) {
    return (
      <Card className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-5 flex flex-col ${className ?? ''}`}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-600">
            Today&apos;s Schedule
          </h2>
          {todayItems.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 text-xs font-bold">
              {todayItems.length}
            </span>
          )}
        </div>

        {todayItems.length === 0 ? (
          <div className="flex items-center gap-2 py-3">
            <Calendar className="h-5 w-5 text-indigo-300" />
            <p className="text-sm text-slate-500">Nothing on the schedule today!</p>
          </div>
        ) : (
          <div className="space-y-1 flex-1">
            {visible.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 py-1.5 border-l-[3px] pl-3 ${getLeftBorderColor(item)}`}
              >
                <span className="text-xs font-medium text-slate-500 w-14 flex-shrink-0">
                  {formatTime(item.date)}
                </span>
                <span className="text-sm font-medium text-slate-800 truncate">
                  {item.title}
                </span>
              </div>
            ))}
            {extraCount > 0 && (
              <Link
                href="/calendar"
                className="block text-xs text-indigo-600 hover:text-indigo-800 font-medium pt-1 pl-3"
              >
                +{extraCount} more &rarr;
              </Link>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-5 ${className ?? ''}`}>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* ── Weather (left) ────────────────────── */}
        <div className="flex-shrink-0 md:w-[200px]">
          {weatherLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>
          ) : weather ? (
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{weather.icon}</span>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {weather.temperature}°F
                  </div>
                  <div className="text-xs text-slate-500">
                    H: {weather.high}° L: {weather.low}°
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-600 mt-1">{weather.description}</div>
              {weather.forecast && weather.forecast.length > 0 && (() => {
                const forecastDays = kioskMode
                  ? weather.forecast.filter((d) => d.day !== 'Today').slice(0, 5)
                  : weather.forecast;
                return (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-blue-100">
                    {forecastDays.map((day) => (
                      <div key={day.day} className="text-center">
                        <div className="text-[10px] font-medium text-slate-500">{day.day}</div>
                        <div className="text-lg my-0.5">{day.icon}</div>
                        <div className="text-[10px] text-slate-600">
                          {day.high}°/{day.low}°
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-sm text-slate-400">Weather unavailable</div>
          )}
        </div>

        {/* ── Divider ───────────────────────────── */}
        <div className="hidden md:block w-px bg-indigo-200/60" />
        <div className="md:hidden h-px bg-indigo-200/60" />

        {/* ── Next Up (right) ───────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-600">
              Next Up
            </h2>
            {todayItems.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 text-xs font-bold">
                {todayItems.length}
              </span>
            )}
          </div>

          {todayItems.length === 0 ? (
            <div className="flex items-center gap-2 py-3">
              <Calendar className="h-5 w-5 text-indigo-300" />
              <p className="text-sm text-slate-500">Nothing on the schedule today!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {visible.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 py-1.5 border-l-[3px] pl-3 ${getLeftBorderColor(item)}`}
                >
                  <span className="text-xs font-medium text-slate-500 w-14 flex-shrink-0">
                    {formatTime(item.date)}
                  </span>
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {item.title}
                  </span>
                </div>
              ))}
              {extraCount > 0 && (
                <Link
                  href="/calendar"
                  className="block text-xs text-indigo-600 hover:text-indigo-800 font-medium pt-1 pl-3"
                >
                  +{extraCount} more &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
