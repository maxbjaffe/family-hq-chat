'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ClipboardList, Loader2, CheckCircle2, Circle, ChevronDown, ChevronUp, PartyPopper } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  icon: string;
  sort_order: number;
  is_completed: boolean;
}

interface ChecklistCardProps {
  memberId: string;
}

export function ChecklistCard({ memberId }: ChecklistCardProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    try {
      const res = await fetch('/api/checklist');
      if (res.ok) {
        const data = await res.json();
        // Find this member's data
        const memberData = data.members?.find((m: { id: string }) => m.id === memberId);
        if (memberData?.checklist) {
          setItems(memberData.checklist);
        }
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const handleToggle = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newCompleted = !item.is_completed;
    setToggling(itemId);

    // Optimistic update
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, is_completed: newCompleted } : i
    ));

    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, itemId, isCompleted: newCompleted }),
      });

      if (!res.ok) {
        // Revert on failure
        setItems(prev => prev.map(i =>
          i.id === itemId ? { ...i, is_completed: !newCompleted } : i
        ));
      }
    } catch (error) {
      console.error('Failed to toggle item:', error);
      // Revert on error
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, is_completed: !newCompleted } : i
      ));
    }
    setToggling(null);
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-5 w-5 text-cyan-600" />
          <h3 className="font-semibold text-slate-800">Checklist</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return null; // Don't show card if no checklist items
  }

  const completedCount = items.filter(i => i.is_completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <Card className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 min-h-[48px]"
      >
        <ClipboardList className="h-5 w-5 text-cyan-600" />
        <h3 className="font-semibold text-slate-800">Checklist</h3>
        <span className="ml-auto text-sm text-cyan-600 font-medium">
          {completedCount}/{totalCount}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* Progress bar */}
      <div className="mt-3 mb-2">
        <div className="h-3 bg-white/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              allDone ? 'bg-green-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {allDone && !expanded && (
        <div className="flex items-center justify-center gap-2 py-1 text-green-600">
          <PartyPopper className="h-5 w-5" />
          <span className="font-medium text-sm">All done!</span>
        </div>
      )}

      {/* Preview when collapsed - show first 3 incomplete items */}
      {!expanded && !allDone && (
        <div className="mt-2 space-y-1">
          {items
            .sort((a, b) => a.sort_order - b.sort_order)
            .filter(item => !item.is_completed)
            .slice(0, 3)
            .map(item => (
              <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
                <Circle className="h-3 w-3 text-slate-400" />
                <span className="truncate">{item.icon} {item.title}</span>
              </div>
            ))}
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-2">
          {items
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(item => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(item.id);
                }}
                disabled={toggling === item.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all
                  hover:shadow-md active:scale-[0.98] disabled:opacity-50 min-h-[48px]
                  ${item.is_completed ? 'bg-green-100/50' : 'bg-white/50'}`}
              >
                {toggling === item.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
                ) : item.is_completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-400" />
                )}
                <span className="text-lg">{item.icon}</span>
                <span className={`font-medium ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {item.title}
                </span>
              </button>
            ))}
        </div>
      )}
    </Card>
  );
}
