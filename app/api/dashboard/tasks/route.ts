import { NextResponse } from 'next/server';
import { getTasks, getProjects, completeTask } from '@/lib/todoist';

const HOUSE_TASKS_PROJECT_NAME = 'House Tasks';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get tasks from Todoist
    const [tasks, projects] = await Promise.all([
      getTasks(),
      getProjects(),
    ]);

    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    let filteredTasks = tasks;

    if (!userId) {
      // For unauthenticated users, show only House Tasks (same as homepage)
      const houseProject = projects.find(
        p => p.name.toLowerCase() === HOUSE_TASKS_PROJECT_NAME.toLowerCase()
      );

      if (houseProject) {
        filteredTasks = tasks.filter(t => t.project_id === houseProject.id);
      } else {
        filteredTasks = [];
      }
    }

    const enrichedTasks = filteredTasks.map(task => ({
      ...task,
      project_name: projectMap.get(task.project_id) || 'Inbox',
    }));

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ tasks: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { action, taskId } = await request.json();

    if (action === 'complete' && taskId) {
      await completeTask(taskId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
