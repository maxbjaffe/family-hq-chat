import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

const CHILDREN = ['riley', 'parker', 'devin'];

interface ChildBrief {
  events: Array<{ title: string; date: string }>;
  actions: Array<{ action: string; urgency: string }>;
}

interface CottleBriefResponse {
  summary: string | null;
  summaryAge: number;
  byChild: Record<string, ChildBrief>;
  itemCount: number;
  generatedAt: string;
}

function resolveChildren(raw: string[]): string[] {
  const resolved: string[] = [];
  for (const c of raw) {
    const key = c.toLowerCase();
    // "kids" or "all" maps to all three children
    if (key === 'kids' || key === 'all' || key === 'family') {
      return [...CHILDREN];
    }
    if (CHILDREN.includes(key)) {
      resolved.push(key);
    }
  }
  return resolved;
}

function buildByChild(items: Array<Record<string, unknown>>): Record<string, ChildBrief> {
  const byChild: Record<string, ChildBrief> = {};

  for (const item of items) {
    const rawChildren = (item.children as string[]) || (item.child_relevance as string[]) || [];
    const children = resolveChildren(rawChildren);
    const events = (item.events as Array<{ title: string; date?: string }>) || [];
    const actionItems = (item.action_items as Array<{ action: string; urgency: string }>) || [];

    for (const child of children) {
      if (!byChild[child]) {
        byChild[child] = { events: [], actions: [] };
      }

      for (const e of events) {
        byChild[child].events.push({ title: e.title, date: e.date || '' });
      }
      for (const a of actionItems) {
        byChild[child].actions.push({ action: a.action, urgency: a.urgency });
      }
    }
  }

  return byChild;
}

export async function GET(): Promise<NextResponse<CottleBriefResponse | { error: string }>> {
  const supabase = getSupabaseClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  // Fetch cached summary and live school extractions in parallel
  const [viewRes, extractionsRes] = await Promise.all([
    supabase
      .from('radar_dashboard_views')
      .select('cached_summary, cached_at, summary_cached_at')
      .eq('slug', 'school-brief')
      .single(),
    supabase
      .from('radar_school_extractions')
      .select('id, subject, email_date, child_relevance, events, action_items')
      .gte('email_date', cutoff.toISOString())
      .is('archived_at', null)
      .order('email_date', { ascending: false })
      .limit(20),
  ]);

  const view = viewRes.data;
  const items = (extractionsRes.data || []).map(row => ({
    ...row,
    children: row.child_relevance,
  }));

  const summaryAge = view?.summary_cached_at
    ? Math.round((Date.now() - new Date(view.summary_cached_at).getTime()) / 60000)
    : -1;

  return NextResponse.json({
    summary: view?.cached_summary || null,
    summaryAge,
    byChild: buildByChild(items as Array<Record<string, unknown>>),
    itemCount: items.length,
    generatedAt: view?.cached_at || new Date().toISOString(),
  });
}

export async function POST(): Promise<NextResponse<CottleBriefResponse | { error: string }>> {
  const supabase = getSupabaseClient();

  // Read view config
  const { data: view } = await supabase
    .from('radar_dashboard_views')
    .select('config')
    .eq('slug', 'school-brief')
    .single();

  const config = view?.config || {
    daysBack: 7,
    daysAhead: 14,
    maxItems: 20,
    summaryPrompt: 'Summarize recent school emails for a busy parent. Group by child when possible. Highlight upcoming events, deadlines, and required parent actions. Note any urgent items first.',
  };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (config.daysBack || 7));

  const { data: extractions } = await supabase
    .from('radar_school_extractions')
    .select('id, email_id, subject, from_name, email_date, email_summary, child_relevance, events, action_items, deadlines')
    .gte('email_date', cutoff.toISOString())
    .is('archived_at', null)
    .order('email_date', { ascending: false })
    .limit(config.maxItems || 20);

  const items = extractions || [];

  // Format for Claude
  const itemText = items.map(item => {
    const parts = [`- ${item.subject}`];
    if (item.from_name) parts.push(`  From: ${item.from_name}`);
    if (item.email_summary) parts.push(`  Summary: ${item.email_summary}`);
    if (item.child_relevance?.length) parts.push(`  Children: ${item.child_relevance.join(', ')}`);
    if (item.events?.length) {
      parts.push(`  Events: ${item.events.map((e: { title: string; date?: string }) => `${e.title}${e.date ? ` (${e.date})` : ''}`).join('; ')}`);
    }
    if (item.action_items?.length) {
      parts.push(`  Actions: ${item.action_items.map((a: { action: string; urgency: string }) => `${a.action} [${a.urgency}]`).join('; ')}`);
    }
    if (item.deadlines?.length) {
      parts.push(`  Deadlines: ${item.deadlines.map((d: { description: string; date: string }) => `${d.description} (${d.date})`).join('; ')}`);
    }
    return parts.join('\n');
  }).join('\n\n');

  let summary: string | null = null;

  if (items.length > 0) {
    try {
      const apiKey = process.env.CLAUDE_API_KEY;
      if (!apiKey) throw new Error('CLAUDE_API_KEY not configured');

      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        temperature: 0.3,
        system: 'You are a concise school email intelligence assistant for the Jaffe family (3 daughters: Riley grade 5, Parker grade 3, Devin grade 1 at Cottle Elementary). Summarize extracted school email data into brief, actionable narratives. Focus on upcoming deadlines, required parent actions, and key events. Use bullet points. Keep it under 200 words.',
        messages: [
          {
            role: 'user',
            content: `${config.summaryPrompt || 'Summarize these school emails.'}\n\nHere are ${items.length} recent school email extractions:\n\n${itemText}`,
          },
        ],
      });

      const textBlock = response.content.find(b => b.type === 'text');
      summary = textBlock?.text || null;
    } catch (err) {
      console.error('[cottle-brief] AI summary error:', err);
    }
  }

  // Build cached_data in the same shape as the view executor
  const cachedItems = items.map(row => ({
    id: row.id,
    email_id: row.email_id,
    subject: row.subject,
    from_name: row.from_name,
    email_date: row.email_date,
    category: 'school',
    children: row.child_relevance || [],
    email_summary: row.email_summary,
    events: row.events || [],
    action_items: row.action_items || [],
    deadlines: row.deadlines || [],
  }));

  const now = new Date().toISOString();

  // Write back to cache
  await supabase
    .from('radar_dashboard_views')
    .update({
      cached_data: { items: cachedItems, totalCount: cachedItems.length },
      cached_at: now,
      cached_summary: summary,
      summary_cached_at: now,
    })
    .eq('slug', 'school-brief');

  return NextResponse.json({
    summary,
    summaryAge: 0,
    byChild: buildByChild(cachedItems as Array<Record<string, unknown>>),
    itemCount: cachedItems.length,
    generatedAt: now,
  });
}
