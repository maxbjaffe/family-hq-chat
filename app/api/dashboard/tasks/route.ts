import { NextResponse } from 'next/server';
import { getTasks, getProjects, completeTask } from '@/lib/todoist';
import { getFamilyDataClient } from '@/lib/supabase';

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

    // If no user logged in, filter to "family" visibility only
    // For MVP, return all tasks for authenticated users
    let filteredTasks = tasks;

    if (!userId) {
      // Get family-visible project IDs from content_visibility
      const supabase = getFamilyDataClient();
      const { data: visibleContent } = await supabase
        .from('content_visibility')
        .select('content_id')
        .eq('content_type', 'todoist_project')
        .eq('visibility', 'family');

      const familyProjectIds = new Set(visibleContent?.map(v => v.content_id) || []);

      filteredTasks = tasks.filter(t => familyProjectIds.has(t.project_id));
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
