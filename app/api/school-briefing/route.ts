import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

const CHILDREN = ['riley', 'parker', 'devin'];

/** Case-insensitive check if a children array includes a child name */
function hasChild(children: unknown, childName: string): boolean {
  if (!Array.isArray(children)) return false;
  return children.some(
    (c: unknown) => typeof c === 'string' && c.toLowerCase() === childName
  );
}

/** Check if all 3 kids are in the children array */
function isFamily(children: unknown): boolean {
  return CHILDREN.every(c => hasChild(children, c));
}

export async function GET() {
  const supabase = getSupabaseClient();

  const now = new Date();
  const twoWeeksOut = new Date(now);
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  // Fetch events and actions for all kids in parallel
  const [eventsRes, actionsRes] = await Promise.all([
    supabase
      .from('radar_family_feed')
      .select('id, title, event_date, children, scope, item_type, source_type')
      .eq('item_type', 'event')
      .eq('dismissed', false)
      .gte('event_date', now.toISOString())
      .lte('event_date', twoWeeksOut.toISOString())
      .order('event_date', { ascending: true })
      .limit(30),
    supabase
      .from('radar_family_feed')
      .select('id, title, deadline, urgency, children, item_type, source_type')
      .eq('item_type', 'action')
      .eq('dismissed', false)
      .neq('lifecycle', 'past')
      .neq('lifecycle', 'archived')
      .order('urgency', { ascending: false })
      .limit(20),
  ]);

  const allEvents = eventsRes.data || [];
  // Only include actions that have at least one child associated (skip personal items)
  const allActions = (actionsRes.data || []).filter(
    a => Array.isArray(a.children) && a.children.length > 0
  );

  // Group by child
  const byChild: Record<string, {
    events: Array<{ id: string; title: string; date: string }>;
    actions: Array<{ id: string; title: string; deadline: string | null; urgency: number }>;
  }> = {};

  for (const child of CHILDREN) {
    const childEvents = allEvents
      .filter(e => hasChild(e.children, child))
      .map(e => ({
        id: e.id,
        title: e.title || 'Untitled',
        date: e.event_date || '',
      }));

    const childActions = allActions
      .filter(a => hasChild(a.children, child))
      .map(a => ({
        id: a.id,
        title: a.title || 'Untitled',
        deadline: a.deadline || null,
        urgency: typeof a.urgency === 'number' ? a.urgency : 3,
      }));

    if (childEvents.length > 0 || childActions.length > 0) {
      byChild[child] = { events: childEvents, actions: childActions };
    }
  }

  // Family-wide events (relevant to all 3 kids)
  const familyEvents = allEvents
    .filter(e => isFamily(e.children))
    .map(e => ({
      id: e.id,
      title: e.title || 'Untitled',
      date: e.event_date || '',
    }));

  return NextResponse.json({
    byChild,
    familyEvents,
    generatedAt: now.toISOString(),
  });
}
