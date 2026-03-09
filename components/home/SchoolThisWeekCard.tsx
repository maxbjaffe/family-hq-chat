'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { GraduationCap, Calendar, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  source: string;
}

interface SchoolAction {
  id: string;
  title: string;
  deadline: string | null;
  urgency: number;
}

interface ChildData {
  events: SchoolEvent[];
  actions: SchoolAction[];
}

interface BriefingData {
  byChild: Record<string, ChildData>;
  familyEvents: SchoolEvent[];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return 'Today';
  if (target.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SchoolThisWeekCard({ className }: { className?: string }) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function fetchBriefing() {
      try {
        const res = await fetch('/api/school-briefing');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('[SchoolThisWeek] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBriefing();
  }, []);

  const childNames = data ? Object.keys(data.byChild) : [];
  const hasData = childNames.length > 0 || (data?.familyEvents?.length ?? 0) > 0;

  return (
    <Card className={`bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 p-5 flex flex-col ${className ?? ''}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">School This Week</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {!expanded && (
        <p className="text-xs text-slate-500 mt-1">
          {childNames.length > 0
            ? `${childNames.map(capitalize).join(', ')}`
            : 'No school items'}
        </p>
      )}

      {expanded && (
        <div className="mt-3 space-y-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            </div>
          ) : !hasData ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No school items this week
            </p>
          ) : (
            <>
              {/* Family-wide events */}
              {data?.familyEvents && data.familyEvents.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                    All Kids
                  </h4>
                  <div className="space-y-1.5">
                    {data.familyEvents.slice(0, 3).map(event => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {/* Per-child sections */}
              {childNames.map(child => {
                const childData = data!.byChild[child];
                return (
                  <div key={child}>
                    <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                      {capitalize(child)}
                    </h4>
                    <div className="space-y-1.5">
                      {childData.events.slice(0, 3).map(event => (
                        <EventRow key={event.id} event={event} />
                      ))}
                      {childData.actions.slice(0, 2).map(action => (
                        <ActionRow key={action.id} action={action} />
                      ))}
                      {childData.events.length === 0 && childData.actions.length === 0 && (
                        <p className="text-xs text-slate-400">Nothing this week</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function EventRow({ event }: { event: SchoolEvent }) {
  return (
    <div className="flex items-start gap-2 p-2 bg-white/60 rounded-md border border-emerald-100">
      <Calendar className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-700 leading-snug truncate">
          {event.title}
        </p>
        <p className="text-xs text-emerald-600">{formatDate(event.date)}</p>
      </div>
    </div>
  );
}

function ActionRow({ action }: { action: SchoolAction }) {
  const isUrgent = action.urgency >= 4;
  return (
    <div className="flex items-start gap-2 p-2 bg-white/60 rounded-md border border-amber-100">
      <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isUrgent ? 'text-amber-500' : 'text-slate-400'}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-700 leading-snug truncate">
          {action.title}
        </p>
        {action.deadline && (
          <p className="text-xs text-amber-600">Due {formatDate(action.deadline)}</p>
        )}
      </div>
    </div>
  );
}
