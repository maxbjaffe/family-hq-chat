'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Loader2, ListTodo } from 'lucide-react';

interface KidTask {
  id: string;
  content: string;
  description: string;
  priority: number;
  due: string | null;
}

interface KidTodosCardProps {
  childName: string;
}

export function KidTodosCard({ childName }: KidTodosCardProps) {
  const [tasks, setTasks] = useState<KidTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/kid-tasks/${encodeURIComponent(childName)}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load kid tasks:', error);
    }
    setLoading(false);
  }, [childName]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = async (taskId: string) => {
    setCompleting(taskId);
    try {
      const res = await fetch(`/api/kid-tasks/${encodeURIComponent(childName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (res.ok) {
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
      default: return 'border-l-slate-300 bg-white/50';
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold text-slate-800">My To-Dos</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
        <div className="flex items-center gap-2 mb-3">
          <ListTodo className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold text-slate-800">My To-Dos</h3>
        </div>
        <div className="text-center py-4">
          <CheckCircle2 className="h-10 w-10 text-violet-500 mx-auto mb-2" />
          <p className="text-violet-700 font-medium">All done!</p>
          <p className="text-sm text-slate-500 mt-1">No tasks right now</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
      <div className="flex items-center gap-2 mb-3">
        <ListTodo className="h-5 w-5 text-violet-600" />
        <h3 className="font-semibold text-slate-800">My To-Dos</h3>
        <span className="ml-auto text-sm text-violet-600 font-medium">
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
              hover:shadow-md active:scale-[0.98] disabled:opacity-50 min-h-[48px]
              ${getPriorityColor(task.priority)}`}
          >
            <div className="mt-0.5">
              {completing === task.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              ) : (
                <Circle className="h-5 w-5 text-slate-400 hover:text-violet-500 transition-colors" />
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

      <p className="text-xs text-slate-400 mt-3 text-center">
        Tap a task to mark it done
      </p>
    </Card>
  );
}
