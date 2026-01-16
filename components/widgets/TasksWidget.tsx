'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Square } from 'lucide-react';
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
        <p className="text-sm text-gray-500">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks</p>
      ) : (
        <ul className="space-y-2">
          {tasks.slice(0, 8).map((task) => (
            <li key={task.id} className="flex items-start gap-2">
              <button
                onClick={() => handleComplete(task.id)}
                className={priorityColor(task.priority)}
                aria-label={`Complete task: ${task.content}`}
              >
                <Square className="w-4 h-4" />
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
