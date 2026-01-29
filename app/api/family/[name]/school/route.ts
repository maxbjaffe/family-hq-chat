import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

// Keywords that indicate parent-only events (case-insensitive)
const PARENT_ONLY_KEYWORDS = [
  'ladies night',
  'parents night out',
  'parents\' night out',
  'parent night out',
  'moms night',
  'dads night',
  'wine',
  'cocktail',
  'happy hour',
  'adult only',
  'adults only',
  '21+',
  'pta meeting',
  'pta board',
  'board meeting',
  'volunteer meeting',
  'parent meeting',
  'parent conference',
];

// Keywords that indicate kid-relevant events
const KID_KEYWORDS = [
  'kids night',
  'kids\' night',
  'children',
  'student',
  'field trip',
  'assembly',
  'concert',
  'recital',
  'game',
  'practice',
  'class',
  'grade',
  'recess',
  'lunch',
  'dismissal',
  'bus',
  'homework',
  'test',
  'quiz',
];

function isParentOnlyItem(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return PARENT_ONLY_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

function isKidRelevantItem(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  // If it has kid keywords, it's relevant
  if (KID_KEYWORDS.some(keyword => lowerTitle.includes(keyword))) return true;
  // If it doesn't have parent-only keywords, default to relevant
  return !isParentOnlyItem(title);
}

// Deduplicate items by normalized title (handles slight variations)
// Senders that are NOT actual teachers (newsletters, subscriptions, etc.)
const NON_TEACHER_SENDERS = [
  'amar chitra',
  'amar chitra katha',
  'ack media',
  'newsletter',
  'noreply',
  'no-reply',
  'donotreply',
  'notifications',
  'updates@',
  'info@',
  'marketing',
];

function isActualTeacher(fromName: string, fromAddress: string): boolean {
  const combined = `${fromName} ${fromAddress}`.toLowerCase();
  return !NON_TEACHER_SENDERS.some(pattern => combined.includes(pattern));
}

function deduplicateItems<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    // Normalize: lowercase, remove punctuation, collapse whitespace
    const normalized = item.title
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[^\w\s']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
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

  // Transform and filter events - only kid-relevant, deduplicated
  const transformedEvents = deduplicateItems(
    (events || [])
      .map(e => ({
        id: e.id || '',
        title: e.title || 'Untitled Event',
        date: e.event_date || '',
        source: e.source || '',
        scope: e.scope || 'individual',
      }))
      .filter(e => isKidRelevantItem(e.title))
  );

  // Transform and filter actions - only kid-relevant, deduplicated
  const transformedActions = deduplicateItems(
    (actions || [])
      .map(a => ({
        id: a.id || '',
        title: a.title || 'Untitled Action',
        deadline: a.deadline || null,
        urgency: typeof a.urgency === 'string' ? a.urgency : 'medium',
        source: a.source || '',
      }))
      .filter(a => isKidRelevantItem(a.title))
  );

  // Transform and filter announcements - only kid-relevant, deduplicated
  const transformedAnnouncements = deduplicateItems(
    (announcements || [])
      .map(a => ({
        id: a.id || '',
        title: a.title || 'Untitled Announcement',
        source: a.source || '',
        created_at: a.created_at || '',
      }))
      .filter(a => isKidRelevantItem(a.title))
  );

  return NextResponse.json({
    child: childName,
    events: transformedEvents,
    actions: transformedActions,
    announcements: transformedAnnouncements,
    teacherEmails: (teacherEmails || [])
      .filter(e => isActualTeacher(e.from_name || '', e.from_address || ''))
      .map(e => ({
        id: e.id || '',
        subject: e.subject || 'No Subject',
        from_name: e.from_name || e.from_address || 'Unknown',
        teacher_name: e.source_name || null,
        created_at: e.email_date || '',
      })),
  });
}
