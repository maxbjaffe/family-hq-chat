import { NextRequest, NextResponse } from 'next/server';
import { getTasks, getProjects, completeTask } from '@/lib/todoist';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const kidName = decodeURIComponent(name);

  try {
    const [tasks, projects] = await Promise.all([
      getTasks(),
      getProjects(),
    ]);

    // Find project matching kid's name (case-insensitive)
    const kidProject = projects.find(
      p => p.name.toLowerCase() === kidName.toLowerCase()
    );

    if (!kidProject) {
      return NextResponse.json({ tasks: [], projectId: null });
    }

    // Filter tasks to only this kid's project
    const kidTasks = tasks
      .filter(t => t.project_id === kidProject.id)
      .map(t => ({
        id: t.id,
        content: t.content,
        description: t.description,
        priority: t.priority,
        due: t.due?.string || null,
      }));

    return NextResponse.json({
      tasks: kidTasks,
      projectId: kidProject.id,
    });
  } catch (error) {
    console.error('Kid tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
