'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Home, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface HouseTask {
  id: string;
  content: string;
  description: string;
  priority: number;
  due: string | null;
}

export function HouseTasks() {
  const [tasks, setTasks] = useState<HouseTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/house-tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load house tasks:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = async (taskId: string) => {
    setCompleting(taskId);
    try {
      const res = await fetch('/api/house-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (res.ok) {
        // Remove task from list with animation
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
    setCompleting(null);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'border-l-red-500 bg-red-50/50';
      case 3: return 'border-l-orange-500 bg-orange-50/50';
      case 2: return 'border-l-blue-500 bg-blue-50/50';
      default: return 'border-l-slate-300';
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-6 w-6 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">House Tasks</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-6 w-6 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">House Tasks</h3>
        </div>
        <div className="text-center py-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
          <p className="text-emerald-700 font-medium">All caught up!</p>
          <p className="text-sm text-slate-500 mt-1">No house tasks right now</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="flex items-center gap-2 mb-4">
        <Home className="h-6 w-6 text-emerald-600" />
        <h3 className="text-lg font-bold text-slate-800">House Tasks</h3>
        <span className="ml-auto text-sm text-emerald-600 font-medium">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <button
            key={task.id}
            onClick={() => handleComplete(task.id)}
            disabled={completing === task.id}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all
              hover:shadow-md active:scale-[0.98] disabled:opacity-50
              ${getPriorityColor(task.priority)}`}
          >
            <div className="mt-0.5">
              {completing === task.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-slate-400 hover:text-emerald-500 transition-colors" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-800">{task.content}</p>
              {task.due && (
                <p className="text-xs text-slate-500 mt-0.5">{task.due}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Tap a task to mark it done
      </p>
    </Card>
  );
}
