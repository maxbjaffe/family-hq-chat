'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Square, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUser } from '@/components/UserProvider';

interface Task {
  id: string;
  content: string;
  due: { date: string; string: string } | null;
  priority: number;
  project_name?: string;
}

export function TasksWidget() {
  const { userId } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);

        const response = await fetch(`/api/dashboard/tasks?${params}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [userId]);

  const handleComplete = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', taskId }),
      });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  const priorityColor = (priority: number) => {
    if (priority === 4) return 'text-red-500';
    if (priority === 3) return 'text-orange-500';
    return 'text-gray-400';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-gray-900">Tasks</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-green-500" />
          <span className="text-sm text-gray-500">Loading tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks</p>
      ) : (
        <ul className="space-y-2">
          {tasks.slice(0, 8).map((task) => (
            <li key={task.id} className={`flex items-start gap-2 transition-opacity ${completingTask === task.id ? 'opacity-50' : ''}`}>
              <button
                onClick={() => handleComplete(task.id)}
                className={`${priorityColor(task.priority)} hover:scale-110 transition-transform disabled:opacity-50`}
                aria-label={`Complete task: ${task.content}`}
                disabled={completingTask === task.id}
              >
                {completingTask === task.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{task.content}</p>
                {task.due && (
                  <p className="text-xs text-gray-500">{task.due.string}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
