'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Loader2, GraduationCap, AlertCircle, Mail } from 'lucide-react';
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

interface UpcomingEventsCardProps {
  sidebar?: boolean;
}

const TYPE_STYLES: Record<UpcomingItem['type'], { bg: string; border: string; text: string }> = {
  'calendar': { bg: '', border: '', text: '' }, // uses calendar-colors
  'school-event': { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  'action': { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
};

function getDayKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: FAMILY_TIMEZONE });
}

function getDayLabel(dateStr: string): string {
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
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getSourceLabel(item: UpcomingItem): string {
  if (item.type === 'action') return 'Action Item';
  if (item.type === 'school-event') return item.source || 'School Email';
  return item.source || 'Calendar';
}

function getSourceIcon(item: UpcomingItem) {
  switch (item.type) {
    case 'school-event':
      return <GraduationCap className="h-3 w-3 flex-shrink-0" />;
    case 'action':
      return <AlertCircle className="h-3 w-3 flex-shrink-0" />;
    default:
      if (item.source && item.source.toLowerCase().includes('mail')) {
        return <Mail className="h-3 w-3 flex-shrink-0" />;
      }
      return <Calendar className="h-3 w-3 flex-shrink-0" />;
  }
}

export function UpcomingEventsCard({ sidebar = false }: UpcomingEventsCardProps) {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/upcoming?days=7');
        if (res.ok) {
          const data = await res.json();
          const limit = sidebar ? 20 : 8;
          setItems((data.items || []).slice(0, limit));
        }
      } catch {
        // Silent fail
      }
      setLoading(false);
    }
    fetchItems();
  }, [sidebar]);

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getItemStyles(item: UpcomingItem) {
    if (item.type === 'calendar') {
      return getCalendarColor(item.source);
    }
    return TYPE_STYLES[item.type];
  }

  // Group items by day
  function groupByDay(items: UpcomingItem[]): { dayKey: string; label: string; items: UpcomingItem[] }[] {
    const groups: Map<string, UpcomingItem[]> = new Map();
    for (const item of items) {
      const key = getDayKey(item.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).map(([dayKey, dayItems]) => ({
      dayKey,
      label: getDayLabel(dayItems[0].date),
      items: dayItems,
    }));
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

  const dayGroups = groupByDay(items);

  return (
    <Card className={`p-4 bg-gradient-to-br from-indigo-50 to-violet-50 ${sidebar ? 'h-full' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Upcoming</h3>
        </div>
        <Link href="/calendar" className="text-xs text-indigo-600 hover:underline">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">No upcoming events</p>
      ) : (
        <div className="space-y-3">
          {dayGroups.map(group => (
            <div key={group.dayKey}>
              {/* Day header */}
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                  {group.label}
                </h4>
                <div className="flex-1 h-px bg-indigo-200" />
                <span className="text-[10px] text-indigo-400">{group.items.length}</span>
              </div>

              {/* Day items */}
              <div className="space-y-1.5">
                {group.items.map(item => {
                  const styles = getItemStyles(item);
                  const sourceIcon = getSourceIcon(item);
                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg border-l-4 ${styles.bg} ${styles.border}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${styles.text}`}>
                          {formatTime(item.date)}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] ${styles.text} opacity-75`}>
                          {sourceIcon}
                          {getSourceLabel(item)}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {item.title}
                      </p>
                      {item.children && item.children.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.children.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
