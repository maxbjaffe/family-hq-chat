"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

// Fun completion messages
const COMPLETION_MESSAGES = [
  "🌟 You're a superstar!",
  "🎉 Amazing job!",
  "💪 You crushed it!",
  "⭐ Awesome work!",
  "🚀 Ready for liftoff!",
  "🏆 Champion of the day!",
  "✨ You're on fire!",
  "🎯 Nailed it!",
  "🌈 Fantastic work!",
  "💎 You're brilliant!",
];

const ALL_COMPLETE_MESSAGES = [
  "Everyone's Ready! 🎉",
  "Team Complete! 🌟",
  "Perfect Team Work! 💪",
  "All Stars Ready! ⭐",
  "Champions Assemble! 🏆",
  "Ready to Conquer the Day! 🚀",
];

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  display_order: number;
  isCompleted: boolean;
}

interface ChildData {
  id: string;
  name: string;
  age?: number;
  avatar_type: string | null;
  avatar_data: string | null;
  avatar_background: string | null;
  checklist: ChecklistItem[];
  stats: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

// Avatar colors for kids
const AVATAR_COLORS = [
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-green-400 to-green-600",
  "from-orange-400 to-orange-600",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
];

export default function KioskPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [allCompleteMessage, setAllCompleteMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/checklist");
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error("Error loading checklist data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if all children are complete
  const allComplete =
    children.length > 0 &&
    children.every((child) => child.stats.isComplete);

  // Trigger celebration when everyone completes
  useEffect(() => {
    if (allComplete && children.length > 0) {
      // Big celebration!
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      setAllCompleteMessage(
        ALL_COMPLETE_MESSAGES[Math.floor(Math.random() * ALL_COMPLETE_MESSAGES.length)]
      );

      setTimeout(() => setAllCompleteMessage(null), 5000);
    }
  }, [allComplete, children.length]);

  async function toggleItem(childId: string, itemId: string, isCurrentlyCompleted: boolean) {
    // Check if this will complete the child's checklist
    const child = children.find((c) => c.id === childId);
    const willComplete = !isCurrentlyCompleted && child && child.stats.remaining === 1;

    // Optimistic update
    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== childId) return c;
        const newChecklist = c.checklist.map((item) =>
          item.id === itemId ? { ...item, isCompleted: !isCurrentlyCompleted } : item
        );
        const completed = newChecklist.filter((i) => i.isCompleted).length;
        return {
          ...c,
          checklist: newChecklist,
          stats: {
            total: newChecklist.length,
            completed,
            remaining: newChecklist.length - completed,
            isComplete: completed === newChecklist.length,
          },
        };
      })
    );

    // API call
    try {
      await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, itemId, isCompleted: isCurrentlyCompleted }),
      });

      // Celebrate when a child completes their checklist
      if (willComplete) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#fbbf24"],
        });

        const message = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
        setCelebrationMessage(`${child?.name}: ${message}`);
        setTimeout(() => setCelebrationMessage(null), 4000);
      }
    } catch (error) {
      console.error("Error toggling item:", error);
      // Revert on error
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
      {/* Celebration Overlays */}
      {celebrationMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-12 py-8 rounded-3xl shadow-2xl animate-bounce">
            <p className="text-4xl md:text-5xl font-black text-center drop-shadow-lg">
              {celebrationMessage}
            </p>
          </div>
        </div>
      )}

      {allCompleteMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-16 py-12 rounded-3xl shadow-2xl animate-pulse">
            <p className="text-5xl md:text-6xl font-black text-center drop-shadow-lg">
              {allCompleteMessage}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-6xl relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Morning Checklist
              </h1>
              <p className="text-slate-600 mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* All Complete Message */}
          {allComplete && children.length > 0 && (
            <Card className="p-6 bg-gradient-to-r from-green-100 to-blue-100 border-green-300">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-bold text-green-900">
                    Everyone&apos;s Ready!
                  </h3>
                  <p className="text-green-700">
                    All checklists complete. Have a great day!
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-600">No children configured yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {children.map((child, index) => {
              const percentage =
                child.stats.total > 0
                  ? Math.round((child.stats.completed / child.stats.total) * 100)
                  : 0;

              return (
                <Card
                  key={child.id}
                  className={`p-6 ${
                    child.stats.isComplete
                      ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-300"
                      : "bg-white"
                  }`}
                >
                  {/* Child Header */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                        AVATAR_COLORS[index % AVATAR_COLORS.length]
                      } flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
                    >
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">{child.name}</h3>
                      {child.age && (
                        <p className="text-sm text-slate-600">Age {child.age}</p>
                      )}
                    </div>
                    {child.stats.isComplete && child.stats.total > 0 && (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    )}
                  </div>

                  {/* Progress Bar */}
                  {child.stats.total > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 font-medium">Progress</span>
                        <span className="font-bold text-slate-900">
                          {child.stats.completed}/{child.stats.total}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                      {child.stats.isComplete && (
                        <p className="text-green-600 font-semibold text-sm mt-2">
                          ✓ All done! 🎉
                        </p>
                      )}
                    </div>
                  )}

                  {/* Checklist Items */}
                  {child.checklist.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      <p>No checklist items yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {child.checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(child.id, item.id, item.isCompleted)}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer hover:shadow-md ${
                            item.isCompleted
                              ? "bg-green-100 border border-green-300"
                              : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {item.isCompleted ? (
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                              <Circle className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                          {item.icon && (
                            <div className="text-2xl flex-shrink-0">{item.icon}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium text-sm ${
                                item.isCompleted
                                  ? "text-green-900 line-through"
                                  : "text-slate-900"
                              }`}
                            >
                              {item.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
