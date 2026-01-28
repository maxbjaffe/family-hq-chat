/**
 * Calendar Agent
 * 
 * Family calendar queries and schedule.
 * Connected to: cached_calendar_events table
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput } from '../types';
import { getCachedCalendarEvents, CachedCalendarEvent } from '../../supabase';

export class CalendarAgent extends BaseAgent {
  name = 'CalendarAgent';
  description = 'Handles family calendar queries';

  capabilities: AgentCapability[] = [
    {
      name: 'today_schedule',
      description: "Today's schedule",
      triggers: ['today', 'schedule', 'what\'s happening', 'calendar today'],
      examples: ["What's on today?", 'Show today\'s schedule'],
    },
    {
      name: 'tomorrow_schedule', 
      description: 'Tomorrow\'s schedule',
      triggers: ['tomorrow'],
      examples: ["What's tomorrow?", 'Tomorrow\'s events'],
    },
    {
      name: 'week_schedule',
      description: 'This week\'s events',
      triggers: ['this week', 'week', 'upcoming', 'next few days'],
      examples: ['This week\'s events', 'What\'s coming up?'],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();

    if (/tomorrow/i.test(text)) {
      return this.getTomorrowSchedule(context);
    }

    if (/week|upcoming|next few/i.test(text)) {
      return this.getWeekSchedule(context);
    }

    return this.getTodaySchedule(context);
  }

  private async getTodaySchedule(context: AgentContext): Promise<AgentResult> {
    try {
      const events = await getCachedCalendarEvents(1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayEvents = events.filter(e => {
        const eventDate = new Date(e.start_time);
        return eventDate >= today && eventDate < tomorrow;
      });

      return this.formatScheduleResponse(todayEvents, "Today's Schedule", context);
    } catch (error) {
      return this.failure(`Couldn't load today's schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTomorrowSchedule(context: AgentContext): Promise<AgentResult> {
    try {
      const events = await getCachedCalendarEvents(2);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const tomorrowEvents = events.filter(e => {
        const eventDate = new Date(e.start_time);
        return eventDate >= tomorrow && eventDate < dayAfter;
      });

      return this.formatScheduleResponse(tomorrowEvents, "Tomorrow's Schedule", context);
    } catch (error) {
      return this.failure(`Couldn't load tomorrow's schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getWeekSchedule(context: AgentContext): Promise<AgentResult> {
    try {
      const events = await getCachedCalendarEvents(7);
      return this.formatScheduleResponse(events, "This Week's Schedule", context);
    } catch (error) {
      return this.failure(`Couldn't load this week's schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatScheduleResponse(
    events: CachedCalendarEvent[], 
    title: string,
    context: AgentContext
  ): AgentResult {
    if (events.length === 0) {
      const emptyMsg = context.familyMember?.role === 'kid'
        ? `📅 No events scheduled! Free time! 🎉`
        : `📅 ${title}: Nothing scheduled.`;
      
      return this.success(
        { events: [], count: 0 },
        emptyMsg,
        { confidence: 0.9 }
      );
    }

    const lines = [`📅 **${title}**`, ''];
    
    // Group by date
    const byDate = new Map<string, CachedCalendarEvent[]>();
    for (const event of events) {
      const dateKey = new Date(event.start_time).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(event);
    }

    for (const [date, dayEvents] of byDate) {
      if (byDate.size > 1) {
        lines.push(`**${date}**`);
      }
      
      for (const event of dayEvents) {
        const time = this.formatEventTime(event);
        const icon = this.getCalendarIcon(event.calendar_name ?? undefined);
        lines.push(`${icon} ${time} - ${event.title}`);
      }
      
      if (byDate.size > 1) lines.push('');
    }

    const response = context.familyMember?.role === 'kid'
      ? this.makeKidFriendly(lines.join('\n'), events)
      : lines.join('\n');

    return this.success(
      { events, count: events.length },
      response,
      { confidence: 0.95 }
    );
  }

  private formatEventTime(event: CachedCalendarEvent): string {
    // Check if it spans all day (no end time or same start/end date with time 00:00)
    const start = new Date(event.start_time);
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    
    // If event starts at midnight and has no meaningful end, treat as all-day
    if (startHour === 0 && startMin === 0 && !event.end_time) {
      return 'All day';
    }
    
    return start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  private getCalendarIcon(calendarName?: string): string {
    if (!calendarName) return '📅';
    
    const name = calendarName.toLowerCase();
    if (name.includes('school')) return '🏫';
    if (name.includes('activity') || name.includes('activities')) return '⚽';
    if (name.includes('work')) return '💼';
    if (name.includes('family')) return '👨‍👩‍👧‍👦';
    if (name.includes('birthday')) return '🎂';
    if (name.includes('doctor') || name.includes('medical')) return '🏥';
    return '📅';
  }

  private makeKidFriendly(text: string, events: CachedCalendarEvent[]): string {
    // Add fun commentary for kids
    const hasSchool = events.some(e => e.calendar_name?.toLowerCase().includes('school'));
    const hasActivities = events.some(e => 
      e.calendar_name?.toLowerCase().includes('activit') ||
      e.title?.toLowerCase().includes('practice') ||
      e.title?.toLowerCase().includes('lesson')
    );

    let suffix = '';
    if (hasSchool && hasActivities) {
      suffix = '\n\n📚 School day with activities - busy day ahead!';
    } else if (!hasSchool && events.length > 0) {
      suffix = '\n\n🎉 No school today!';
    }

    return text + suffix;
  }
}
