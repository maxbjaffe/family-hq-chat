'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useUser } from '@/components/UserProvider';
import Link from 'next/link';

interface Task {
  id: string;
  content: string;
  description: string;
  due: { date: string; string: string } | null;
  priority: number;
  project_name?: string;
}

function MaxSpaceContent() {
  const router = useRouter();
  const { userName, logout } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/dashboard/tasks?userId=max');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleComplete = async (taskId: string) => {
    try {
      await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', taskId }),
      });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleExit = () => {
    logout();
    router.push('/dashboard');
  };

  const priorityColor = (priority: number) => {
    if (priority === 4) return 'border-l-red-500 bg-red-50';
    if (priority === 3) return 'border-l-orange-500 bg-orange-50';
    if (priority === 2) return 'border-l-blue-500 bg-blue-50';
    return 'border-l-gray-300';
  };

  const priorityIcon = (priority: number) => {
    if (priority === 4) return 'text-red-500';
    if (priority === 3) return 'text-orange-500';
    if (priority === 2) return 'text-blue-500';
    return 'text-gray-400';
  };

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const project = task.project_name || 'Inbox';
    if (!acc[project]) acc[project] = [];
    acc[project].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {userName}'s Space
              </h1>
              <p className="text-slate-600">Your personal command center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-h-[44px]"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{tasks.length}</div>
            <div className="text-sm text-slate-600">Total Tasks</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-red-500">
              {tasks.filter(t => t.priority === 4).length}
            </div>
            <div className="text-sm text-slate-600">High Priority</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">
              {tasks.filter(t => t.due?.date === new Date().toISOString().split('T')[0]).length}
            </div>
            <div className="text-sm text-slate-600">Due Today</div>
          </Card>
        </div>

        {/* Tasks by Project */}
        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-slate-600">Loading tasks...</p>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-lg font-medium text-slate-800">All clear!</p>
            <p className="text-slate-600">No tasks right now</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByProject).map(([project, projectTasks]) => (
              <div key={project}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {project}
                  <span className="text-sm font-normal text-slate-500">
                    ({projectTasks.length})
                  </span>
                </h2>
                <div className="space-y-2">
                  {projectTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`p-4 border-l-4 ${priorityColor(task.priority)} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleComplete(task.id)}
                          className={`mt-0.5 ${priorityIcon(task.priority)} hover:scale-110 transition-transform`}
                          aria-label={`Complete task: ${task.content}`}
                        >
                          <Square className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">{task.content}</p>
                          {task.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.due && (
                            <p className="text-xs text-slate-500 mt-2">
                              {task.due.string}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaxSpacePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'adult']}>
      <MaxSpaceContent />
    </ProtectedRoute>
  );
}
