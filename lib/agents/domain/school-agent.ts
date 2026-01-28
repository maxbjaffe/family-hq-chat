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
    // TODO: Integrate with Notion cache for teacher data
    const childName = this.extractChildName(input.text);
    
    if (!childName) {
      return this.needsClarification(
        "Which child's teacher would you like to know about?",
        { confidence: 0.6 }
      );
    }

    // TODO: Fetch from family_members → teachers
    return this.success(
      { childName, teachers: [] },
      `Teacher information for ${childName} coming soon. This will pull from Notion.`,
      { confidence: 0.6 }
    );
  }

  private async getSchoolEvents(context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with radar_family_feed for school events
    return this.success(
      { events: [] },
      'School events feature coming soon. Will show upcoming school calendar items.',
      { confidence: 0.5 }
    );
  }

  private async getSchoolUpdates(context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with radar_family_feed
    return this.success(
      { updates: [] },
      'School updates from Radar coming soon. Will show recent communications.',
      { confidence: 0.5 }
    );
  }

  private async getSchoolOverview(context: AgentContext): Promise<AgentResult> {
    return this.success(
      null,
      "I can help with:\n• Teacher information\n• School events and calendar\n• Recent school updates\n\nWhat would you like to know?",
      { confidence: 0.7 }
    );
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
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
    
    return null;
  }
}
