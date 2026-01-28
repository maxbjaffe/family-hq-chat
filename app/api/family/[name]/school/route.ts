import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const childName = decodeURIComponent(name).toLowerCase();
  const supabase = getSupabaseClient();

  const now = new Date();
  const twoWeeksOut = new Date(now);
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get events for this child
  const { data: events } = await supabase
    .from('radar_family_feed')
    .select('*')
    .eq('item_type', 'event')
    .contains('children', [childName])
    .gte('event_date', now.toISOString())
    .lte('event_date', twoWeeksOut.toISOString())
    .eq('dismissed', false)
    .order('event_date', { ascending: true })
    .limit(10);

  // Get action items for this child
  const { data: actions } = await supabase
    .from('radar_family_feed')
    .select('*')
    .eq('item_type', 'action')
    .contains('children', [childName])
    .eq('dismissed', false)
    .order('urgency', { ascending: false })
    .limit(5);

  // Get recent announcements for this child
  const { data: announcements } = await supabase
    .from('radar_family_feed')
    .select('*')
    .eq('item_type', 'announcement')
    .contains('children', [childName])
    .gte('created_at', oneWeekAgo.toISOString())
    .eq('dismissed', false)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get teacher communications
  const { data: teacherEmails } = await supabase
    .from('radar_school_extractions')
    .select('*')
    .eq('source_type', 'teacher')
    .contains('child_relevance', [childName])
    .gte('email_date', oneWeekAgo.toISOString())
    .order('email_date', { ascending: false })
    .limit(5);

  return NextResponse.json({
    child: childName,
    events: events || [],
    actions: actions || [],
    announcements: announcements || [],
    teacherEmails: teacherEmails?.map(e => ({
      id: e.id,
      date: e.email_date,
      from: e.from_name || e.from_address,
      subject: e.subject,
      teacher: e.source_name,
    })) || [],
  });
}
