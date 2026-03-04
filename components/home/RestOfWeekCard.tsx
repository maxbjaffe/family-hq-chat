'use client';

import { useMemo, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCalendarColor } from '@/lib/calendar-colors';
import Link from 'next/link';

export interface UpcomingItem {
  id: string;
  title: string;
  date: string;
  type: 'calendar' | 'school-event' | 'action';
  source: string;
  children?: string[];
  urgency?: string;
}

interface RestOfWeekCardProps {
  items: UpcomingItem[];
  defaultExpanded?: boolean;
  horizontal?: boolean;
}

const TZ = 'America/New_York';

function toEasternDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TZ });
}

function getEasternToday(): string {
  return toEasternDateString(new Date());
}

function getEasternTomorrow(): string {
  const now = new Date();
  // Shift by one day in Eastern time
  const todayStr = getEasternToday();
  const todayDate = new Date(todayStr + 'T12:00:00');
  todayDate.setDate(todayDate.getDate() + 1);
  return todayDate.toISOString().slice(0, 10);
}

function getEndOfWeek(): string {
  // End of the current week (Sunday)
  const todayStr = getEasternToday();
  const todayDate = new Date(todayStr + 'T12:00:00');
  const dayOfWeek = todayDate.getDay(); // 0=Sun
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  todayDate.setDate(todayDate.getDate() + daysUntilSunday);
  return todayDate.toISOString().slice(0, 10);
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getLeftBorderColor(item: UpcomingItem): string {
  if (item.type === 'school-event') return 'border-amber-400';
  if (item.type === 'action') return 'border-rose-400';
  return getCalendarColor(item.source).border;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  });
}

export function RestOfWeekCard({ items, defaultExpanded = false, horizontal = false }: RestOfWeekCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const today = getEasternToday();
  const tomorrow = getEasternTomorrow();
  const endOfWeek = getEndOfWeek();

  const { tomorrowItems, remainingDays, allDays, totalCount } = useMemo(() => {
    const afterToday = items.filter((item) => {
      const itemDate = toEasternDateString(new Date(item.date));
      return itemDate > today && itemDate <= endOfWeek;
    });

    const tomorrowItems = afterToday.filter(
      (item) => toEasternDateString(new Date(item.date)) === tomorrow
    );

    const remaining = afterToday.filter(
      (item) => toEasternDateString(new Date(item.date)) > tomorrow
    );

    const dayMap = new Map<string, UpcomingItem[]>();
    for (const item of remaining) {
      const key = toEasternDateString(new Date(item.date));
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(item);
    }

    const remainingDays = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, dayItems]) => ({
        dateStr,
        dayName: getDayName(dateStr),
        count: dayItems.length,
        items: dayItems,
      }));

    // Build unified day columns for horizontal mode
    const allDayMap = new Map<string, UpcomingItem[]>();
    for (const item of afterToday) {
      const key = toEasternDateString(new Date(item.date));
      if (!allDayMap.has(key)) allDayMap.set(key, []);
      allDayMap.get(key)!.push(item);
    }
    const allDays = Array.from(allDayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, dayItems]) => ({
        dateStr,
        dayName: getDayName(dateStr),
        items: dayItems,
      }));

    return { tomorrowItems, remainingDays, allDays, totalCount: afterToday.length };
  }, [items, today, tomorrow, endOfWeek]);

  // Horizontal mode: always expanded, days as columns
  if (horizontal) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Rest of the Week</h3>
          {totalCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 text-xs font-bold">
              {totalCount}
            </span>
          )}
          <div className="flex-1" />
          <Link
            href="/calendar"
            className="text-xs text-indigo-600 hover:underline"
          >
            Full calendar →
          </Link>
        </div>

        {totalCount === 0 ? (
          <p className="text-center text-sm text-slate-500 py-2">
            Nothing else scheduled this week
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto">
            {allDays.map((day) => (
              <div key={day.dateStr} className="flex-1 min-w-[140px]">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">
                  {day.dayName}
                </h4>
                <div className="space-y-1">
                  {day.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-1.5 py-1 border-l-[3px] pl-2 ${getLeftBorderColor(item)}`}
                    >
                      <span className="text-[10px] font-medium text-slate-500 w-12 shrink-0 pt-0.5">
                        {formatTime(item.date)}
                      </span>
                      <span className="text-xs font-medium text-slate-800 leading-tight">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-indigo-100/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Rest of the Week</h3>
          {totalCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 text-xs font-bold">
              {totalCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="px-5 pb-4">
          {totalCount === 0 ? (
            <p className="text-center text-sm text-slate-500 py-2">
              Nothing else scheduled this week
            </p>
          ) : (
            <div className="space-y-4">
              {tomorrowItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                      Tomorrow
                    </h4>
                    <div className="flex-1 h-px bg-indigo-200" />
                  </div>
                  <div className="space-y-1.5">
                    {tomorrowItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border-l-4 bg-white/60 ${getLeftBorderColor(item)}`}
                      >
                        <span className="text-xs font-medium text-slate-500 w-16 shrink-0">
                          {formatTime(item.date)}
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {remainingDays.length > 0 && (
                <div>
                  {tomorrowItems.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                        Later This Week
                      </h4>
                      <div className="flex-1 h-px bg-indigo-200" />
                    </div>
                  )}
                  <div className="space-y-1">
                    {remainingDays.map((day) => (
                      <div
                        key={day.dateStr}
                        className="flex items-center justify-between py-1.5 px-2"
                      >
                        <span className="text-sm text-slate-700 font-medium">
                          {day.dayName}
                        </span>
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {day.count} event{day.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-indigo-100">
            <Link
              href="/calendar"
              className="text-xs text-indigo-600 hover:underline"
            >
              View full calendar →
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
