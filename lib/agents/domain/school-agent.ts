/**
 * School Agent for Family HQ
 * 
 * Handles school-related queries:
 * - Teacher information
 * - School calendar/events
 * - Homework help
 * - School announcements (from Radar)
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput, RadarFeedItem } from '../types';
import { createClient } from '@supabase/supabase-js';

// Get Supabase client
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

export class SchoolAgent extends BaseAgent {
  name = 'SchoolAgent';
  description = 'Handles school-related queries and information';

  capabilities: AgentCapability[] = [
    {
      name: 'teacher_info',
      description: 'Get teacher contact and information',
      triggers: ['teacher', 'teacher\'s', 'contact teacher', 'email teacher'],
      examples: ["Who is Riley's teacher?", 'How do I contact the math teacher?'],
    },
    {
      name: 'school_events',
      description: 'School calendar and events',
      triggers: ['school event', 'school calendar', 'field trip', 'school day'],
      examples: ['Any school events this week?', 'When is the next field trip?'],
    },
    {
      name: 'school_updates',
      description: 'Recent school communications (from Radar)',
      triggers: ['school update', 'school news', 'announcement', 'from school'],
      examples: ['Any updates from school?', 'What did the school send?'],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();

    if (/teacher/i.test(text)) {
      return this.getTeacherInfo(input, context);
    }

    if (/event|calendar|field trip/i.test(text)) {
      return this.getSchoolEvents(context);
    }

    if (/update|news|announcement|send/i.test(text)) {
      return this.getSchoolUpdates(context);
    }

    return this.getSchoolOverview(context);
  }

  private async getTeacherInfo(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const childName = this.extractChildName(input.text);
    
    if (!childName) {
      return this.needsClarification(
        "Which child's teacher would you like to know about? (Riley, Parker, or Devin)",
        { confidence: 0.6 }
      );
    }

    try {
      const supabase = getSupabaseClient();
      
      // Get family member info
      const { data: member } = await supabase
        .from('family_members')
        .select('*')
        .ilike('name', childName)
        .single();

      if (!member) {
        return this.failure(`Could not find information for ${childName}.`);
      }

      // For now, teachers may be stored in a JSON field or related table
      // This is a simplified version
      const teachers = member.teachers || [];
      
      if (teachers.length === 0) {
        return this.success(
          { childName, teachers: [] },
          `No teacher information found for ${childName}. Teacher data will be synced from Notion.`,
          { confidence: 0.7 }
        );
      }

      const teacherList = teachers.map((t: string) => `• ${t}`).join('\n');
      
      return this.success(
        { childName, teachers },
        `**${childName}'s Teachers:**\n${teacherList}`,
        { confidence: 0.9 }
      );
    } catch (error) {
      console.error('Error fetching teacher info:', error);
      return this.failure('Unable to fetch teacher information right now.');
    }
  }

  private async getSchoolEvents(context: AgentContext): Promise<AgentResult> {
    try {
      const supabase = getSupabaseClient();
      const now = new Date();
      const twoWeeksOut = new Date(now);
      twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

      // Query radar_family_feed for school events
      const { data: events, error } = await supabase
        .from('radar_family_feed')
        .select('*')
        .eq('item_type', 'event')
        .in('source_type', ['district', 'pta', 'teacher', 'athletics', 'extracurricular'])
        .gte('event_date', now.toISOString())
        .lte('event_date', twoWeeksOut.toISOString())
        .eq('dismissed', false)
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching school events:', error);
        return this.failure('Unable to fetch school events right now.');
      }

      if (!events || events.length === 0) {
        return this.success(
          { events: [] },
          'No upcoming school events in the next two weeks.',
          { confidence: 0.85 }
        );
      }

      const eventList = events.map(e => {
        const date = new Date(e.event_date);
        const dateStr = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        const children = e.children?.length > 0 ? ` [${e.children.join(', ')}]` : '';
        return `• **${dateStr}**: ${e.title}${children}`;
      }).join('\n');

      return this.success(
        { events: events.map(this.convertToRadarFeedItem) },
        `**Upcoming School Events:**\n${eventList}`,
        { confidence: 0.95 }
      );
    } catch (error) {
      console.error('Error in getSchoolEvents:', error);
      return this.failure('Unable to fetch school events right now.');
    }
  }

  private async getSchoolUpdates(context: AgentContext): Promise<AgentResult> {
    try {
      const supabase = getSupabaseClient();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Query radar_family_feed for recent school communications
      const { data: updates, error } = await supabase
        .from('radar_family_feed')
        .select('*')
        .in('source_type', ['district', 'pta', 'teacher', 'athletics'])
        .gte('created_at', threeDaysAgo.toISOString())
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching school updates:', error);
        return this.failure('Unable to fetch school updates right now.');
      }

      if (!updates || updates.length === 0) {
        return this.success(
          { updates: [] },
          'No new school communications in the past 3 days.',
          { confidence: 0.85 }
        );
      }

      // Group by source
      const bySource: Record<string, typeof updates> = {};
      for (const update of updates) {
        const source = update.source_name || update.source_type;
        if (!bySource[source]) bySource[source] = [];
        bySource[source].push(update);
      }

      const lines: string[] = ['**Recent School Updates:**'];
      for (const [source, items] of Object.entries(bySource)) {
        lines.push(`\n**From ${source}:**`);
        for (const item of items.slice(0, 3)) {
          const type = item.item_type === 'action' ? '⚠️' : 
                      item.item_type === 'event' ? '📅' : '📢';
          const children = item.children?.length > 0 ? ` [${item.children.join(', ')}]` : '';
          lines.push(`${type} ${item.title}${children}`);
        }
      }

      return this.success(
        { updates: updates.map(this.convertToRadarFeedItem) },
        lines.join('\n'),
        { confidence: 0.95 }
      );
    } catch (error) {
      console.error('Error in getSchoolUpdates:', error);
      return this.failure('Unable to fetch school updates right now.');
    }
  }

  private async getSchoolOverview(context: AgentContext): Promise<AgentResult> {
    // Try to get a quick overview combining events and updates
    try {
      const supabase = getSupabaseClient();
      const now = new Date();
      const oneWeekOut = new Date(now);
      oneWeekOut.setDate(oneWeekOut.getDate() + 7);

      // Get action items (things that need attention)
      const { data: actions } = await supabase
        .from('radar_family_feed')
        .select('*')
        .in('source_type', ['district', 'pta', 'teacher', 'athletics'])
        .eq('item_type', 'action')
        .eq('dismissed', false)
        .order('urgency', { ascending: false })
        .limit(5);

      // Get upcoming events
      const { data: events } = await supabase
        .from('radar_family_feed')
        .select('*')
        .eq('item_type', 'event')
        .in('source_type', ['district', 'pta', 'teacher', 'athletics'])
        .gte('event_date', now.toISOString())
        .lte('event_date', oneWeekOut.toISOString())
        .eq('dismissed', false)
        .order('event_date', { ascending: true })
        .limit(5);

      const lines: string[] = [];

      if (actions && actions.length > 0) {
        lines.push('**⚠️ Action Items:**');
        for (const action of actions) {
          const deadline = action.deadline 
            ? ` (due ${new Date(action.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`
            : '';
          lines.push(`• ${action.title}${deadline}`);
        }
        lines.push('');
      }

      if (events && events.length > 0) {
        lines.push('**📅 This Week:**');
        for (const event of events) {
          const date = new Date(event.event_date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
          lines.push(`• ${date}: ${event.title}`);
        }
      }

      if (lines.length === 0) {
        return this.success(
          null,
          "I can help with:\n• Teacher information\n• School events and calendar\n• Recent school updates\n\nWhat would you like to know?",
          { confidence: 0.7 }
        );
      }

      return this.success(
        { actions: actions || [], events: events || [] },
        lines.join('\n'),
        { confidence: 0.9 }
      );
    } catch (error) {
      console.error('Error in getSchoolOverview:', error);
      return this.success(
        null,
        "I can help with:\n• Teacher information\n• School events and calendar\n• Recent school updates\n\nWhat would you like to know?",
        { confidence: 0.7 }
      );
    }
  }

  private extractChildName(text: string): string | null {
    const names = ['riley', 'parker', 'devin'];
    const textLower = text.toLowerCase();
    
    for (const name of names) {
      if (textLower.includes(name)) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    
    // Check for possessive patterns
    const match = text.match(/(\w+)'s\s+teacher/i);
    if (match) {
      const found = match[1].toLowerCase();
      if (names.includes(found)) {
        return found.charAt(0).toUpperCase() + found.slice(1);
      }
    }
    
    return null;
  }

  private convertToRadarFeedItem(item: any): RadarFeedItem {
    return {
      id: item.id,
      emailId: item.email_id,
      sourceType: item.source_type,
      sourceName: item.source_name,
      itemType: item.item_type,
      title: item.title,
      description: item.description,
      eventDate: item.event_date ? new Date(item.event_date) : undefined,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      scope: item.scope,
      children: item.children || [],
      urgency: item.urgency,
      dismissed: item.dismissed,
      createdAt: new Date(item.created_at),
    };
  }
}
