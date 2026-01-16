import * as todoist from '@/lib/todoist';
import { fetchAllFamilyData } from '@/lib/notion';
import { getCachedCalendarEvents, getCachedReminders } from '@/lib/supabase';

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

// Projects that are private to Max only
const MAX_ONLY_PROJECTS = ['Personal'];

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
        // Max sees everything, others don't see Max's personal projects
        const isMax = userContext?.name?.toLowerCase() === 'max';
        if (!isMax) {
          enrichedTasks = enrichedTasks.filter(
            task => !MAX_ONLY_PROJECTS.includes(task.project_name)
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
