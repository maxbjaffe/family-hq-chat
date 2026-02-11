/**
 * Email Insights Analyzer
 *
 * Queries radar_family_feed and aggregates email intelligence:
 * per-child activity, priority items, upcoming deadlines.
 * Pure analysis layer on top of existing Radar data —
 * same pattern as calendar-analyzer.ts.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// --- Output types ---

export interface EmailInsights {
  priorityItems: PriorityItem[];
  childActivity: ChildActivity[];
  upcomingDeadlines: Deadline[];
  weekSummary: string;
  stats: { totalItems: number; actionsPending: number; upcomingEvents: number };
}

export interface PriorityItem {
  title: string;
  itemType: 'event' | 'action' | 'announcement';
  urgency: number;
  children: string[];
  sourceName: string;
  daysUntil: number | null;
}

export interface ChildActivity {
  childName: string;
  totalItems: number;
  categories: { type: string; count: number }[];
  upcomingEvents: { title: string; date: string }[];
  pendingActions: { title: string; deadline: string | null }[];
  topSources: string[];
}

export interface Deadline {
  title: string;
  date: string;
  children: string[];
  daysUntil: number;
}

// --- Raw row shape from radar_family_feed ---

interface FeedRow {
  id: string;
  email_id: string;
  source_type: string | null;
  source_name: string | null;
  item_type: string;
  title: string;
  description: string | null;
  event_date: string | null;
  deadline: string | null;
  expires_at: string;
  scope: string;
  children: string[];
  urgency: number;
  dismissed: boolean;
  created_at: string;
}

// --- Empty fallback ---

export function emptyInsights(): EmailInsights {
  return {
    priorityItems: [],
    childActivity: [],
    upcomingDeadlines: [],
    weekSummary: 'No school email items tracked',
    stats: { totalItems: 0, actionsPending: 0, upcomingEvents: 0 },
  };
}

// --- Main entry point ---

export async function analyzeEmailInsights(
  supabase: SupabaseClient,
  daysBack: number = 14
): Promise<EmailInsights> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    const { data, error } = await supabase
      .from('radar_family_feed')
      .select('*')
      .eq('dismissed', false)
      .gte('created_at', cutoff.toISOString())
      .order('urgency', { ascending: false })
      .order('deadline', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching radar_family_feed:', error);
      return emptyInsights();
    }

    const items = (data as FeedRow[]) || [];
    if (items.length === 0) return emptyInsights();

    const priorityItems = extractPriorityItems(items);
    const childActivity = aggregateByChild(items);
    const upcomingDeadlines = extractUpcomingDeadlines(items);

    const actionsPending = items.filter(i => i.item_type === 'action').length;
    const upcomingEvents = items.filter(i => i.item_type === 'event').length;

    // Find busiest child
    const busiestChild = childActivity.length > 0
      ? childActivity.reduce((a, b) => a.totalItems > b.totalItems ? a : b)
      : null;

    const summaryParts: string[] = [];
    if (actionsPending > 0) summaryParts.push(`${actionsPending} action${actionsPending !== 1 ? 's' : ''} pending`);
    if (upcomingEvents > 0) summaryParts.push(`${upcomingEvents} upcoming event${upcomingEvents !== 1 ? 's' : ''}`);
    if (busiestChild) summaryParts.push(`Busiest: ${busiestChild.childName} (${busiestChild.totalItems} items)`);

    const weekSummary = summaryParts.length > 0
      ? summaryParts.join(', ')
      : 'No school email items tracked';

    return {
      priorityItems,
      childActivity,
      upcomingDeadlines,
      weekSummary,
      stats: { totalItems: items.length, actionsPending, upcomingEvents },
    };
  } catch (error) {
    console.error('Error in analyzeEmailInsights:', error);
    return emptyInsights();
  }
}

// --- Extraction helpers ---

function extractPriorityItems(items: FeedRow[]): PriorityItem[] {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  return items
    .filter(item => {
      if (item.urgency >= 4) return true;
      if (item.deadline) {
        const d = new Date(item.deadline);
        return d >= now && d <= in48h;
      }
      if (item.event_date) {
        const d = new Date(item.event_date);
        return d >= now && d <= in48h;
      }
      return false;
    })
    .slice(0, 5)
    .map(item => ({
      title: item.title,
      itemType: item.item_type as PriorityItem['itemType'],
      urgency: item.urgency,
      children: item.children || [],
      sourceName: item.source_name || 'Unknown',
      daysUntil: getDaysUntil(item.deadline || item.event_date),
    }));
}

function aggregateByChild(items: FeedRow[]): ChildActivity[] {
  const byChild = new Map<string, FeedRow[]>();

  for (const item of items) {
    const children = item.children && item.children.length > 0
      ? item.children
      : ['Family'];

    for (const child of children) {
      const existing = byChild.get(child) || [];
      existing.push(item);
      byChild.set(child, existing);
    }
  }

  // Sort by item count descending
  return Array.from(byChild.entries())
    .map(([childName, childItems]) => {
      // Count by source_type
      const typeCounts = new Map<string, number>();
      for (const item of childItems) {
        const type = item.source_type || 'other';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      }
      const categories = Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Upcoming events
      const now = new Date();
      const upcomingEvents = childItems
        .filter(i => i.item_type === 'event' && i.event_date && new Date(i.event_date) >= now)
        .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
        .slice(0, 3)
        .map(i => ({
          title: i.title,
          date: formatShortDate(new Date(i.event_date!)),
        }));

      // Pending actions
      const pendingActions = childItems
        .filter(i => i.item_type === 'action')
        .slice(0, 3)
        .map(i => ({
          title: i.title,
          deadline: i.deadline ? formatRelativeDate(new Date(i.deadline)) : null,
        }));

      // Top sources (unique)
      const sources = new Set<string>();
      for (const item of childItems) {
        if (item.source_name) sources.add(item.source_name);
      }
      const topSources = Array.from(sources).slice(0, 3);

      return {
        childName,
        totalItems: childItems.length,
        categories,
        upcomingEvents,
        pendingActions,
        topSources,
      };
    })
    .sort((a, b) => b.totalItems - a.totalItems);
}

function extractUpcomingDeadlines(items: FeedRow[]): Deadline[] {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return items
    .filter(item => {
      if (!item.deadline) return false;
      const d = new Date(item.deadline);
      return d >= now && d <= in7days;
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .map(item => ({
      title: item.title,
      date: formatShortDate(new Date(item.deadline!)),
      children: item.children || [],
      daysUntil: getDaysUntil(item.deadline)!,
    }));
}

// --- Date helpers ---

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}

function formatRelativeDate(d: Date): string {
  const days = getDaysUntil(d.toISOString());
  if (days === null) return '';
  if (days <= 0) return 'overdue';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return `in ${days} days`;
  return formatShortDate(d);
}

// --- Prompt formatting ---

export function formatEmailInsightsForPrompt(insights: EmailInsights): string {
  if (insights.stats.totalItems === 0) return '';

  const sections: string[] = [];

  sections.push(`## Email Intelligence`);
  sections.push(`Week summary: ${insights.weekSummary}`);

  if (insights.priorityItems.length > 0) {
    const lines = insights.priorityItems.map(item => {
      const children = item.children.length > 0 ? ` [${item.children.join(', ')}]` : '';
      const timing = item.daysUntil !== null
        ? item.daysUntil <= 0 ? ' (overdue)' : item.daysUntil === 1 ? ' (tomorrow)' : ` (in ${item.daysUntil} days)`
        : '';
      return `• ${item.title}${timing}${children}`;
    });
    sections.push(`**High Priority:**\n${lines.join('\n')}`);
  }

  if (insights.childActivity.length > 0) {
    const lines = insights.childActivity.map(child => {
      const cats = child.categories.map(c => `${c.type}: ${c.count}`).join(', ');
      return `• ${child.childName}: ${child.totalItems} item${child.totalItems !== 1 ? 's' : ''} (${cats})`;
    });
    sections.push(`**By Child:**\n${lines.join('\n')}`);
  }

  return sections.join('\n\n');
}

export function formatEmailInsightsForStandup(insights: EmailInsights): string {
  if (insights.stats.totalItems === 0) return '';

  const lines: string[] = [];

  lines.push(`**📧 EMAIL INTELLIGENCE**`);
  lines.push(`${insights.stats.totalItems} school items tracked: ${insights.stats.actionsPending} action${insights.stats.actionsPending !== 1 ? 's' : ''}, ${insights.stats.upcomingEvents} event${insights.stats.upcomingEvents !== 1 ? 's' : ''}`);

  if (insights.priorityItems.length > 0) {
    lines.push('');
    lines.push('**High Priority:**');
    for (const item of insights.priorityItems) {
      const icon = item.itemType === 'action' ? '✅' : item.itemType === 'event' ? '📅' : '📢';
      const children = item.children.length > 0 ? ` — ${item.children.join(', ')}` : '';
      const timing = item.daysUntil !== null
        ? item.daysUntil <= 0 ? ' (overdue)' : item.daysUntil === 1 ? ' tomorrow' : ` in ${item.daysUntil} days`
        : '';
      lines.push(`${icon} ${item.title}${timing}${children}`);
    }
  }

  if (insights.childActivity.length > 0) {
    lines.push('');
    lines.push('**By Child:**');
    for (const child of insights.childActivity) {
      lines.push(`**${child.childName}** (${child.totalItems} item${child.totalItems !== 1 ? 's' : ''})`);

      if (child.upcomingEvents.length > 0) {
        const eventList = child.upcomingEvents.map(e => `${e.title} ${e.date}`).join('; ');
        lines.push(`  Events: ${eventList}`);
      }

      if (child.pendingActions.length > 0) {
        const actionList = child.pendingActions.map(a => {
          return a.deadline ? `${a.title} (${a.deadline})` : a.title;
        }).join('; ');
        lines.push(`  Actions: ${actionList}`);
      }

      if (child.topSources.length > 0) {
        lines.push(`  From: ${child.topSources.join(', ')}`);
      }
    }
  }

  if (insights.upcomingDeadlines.length > 0) {
    lines.push('');
    lines.push('**Upcoming Deadlines (Next 7 Days):**');
    for (const d of insights.upcomingDeadlines) {
      const children = d.children.length > 0 ? ` [${d.children.join(', ')}]` : '';
      const timing = d.daysUntil <= 0 ? '(overdue)' : d.daysUntil === 1 ? '(tomorrow)' : `(in ${d.daysUntil} days)`;
      lines.push(`• ${d.title} ${timing}${children}`);
    }
  }

  return lines.join('\n');
}
