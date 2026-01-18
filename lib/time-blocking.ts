// Time blocking utilities for calculating free time and suggesting scheduling

interface CalendarEvent {
  start_time: string;
  end_time: string | null;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
}

export interface WorkingHours {
  start: number; // hour (0-23)
  end: number; // hour (0-23)
}

const DEFAULT_WORKING_HOURS: WorkingHours = { start: 9, end: 17 };

/**
 * Calculate free time slots within working hours, excluding calendar events
 */
export function calculateFreeSlots(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
  workingHours: WorkingHours = DEFAULT_WORKING_HOURS
): TimeSlot[] {
  const freeSlots: TimeSlot[] = [];

  // Sort events by start time
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Iterate through each day
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate < endDate) {
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Define working hours for this day
    const dayStart = new Date(currentDate);
    dayStart.setHours(workingHours.start, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(workingHours.end, 0, 0, 0);

    // Skip if day is in the past
    const now = new Date();
    if (dayEnd <= now) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Adjust start time if we're in the middle of today
    const effectiveStart = dayStart < now ? now : dayStart;
    // Round up to next 15 minutes
    effectiveStart.setMinutes(Math.ceil(effectiveStart.getMinutes() / 15) * 15, 0, 0);

    // Get events for this day
    const dayEvents = sortedEvents.filter(event => {
      const eventStart = new Date(event.start_time);
      return eventStart >= dayStart && eventStart < dayEnd;
    });

    // Find free slots between events
    let slotStart = effectiveStart;

    for (const event of dayEvents) {
      const eventStart = new Date(event.start_time);
      const eventEnd = event.end_time
        ? new Date(event.end_time)
        : new Date(eventStart.getTime() + 60 * 60 * 1000); // Default 1 hour

      // If there's a gap before this event, it's a free slot
      if (eventStart > slotStart) {
        const duration = Math.floor((eventStart.getTime() - slotStart.getTime()) / (1000 * 60));
        if (duration >= 15) {
          // Minimum 15 minute slot
          freeSlots.push({
            start: new Date(slotStart),
            end: new Date(eventStart),
            duration,
          });
        }
      }

      // Move slot start to after this event
      if (eventEnd > slotStart) {
        slotStart = new Date(eventEnd);
      }
    }

    // Add remaining time until end of day
    if (slotStart < dayEnd) {
      const duration = Math.floor((dayEnd.getTime() - slotStart.getTime()) / (1000 * 60));
      if (duration >= 15) {
        freeSlots.push({
          start: new Date(slotStart),
          end: new Date(dayEnd),
          duration,
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return freeSlots;
}

/**
 * Find the best slot for a task given its estimated duration
 */
export function suggestTimeBlock(
  freeSlots: TimeSlot[],
  estimatedMinutes: number,
  preferences?: {
    preferMorning?: boolean;
    requireBuffer?: number; // minutes before/after
  }
): TimeSlot | null {
  const buffer = preferences?.requireBuffer || 0;
  const totalNeeded = estimatedMinutes + buffer * 2;

  // Filter slots that can fit the duration
  const viableSlots = freeSlots.filter(slot => slot.duration >= totalNeeded);

  if (viableSlots.length === 0) return null;

  // Sort by preference
  if (preferences?.preferMorning) {
    viableSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  const bestSlot = viableSlots[0];

  // Adjust for buffer
  const adjustedStart = new Date(bestSlot.start.getTime() + buffer * 60 * 1000);
  const adjustedEnd = new Date(adjustedStart.getTime() + estimatedMinutes * 60 * 1000);

  return {
    start: adjustedStart,
    end: adjustedEnd,
    duration: estimatedMinutes,
  };
}

/**
 * Format a time slot for display
 */
export function formatTimeSlot(slot: TimeSlot): {
  date: string;
  start: string;
  end: string;
  duration: string;
} {
  return {
    date: slot.start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
    start: slot.start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    end: slot.end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    duration: slot.duration >= 60
      ? `${Math.floor(slot.duration / 60)}h ${slot.duration % 60}m`
      : `${slot.duration}m`,
  };
}

/**
 * Estimate duration for common task types
 */
export function estimateTaskDuration(taskDescription: string): number {
  const lowered = taskDescription.toLowerCase();

  // Quick tasks (15-30 min)
  if (
    lowered.includes('email') ||
    lowered.includes('quick') ||
    lowered.includes('call') ||
    lowered.includes('check')
  ) {
    return 30;
  }

  // Medium tasks (1 hour)
  if (
    lowered.includes('meeting') ||
    lowered.includes('review') ||
    lowered.includes('update')
  ) {
    return 60;
  }

  // Focus work (2 hours)
  if (
    lowered.includes('write') ||
    lowered.includes('create') ||
    lowered.includes('develop') ||
    lowered.includes('design') ||
    lowered.includes('deep work') ||
    lowered.includes('focus')
  ) {
    return 120;
  }

  // Default: 1 hour
  return 60;
}
