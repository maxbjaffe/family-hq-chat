// Color mapping for calendar names
// Used across all calendar components for consistent styling

export interface CalendarColors {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

export const CALENDAR_COLORS: Record<string, CalendarColors> = {
  Home: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  Work: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  Alex: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  Kids: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  School: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Sports: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  default: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
  },
};

export function getCalendarColor(calendarName: string | null | undefined): CalendarColors {
  if (!calendarName) return CALENDAR_COLORS.default;
  return CALENDAR_COLORS[calendarName] || CALENDAR_COLORS.default;
}

// Map family members to their relevant calendars
// Used for showing relevant events on profile pages
export const FAMILY_CALENDAR_MAP: Record<string, string[]> = {
  Max: ['Work', 'Home'],
  Alex: ['Alex', 'Home'],
  Riley: ['Kids', 'School', 'Sports', 'Home'],
  Parker: ['Kids', 'School', 'Sports', 'Home'],
  Devin: ['Kids', 'School', 'Home'],
  Jaffe: ['Home'], // The dog sees home calendar too
};

export function getCalendarsForMember(memberName: string): string[] {
  return FAMILY_CALENDAR_MAP[memberName] || ['Home'];
}

// Get unique calendar names from the color config (excluding 'default')
export function getAvailableCalendars(): string[] {
  return Object.keys(CALENDAR_COLORS).filter(name => name !== 'default');
}
