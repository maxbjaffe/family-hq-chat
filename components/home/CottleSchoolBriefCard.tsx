'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  GraduationCap,
  Calendar,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

interface ChildBrief {
  events: Array<{ title: string; date: string }>;
  actions: Array<{ action: string; urgency: string }>;
}

interface CottleBriefData {
  summary: string | null;
  summaryAge: number;
  byChild: Record<string, ChildBrief>;
  itemCount: number;
  generatedAt: string;
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

function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Render simple inline markdown: **bold**, - bullets, ### headers */
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;

    // Header
    if (trimmed.startsWith('### ')) {
      return (
        <p key={i} className="font-semibold text-slate-700 text-sm mt-2 mb-1">
          {trimmed.slice(4)}
        </p>
      );
    }

    // Bullet
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const content = isBullet ? trimmed.slice(2) : trimmed;

    // Bold
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={i} className="text-sm text-slate-600 ml-3 list-disc">
          {rendered}
        </li>
      );
    }

    return (
      <p key={i} className="text-sm text-slate-600">
        {rendered}
      </p>
    );
  });
}

export function CottleSchoolBriefCard({ className }: { className?: string }) {
  const [data, setData] = useState<CottleBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [childOpen, setChildOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchBrief() {
      try {
        const res = await fetch('/api/cottle-brief');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('[CottleBrief] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBrief();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/cottle-brief', { method: 'POST' });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('[CottleBrief] Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }

  function toggleChild(child: string) {
    setChildOpen(prev => ({ ...prev, [child]: !prev[child] }));
  }

  const childNames = data ? Object.keys(data.byChild) : [];
  const totalEvents = childNames.reduce((sum, c) => sum + (data?.byChild[c]?.events.length || 0), 0);
  const totalActions = childNames.reduce((sum, c) => sum + (data?.byChild[c]?.actions.length || 0), 0);

  return (
    <Card className={`bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 p-5 flex flex-col ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <GraduationCap className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Cottle School Brief</h3>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50"
          title="Refresh school brief"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
          )}
        </button>
      </div>

      {/* Collapsed summary */}
      {!expanded && (
        <p className="text-xs text-slate-500 mt-1">
          {data
            ? `${data.itemCount} emails, ${childNames.length} kids`
            : 'Loading...'}
        </p>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-3 flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            </div>
          ) : !data || (data.itemCount === 0 && !data.summary) ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No school emails this week
            </p>
          ) : (
            <>
              {/* AI Summary */}
              {data.summary && (
                <div className="bg-white/70 rounded-lg p-3 border border-emerald-100">
                  <ul className="space-y-0.5 list-inside">
                    {renderMarkdown(data.summary)}
                  </ul>
                </div>
              )}

              {/* Per-child accordion */}
              {childNames.length > 0 && (
                <div className="space-y-2">
                  {childNames.map(child => {
                    const cd = data.byChild[child];
                    const isOpen = childOpen[child] !== false; // default open
                    const count = cd.events.length + cd.actions.length;

                    return (
                      <div key={child}>
                        <button
                          onClick={() => toggleChild(child)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            {capitalize(child)}
                            <span className="ml-1.5 text-emerald-500 font-normal normal-case">
                              ({count} item{count !== 1 ? 's' : ''})
                            </span>
                          </h4>
                          {isOpen ? (
                            <ChevronUp className="h-3 w-3 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="mt-1.5 space-y-1.5">
                            {cd.events.slice(0, 4).map((event, i) => (
                              <div key={`e-${i}`} className="flex items-start gap-2 p-2 bg-white/60 rounded-md border border-emerald-100">
                                <Calendar className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-700 leading-snug truncate">
                                    {event.title}
                                  </p>
                                  {event.date && (
                                    <p className="text-xs text-emerald-600">{formatDate(event.date)}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                            {cd.actions.slice(0, 3).map((action, i) => {
                              const isUrgent = action.urgency === 'high';
                              return (
                                <div key={`a-${i}`} className="flex items-start gap-2 p-2 bg-white/60 rounded-md border border-amber-100">
                                  <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isUrgent ? 'text-amber-500' : 'text-slate-400'}`} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-700 leading-snug truncate">
                                      {action.action}
                                    </p>
                                    <p className="text-xs text-amber-600 capitalize">{action.urgency}</p>
                                  </div>
                                </div>
                              );
                            })}
                            {cd.events.length === 0 && cd.actions.length === 0 && (
                              <p className="text-xs text-slate-400">Nothing this week</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No per-child data but have summary */}
              {childNames.length === 0 && data.summary && (
                <p className="text-xs text-slate-500">
                  {totalEvents} events, {totalActions} actions across {data.itemCount} emails
                </p>
              )}

              {/* Footer timestamp */}
              {data.generatedAt && (
                <p className="text-[10px] text-slate-400 text-right pt-1">
                  Updated {formatTimeAgo(data.summaryAge)}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
