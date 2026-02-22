'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Loader2, GraduationCap, AlertCircle } from 'lucide-react';
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

interface UpcomingEventsCardProps {
  sidebar?: boolean;
}

const TYPE_STYLES: Record<UpcomingItem['type'], { bg: string; border: string; text: string }> = {
  'calendar': { bg: '', border: '', text: '' }, // uses calendar-colors
  'school-event': { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  'action': { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
};

export function UpcomingEventsCard({ sidebar = false }: UpcomingEventsCardProps) {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/upcoming?days=7');
        if (res.ok) {
          const data = await res.json();
          const limit = sidebar ? 15 : 6;
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

  function formatDate(dateStr: string): string {
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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function getItemStyles(item: UpcomingItem) {
    if (item.type === 'calendar') {
      return getCalendarColor(item.source);
    }
    return TYPE_STYLES[item.type];
  }

  function getTypeIcon(type: UpcomingItem['type']) {
    switch (type) {
      case 'school-event':
        return <GraduationCap className="h-3 w-3" />;
      case 'action':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
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
        <div className="space-y-2">
          {items.map(item => {
            const styles = getItemStyles(item);
            const icon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                className={`p-2 rounded-lg border-l-4 ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium">{formatDate(item.date)}</span>
                  <span className={styles.text}>{formatTime(item.date)}</span>
                  {icon && (
                    <span className={`flex items-center gap-0.5 ${styles.text}`}>
                      {icon}
                      <span className="text-[10px]">
                        {item.type === 'action' ? 'Action' : 'School'}
                      </span>
                    </span>
                  )}
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
      )}
    </Card>
  );
}
