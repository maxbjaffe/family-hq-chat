'use client';

import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCalendarColor } from '@/lib/calendar-colors';
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

interface TodayHeroCardProps {
  items: UpcomingItem[];
}

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function getTomorrowStr(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function isToday(dateStr: string): boolean {
  const eventDay = new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return eventDay === getTodayStr();
}

function isTomorrow(dateStr: string): boolean {
  const eventDay = new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return eventDay === getTomorrowStr();
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

function getLeftBorderColor(item: UpcomingItem): string {
  if (item.type === 'school-event') return 'border-amber-400';
  if (item.type === 'action') return 'border-rose-400';
  const colors = getCalendarColor(item.source);
  return colors.border;
}

function getIndicatorLabel(item: UpcomingItem): { text: string; color: string } {
  if (item.children && item.children.length > 0) {
    const name = item.children[0].charAt(0).toUpperCase() + item.children[0].slice(1);
    return { text: name, color: 'text-violet-600' };
  }
  if (item.type === 'school-event') return { text: 'School', color: 'text-amber-600' };
  if (item.type === 'action') return { text: 'Action', color: 'text-rose-600' };
  return { text: item.source || 'Calendar', color: 'text-slate-500' };
}

function EventRow({ item, dimmed = false }: { item: UpcomingItem; dimmed?: boolean }) {
  const borderColor = getLeftBorderColor(item);
  const indicator = getIndicatorLabel(item);

  return (
    <div
      className={`flex items-center gap-3 py-2 border-l-[3px] pl-3 ${borderColor} ${
        dimmed ? 'opacity-70' : ''
      }`}
    >
      <span className="text-xs font-medium text-slate-500 w-16 flex-shrink-0">
        {formatTime(item.date)}
      </span>
      <span className={`text-xs ${indicator.color} flex-shrink-0`}>
        {indicator.text}
      </span>
      <span className="text-sm font-medium text-slate-800 truncate">
        {item.title}
      </span>
    </div>
  );
}

export function TodayHeroCard({ items }: TodayHeroCardProps) {
  const todayItems = items.filter((item) => isToday(item.date));
  const tomorrowItems = items.filter((item) => isTomorrow(item.date));
  const visibleToday = todayItems.slice(0, 8);
  const extraCount = todayItems.length - 8;
  const visibleTomorrow = tomorrowItems.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">Today</h2>
          {todayItems.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 text-xs font-bold">
              {todayItems.length}
            </span>
          )}
        </div>
      </div>

      {/* Today's events */}
      {todayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-8 w-8 text-indigo-300 mb-2" />
          <p className="text-sm text-slate-500">Nothing on the schedule today! 🎉</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {visibleToday.map((item) => (
            <EventRow key={item.id} item={item} />
          ))}
          {extraCount > 0 && (
            <Link
              href="/calendar"
              className="block text-xs text-indigo-600 hover:text-indigo-800 font-medium pt-2 pl-3"
            >
              and {extraCount} more &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Tomorrow preview */}
      <div className="border-t border-indigo-200/60 mt-4 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xs font-bold uppercase text-indigo-600 tracking-wide">
            Tomorrow
          </h3>
          {tomorrowItems.length > 0 && (
            <span className="text-[10px] text-indigo-400">{tomorrowItems.length}</span>
          )}
        </div>
        {tomorrowItems.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing scheduled tomorrow &#10003;</p>
        ) : (
          <div className="space-y-0.5">
            {visibleTomorrow.map((item) => (
              <EventRow key={item.id} item={item} dimmed />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
