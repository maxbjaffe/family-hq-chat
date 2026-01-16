import { NextResponse } from 'next/server';
import { getTasks, getProjects, completeTask } from '@/lib/todoist';

const HOUSE_TASKS_PROJECT_NAME = 'House Tasks';

export async function GET() {
  try {
    const [tasks, projects] = await Promise.all([
      getTasks(),
      getProjects(),
    ]);

    // Find the House Tasks project
    const houseProject = projects.find(
      p => p.name.toLowerCase() === HOUSE_TASKS_PROJECT_NAME.toLowerCase()
    );

    if (!houseProject) {
      return NextResponse.json({ tasks: [], projectId: null });
    }

    // Filter tasks to only House Tasks project
    const houseTasks = tasks
      .filter(t => t.project_id === houseProject.id)
      .map(t => ({
        id: t.id,
        content: t.content,
        description: t.description,
        priority: t.priority,
        due: t.due?.string || null,
      }));

    return NextResponse.json({
      tasks: houseTasks,
      projectId: houseProject.id,
    });
  } catch (error) {
    console.error('House tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    await completeTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}
