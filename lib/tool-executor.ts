import * as todoist from '@/lib/todoist';
import { fetchAllFamilyData } from '@/lib/notion';
import {
  getCachedCalendarEvents,
  getCachedReminders,
  getWeeklyPriorities,
  setWeeklyPriorities,
  updateWeeklyPriority,
  getCurrentWeekStart,
  getPreviousWeekStart,
} from '@/lib/supabase';
import {
  calculateFreeSlots,
  suggestTimeBlock,
  formatTimeSlot,
  estimateTaskDuration,
} from '@/lib/time-blocking';

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface UserContext {
  id: string;
  name: string;
  role: string;
}

// Only these projects are visible to non-Max users
const SHARED_PROJECTS = ['House Tasks'];

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userContext: UserContext | null
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'get_tasks': {
        const tasks = await todoist.getTasks();
        const projects = await todoist.getProjects();
        const projectMap = new Map(projects.map(p => [p.id, p.name]));

        let enrichedTasks = tasks.map(task => ({
          ...task,
          project_name: projectMap.get(task.project_id) || 'Inbox',
        }));

        // Filter tasks based on user
        // Max sees everything, others only see shared projects
        const isMax = userContext?.name?.toLowerCase() === 'max';
        if (!isMax) {
          enrichedTasks = enrichedTasks.filter(
            task => SHARED_PROJECTS.includes(task.project_name)
          );
        }

        return { success: true, data: enrichedTasks };
      }

      case 'create_task': {
        const task = await todoist.createTask({
          content: toolInput.content as string,
          description: toolInput.description as string | undefined,
          due_string: toolInput.due_string as string | undefined,
          priority: toolInput.priority as number | undefined,
          project_id: toolInput.project_id as string | undefined,
        });
        return { success: true, data: task };
      }

      case 'update_task': {
        const task = await todoist.updateTask(toolInput.task_id as string, {
          content: toolInput.content as string | undefined,
          due_string: toolInput.due_string as string | undefined,
          priority: toolInput.priority as number | undefined,
        });
        return { success: true, data: task };
      }

      case 'complete_task': {
        await todoist.completeTask(toolInput.task_id as string);
        return { success: true, data: { completed: true, task_id: toolInput.task_id } };
      }

      case 'delete_task': {
        await todoist.deleteTask(toolInput.task_id as string);
        return { success: true, data: { deleted: true, task_id: toolInput.task_id } };
      }

      case 'get_family_info': {
        const familyData = await fetchAllFamilyData();
        return { success: true, data: familyData };
      }

      case 'get_calendar': {
        const days = (toolInput.days as number) || 7;
        const events = await getCachedCalendarEvents(days);
        return { success: true, data: events };
      }

      case 'get_reminders': {
        // Only Alex uses Apple Reminders
        const isAlex = userContext?.name?.toLowerCase() === 'alex';
        if (!isAlex && userContext) {
          return {
            success: true,
            data: [],
            error: 'Reminders are only available for Alex'
          };
        }

        // Use Alex's user ID for reminders lookup
        const reminders = await getCachedReminders('alex');
        return { success: true, data: reminders };
      }

      case 'get_priorities': {
        const weekStart = toolInput.previous_week ? getPreviousWeekStart() : getCurrentWeekStart();
        const priorities = await getWeeklyPriorities(weekStart);
        return {
          success: true,
          data: {
            week_start: weekStart,
            priorities: priorities.map(p => ({ number: p.priority_number, content: p.content })),
          },
        };
      }

      case 'set_priorities': {
        const priorities = toolInput.priorities as string[];
        await setWeeklyPriorities(priorities);
        return {
          success: true,
          data: {
            week_start: getCurrentWeekStart(),
            priorities_set: priorities.length,
          },
        };
      }

      case 'update_priority': {
        await updateWeeklyPriority(
          toolInput.priority_number as number,
          toolInput.content as string
        );
        return {
          success: true,
          data: {
            priority_number: toolInput.priority_number,
            content: toolInput.content,
          },
        };
      }

      case 'get_free_time': {
        const days = (toolInput.days as number) || 7;
        const minDuration = (toolInput.min_duration as number) || 30;

        const events = await getCachedCalendarEvents(days);

        const startDate = new Date();
        const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const freeSlots = calculateFreeSlots(events, startDate, endDate);
        const filteredSlots = freeSlots.filter(s => s.duration >= minDuration);

        // Format slots for display, limit to top 10
        const formattedSlots = filteredSlots.slice(0, 10).map(formatTimeSlot);

        // Calculate total free time
        const totalFreeMinutes = filteredSlots.reduce((sum, s) => sum + s.duration, 0);
        const totalHours = Math.floor(totalFreeMinutes / 60);
        const remainingMinutes = totalFreeMinutes % 60;

        return {
          success: true,
          data: {
            days_analyzed: days,
            min_slot_duration: minDuration,
            slots_found: filteredSlots.length,
            total_free_time: `${totalHours}h ${remainingMinutes}m`,
            slots: formattedSlots,
          },
        };
      }

      case 'suggest_time_block': {
        const taskDescription = toolInput.task_description as string;
        const estimatedMinutes = (toolInput.estimated_minutes as number) || estimateTaskDuration(taskDescription);
        const preferMorning = (toolInput.prefer_morning as boolean) ?? true;

        const events = await getCachedCalendarEvents(7);
        const startDate = new Date();
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const freeSlots = calculateFreeSlots(events, startDate, endDate);
        const suggestion = suggestTimeBlock(freeSlots, estimatedMinutes, { preferMorning });

        if (!suggestion) {
          return {
            success: true,
            data: {
              found: false,
              task: taskDescription,
              estimated_duration: `${estimatedMinutes} minutes`,
              message: 'No suitable time slot found in the next 7 days. Consider breaking the task into smaller chunks or clearing some calendar time.',
            },
          };
        }

        return {
          success: true,
          data: {
            found: true,
            task: taskDescription,
            estimated_duration: `${estimatedMinutes} minutes`,
            suggested_slot: formatTimeSlot(suggestion),
            message: `I found a good time slot for "${taskDescription}". Would you like me to block this time on your calendar?`,
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
