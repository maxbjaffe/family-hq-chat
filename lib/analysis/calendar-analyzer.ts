/**
 * Calendar Analysis Engine
 *
 * Pure-function module for multi-day calendar analysis:
 * conflict detection, per-person load, stress prediction,
 * free blocks, family time gaps, and weekly summaries.
 */

// Accepts the raw shape from cached_calendar_events table
export interface CalendarEventInput {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location?: string | null;
}

// --- Output types ---

export interface CalendarAnalysis {
  dailyBreakdown: DayAnalysis[];
  conflicts: ConflictWarning[];
  freeBlocks: TimeBlock[];
  familyTime: TimeBlock[];
  stressIndicators: string[];
  weekSummary: string;
}

export interface DayAnalysis {
  date: string; // ISO date (YYYY-MM-DD)
  dayName: string;
  eventCount: number;
  personLoad: Record<string, number>;
  busyLevel: 'light' | 'moderate' | 'heavy';
  tightTransitions: TransitionWarning[];
}

export interface ConflictWarning {
  date: string;
  events: [string, string];
  type: 'overlap' | 'tight_transition';
}

export interface TransitionWarning {
  from: string;
  to: string;
  gapMinutes: number;
}

export interface TimeBlock {
  date: string;
  start: string; // HH:MM
  end: string;   // HH:MM
  durationHours: number;
}

// --- Config ---

const CALENDAR_PERSON_MAP: Record<string, string> = {
  'Home': 'Family',
  'Max': 'Max',
  'Alex': 'Alex',
  'Riley': 'Riley',
  'Parker': 'Parker',
  'Devin': 'Devin',
};

const TIGHT_TRANSITION_MINUTES = 30;
const FREE_BLOCK_MIN_HOURS = 2;
const STRESS_EVENT_THRESHOLD = 3;

// --- Helpers ---

function toISODate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
}

function toDayName(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
}

function toTimeString(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  });
}

function toDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`;
}

function getPersonForCalendar(calendarName: string | null): string {
  if (!calendarName) return 'Family';
  return CALENDAR_PERSON_MAP[calendarName] ?? 'Family';
}

function getBusyLevel(eventCount: number): 'light' | 'moderate' | 'heavy' {
  if (eventCount <= 2) return 'light';
  if (eventCount <= 4) return 'moderate';
  return 'heavy';
}

function groupEventsByDate(events: CalendarEventInput[]): Map<string, CalendarEventInput[]> {
  const groups = new Map<string, CalendarEventInput[]>();
  for (const event of events) {
    const date = toISODate(new Date(event.start_time));
    const existing = groups.get(date) || [];
    existing.push(event);
    groups.set(date, existing);
  }
  return groups;
}

// --- Core functions ---

function detectConflicts(dayEvents: CalendarEventInput[], date: string): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const currentEnd = current.end_time
      ? new Date(current.end_time)
      : new Date(new Date(current.start_time).getTime() + 60 * 60 * 1000); // default 1hr
    const nextStart = new Date(next.start_time);

    const gapMs = nextStart.getTime() - currentEnd.getTime();
    const gapMinutes = gapMs / (1000 * 60);

    if (gapMinutes < 0) {
      warnings.push({
        date,
        events: [current.title, next.title],
        type: 'overlap',
      });
    } else if (gapMinutes < TIGHT_TRANSITION_MINUTES) {
      warnings.push({
        date,
        events: [current.title, next.title],
        type: 'tight_transition',
      });
    }
  }

  return warnings;
}

function calculatePersonLoad(events: CalendarEventInput[]): Record<string, number> {
  const load: Record<string, number> = {};
  for (const event of events) {
    const person = getPersonForCalendar(event.calendar_name);
    load[person] = (load[person] || 0) + 1;
  }
  return load;
}

function getTightTransitions(dayEvents: CalendarEventInput[]): TransitionWarning[] {
  const warnings: TransitionWarning[] = [];
  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const currentEnd = current.end_time
      ? new Date(current.end_time)
      : new Date(new Date(current.start_time).getTime() + 60 * 60 * 1000);
    const nextStart = new Date(next.start_time);

    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);

    if (gapMinutes >= 0 && gapMinutes < TIGHT_TRANSITION_MINUTES) {
      warnings.push({
        from: current.title,
        to: next.title,
        gapMinutes: Math.round(gapMinutes),
      });
    }
  }

  return warnings;
}

function findFreeBlocks(
  dayEvents: CalendarEventInput[],
  date: string,
  minHours: number = FREE_BLOCK_MIN_HOURS
): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const windowStart = 9; // 9am
  const windowEnd = 21;  // 9pm

  if (dayEvents.length === 0) {
    const duration = windowEnd - windowStart;
    if (duration >= minHours) {
      blocks.push({
        date,
        start: '09:00',
        end: '21:00',
        durationHours: duration,
      });
    }
    return blocks;
  }

  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  let currentHour = windowStart;

  for (const event of sorted) {
    const start = new Date(event.start_time);
    const end = event.end_time
      ? new Date(event.end_time)
      : new Date(start.getTime() + 60 * 60 * 1000);

    const eventStartHour = start.getHours() + start.getMinutes() / 60;
    const eventEndHour = end.getHours() + end.getMinutes() / 60;

    // Gap before this event
    const gapStart = Math.max(currentHour, windowStart);
    const gapEnd = Math.min(eventStartHour, windowEnd);
    const gapHours = gapEnd - gapStart;

    if (gapHours >= minHours) {
      blocks.push({
        date,
        start: formatDecimalHour(gapStart),
        end: formatDecimalHour(gapEnd),
        durationHours: Math.round(gapHours * 10) / 10,
      });
    }

    currentHour = Math.max(currentHour, eventEndHour);
  }

  // Gap after last event
  if (currentHour < windowEnd) {
    const gapHours = windowEnd - currentHour;
    if (gapHours >= minHours) {
      blocks.push({
        date,
        start: formatDecimalHour(currentHour),
        end: '21:00',
        durationHours: Math.round(gapHours * 10) / 10,
      });
    }
  }

  return blocks;
}

function findFamilyTime(
  eventsByDate: Map<string, CalendarEventInput[]>,
  allDates: string[]
): TimeBlock[] {
  const blocks: TimeBlock[] = [];

  for (const date of allDates) {
    const d = new Date(date + 'T12:00:00');
    const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayEvents = eventsByDate.get(date) || [];

    // Check evening (6-9pm) on any day
    const eveningEvents = dayEvents.filter((e) => {
      const start = new Date(e.start_time);
      const startHour = start.getHours();
      return startHour >= 18 && startHour < 21;
    });

    if (eveningEvents.length === 0) {
      blocks.push({
        date,
        start: '18:00',
        end: '21:00',
        durationHours: 3,
      });
    }

    // Weekends: check full day (9am-6pm block if < 2 events)
    if (isWeekend && dayEvents.length <= 1) {
      blocks.push({
        date,
        start: '09:00',
        end: '18:00',
        durationHours: 9,
      });
    }
  }

  return blocks;
}

function assessStress(dailyBreakdown: DayAnalysis[]): string[] {
  const indicators: string[] = [];

  for (const day of dailyBreakdown) {
    // Flag anyone with 3+ events in a day
    for (const [person, count] of Object.entries(day.personLoad)) {
      if (count >= STRESS_EVENT_THRESHOLD && person !== 'Family') {
        indicators.push(`${person} has ${count} events ${day.dayName}`);
      }
    }

    // Flag heavy days
    if (day.busyLevel === 'heavy') {
      indicators.push(`${day.dayName} is packed (${day.eventCount} events)`);
    }
  }

  return indicators;
}

function buildWeekSummary(dailyBreakdown: DayAnalysis[]): string {
  if (dailyBreakdown.length === 0) return 'No events this week';

  const levels: Record<string, string[]> = { light: [], moderate: [], heavy: [] };
  for (const day of dailyBreakdown) {
    const shortName = day.dayName.slice(0, 3);
    levels[day.busyLevel].push(shortName);
  }

  const parts: string[] = [];
  if (levels.heavy.length > 0) parts.push(`Busy ${levels.heavy.join('/')}`);
  if (levels.moderate.length > 0) parts.push(`moderate ${levels.moderate.join('/')}`);
  if (levels.light.length > 0) parts.push(`light ${levels.light.join('/')}`);

  return parts.join(', ');
}

function formatDecimalHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// --- Main entry point ---

export function analyzeWeek(events: CalendarEventInput[]): CalendarAnalysis {
  const eventsByDate = groupEventsByDate(events);

  // Get all dates for the analysis window (from events + fill gaps)
  const allDates = Array.from(eventsByDate.keys()).sort();

  // Build daily breakdown
  const dailyBreakdown: DayAnalysis[] = allDates.map((date) => {
    const dayEvents = eventsByDate.get(date) || [];
    const personLoad = calculatePersonLoad(dayEvents);
    return {
      date,
      dayName: toDayName(new Date(date + 'T12:00:00')),
      eventCount: dayEvents.length,
      personLoad,
      busyLevel: getBusyLevel(dayEvents.length),
      tightTransitions: getTightTransitions(dayEvents),
    };
  });

  // Detect conflicts across all days
  const conflicts: ConflictWarning[] = [];
  for (const [date, dayEvents] of eventsByDate) {
    conflicts.push(...detectConflicts(dayEvents, date));
  }

  // Find free blocks across all days
  const freeBlocks: TimeBlock[] = [];
  for (const [date, dayEvents] of eventsByDate) {
    freeBlocks.push(...findFreeBlocks(dayEvents, date));
  }

  // Find family time
  const familyTime = findFamilyTime(eventsByDate, allDates);

  // Assess stress
  const stressIndicators = assessStress(dailyBreakdown);

  // Build summary
  const weekSummary = buildWeekSummary(dailyBreakdown);

  return {
    dailyBreakdown,
    conflicts,
    freeBlocks,
    familyTime,
    stressIndicators,
    weekSummary,
  };
}

// --- Prompt formatting ---

export function formatAnalysisForPrompt(analysis: CalendarAnalysis): string {
  const sections: string[] = [];

  // Week summary
  sections.push(`Week overview: ${analysis.weekSummary}`);

  // Daily breakdown
  if (analysis.dailyBreakdown.length > 0) {
    const days = analysis.dailyBreakdown.map((day) => {
      const loadParts = Object.entries(day.personLoad)
        .map(([person, count]) => `${person}: ${count}`)
        .join(', ');
      const loadStr = loadParts ? ` — ${loadParts}` : '';
      const stressMarker = day.busyLevel === 'heavy' ? ' ⚠️' : '';
      return `• ${day.dayName.slice(0, 3)}: ${day.eventCount} event${day.eventCount !== 1 ? 's' : ''} (${day.busyLevel})${loadStr}${stressMarker}`;
    });
    sections.push(days.join('\n'));
  }

  // Conflicts
  if (analysis.conflicts.length > 0) {
    const conflictLines = analysis.conflicts.map((c) => {
      const type = c.type === 'overlap' ? 'overlaps with' : 'tight transition to';
      return `⚠️ ${c.date}: ${c.events[0]} ${type} ${c.events[1]}`;
    });
    sections.push('Conflicts:\n' + conflictLines.join('\n'));
  }

  // Stress indicators
  if (analysis.stressIndicators.length > 0) {
    sections.push('Watch out for:\n' + analysis.stressIndicators.map((s) => `• ${s}`).join('\n'));
  }

  // Family time highlights
  const weekendFamilyTime = analysis.familyTime.filter((b) => {
    const d = new Date(b.date + 'T12:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  });
  if (weekendFamilyTime.length > 0) {
    const dayNames = [...new Set(weekendFamilyTime.map((b) => {
      return new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'America/New_York',
      });
    }))];
    sections.push(`Family time available: ${dayNames.join(', ')}`);
  }

  return sections.join('\n\n');
}

/**
 * Format analysis for the morning standup "THIS WEEK" section.
 * Richer format with emoji sections, only shows sections with content.
 */
export function formatAnalysisForStandup(analysis: CalendarAnalysis): string {
  const lines: string[] = [];

  // Daily breakdown
  lines.push('**📅 THIS WEEK**');
  for (const day of analysis.dailyBreakdown) {
    const loadParts = Object.entries(day.personLoad)
      .map(([person, count]) => `${person}: ${count}`)
      .join(', ');
    const loadStr = loadParts ? ` — ${loadParts}` : '';

    // Stress callouts inline
    const stressCallouts: string[] = [];
    for (const [person, count] of Object.entries(day.personLoad)) {
      if (count >= STRESS_EVENT_THRESHOLD && person !== 'Family') {
        stressCallouts.push(`⚠️ ${person} has ${count} events`);
      }
    }
    const stressStr = stressCallouts.length > 0 ? ` ${stressCallouts.join(', ')}` : '';

    if (day.eventCount === 0) {
      lines.push(`• ${day.dayName.slice(0, 3)}: 0 events — family time opportunity!`);
    } else {
      lines.push(`• ${day.dayName.slice(0, 3)}: ${day.eventCount} event${day.eventCount !== 1 ? 's' : ''} (${day.busyLevel})${loadStr}${stressStr}`);
    }
  }

  // Conflicts section
  if (analysis.conflicts.length > 0) {
    lines.push('');
    lines.push('**⚠️ CONFLICTS**');
    for (const c of analysis.conflicts) {
      const dayName = new Date(c.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'America/New_York',
      });
      const type = c.type === 'overlap' ? 'overlaps with' : 'tight transition to';
      lines.push(`• ${dayName}: ${c.events[0]} ${type} ${c.events[1]}`);
    }
  }

  // Family time section
  const evenings = analysis.familyTime.filter((b) => b.start === '18:00');
  const weekendDays = analysis.familyTime.filter((b) => b.durationHours > 3);
  if (evenings.length > 0 || weekendDays.length > 0) {
    lines.push('');
    lines.push('**🟢 FAMILY TIME**');
    for (const block of evenings) {
      const dayName = new Date(block.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'America/New_York',
      });
      lines.push(`• ${dayName} evening (${toDisplayTime(block.start)}-${toDisplayTime(block.end)})`);
    }
    for (const block of weekendDays) {
      const dayName = new Date(block.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'America/New_York',
      });
      lines.push(`• ${dayName} (open day)`);
    }
  }

  return lines.join('\n');
}
