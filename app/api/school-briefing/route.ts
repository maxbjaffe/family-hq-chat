import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

const CHILDREN = ['riley', 'parker', 'devin'];

export async function GET() {
  const supabase = getSupabaseClient();

  const now = new Date();
  const twoWeeksOut = new Date(now);
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  // Fetch events and actions for all kids in parallel
  const [eventsRes, actionsRes] = await Promise.all([
    supabase
      .from('radar_family_feed')
      .select('id, title, event_date, children, source, scope, item_type')
      .eq('item_type', 'event')
      .eq('dismissed', false)
      .gte('event_date', now.toISOString())
      .lte('event_date', twoWeeksOut.toISOString())
      .order('event_date', { ascending: true })
      .limit(30),
    supabase
      .from('radar_family_feed')
      .select('id, title, deadline, urgency, children, source, item_type')
      .eq('item_type', 'action')
      .eq('dismissed', false)
      .neq('lifecycle', 'past')
      .neq('lifecycle', 'archived')
      .order('urgency', { ascending: false })
      .limit(20),
  ]);

  const allEvents = eventsRes.data || [];
  const allActions = actionsRes.data || [];

  // Group by child
  const byChild: Record<string, {
    events: Array<{ id: string; title: string; date: string; source: string }>;
    actions: Array<{ id: string; title: string; deadline: string | null; urgency: number }>;
  }> = {};

  for (const child of CHILDREN) {
    const childEvents = allEvents
      .filter(e => (e.children as string[] || []).includes(child))
      .map(e => ({
        id: e.id,
        title: e.title || 'Untitled',
        date: e.event_date || '',
        source: e.source || '',
      }));

    const childActions = allActions
      .filter(a => (a.children as string[] || []).includes(child))
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
    .filter(e => {
      const children = (e.children as string[]) || [];
      return CHILDREN.every(c => children.includes(c));
    })
    .map(e => ({
      id: e.id,
      title: e.title || 'Untitled',
      date: e.event_date || '',
      source: e.source || '',
    }));

  return NextResponse.json({
    byChild,
    familyEvents,
    generatedAt: now.toISOString(),
  });
}
