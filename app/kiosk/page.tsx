"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles, RefreshCw, X } from "lucide-react";
import confetti from "canvas-confetti";

// Celebration video URL
const CELEBRATION_VIDEO_URL =
  "https://xjeemfudbujwqrnkuwvb.supabase.co/storage/v1/object/public/family-media/00879c1b-a586-4d52-96be-8f4b7ddf7257/celebrations/Mascot_Animation_For_Task_Completion.mp4";

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

// Avatar colors for kids (fallback)
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
  const [showVideo, setShowVideo] = useState(false);
  const [hasShownVideo, setHasShownVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    children.every((child) => child.stats.isComplete && child.stats.total > 0);

  // Trigger celebration video when everyone completes
  useEffect(() => {
    if (allComplete && children.length > 0 && !hasShownVideo) {
      // Show celebration video
      setShowVideo(true);
      setHasShownVideo(true);

      // Also fire confetti
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
    }
  }, [allComplete, children.length, hasShownVideo]);

  // Auto-play video when shown
  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [showVideo]);

  // Close video when it ends
  const handleVideoEnd = () => {
    setShowVideo(false);
  };

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
      {/* Celebration Video Overlay */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]">
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>
          <video
            ref={videoRef}
            src={CELEBRATION_VIDEO_URL}
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
            onEnded={handleVideoEnd}
            playsInline
            autoPlay
            muted={false}
            onCanPlay={(e) => {
              const video = e.currentTarget;
              video.muted = true;
              video.play().then(() => {
                video.muted = false;
              }).catch(() => {
                // If unmuting fails, keep playing muted
              });
            }}
          />
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white text-3xl font-bold animate-pulse">
              {ALL_COMPLETE_MESSAGES[Math.floor(Math.random() * ALL_COMPLETE_MESSAGES.length)]}
            </p>
          </div>
        </div>
      )}

      {/* Celebration Message Overlay */}
      {celebrationMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-12 py-8 rounded-3xl shadow-2xl animate-bounce">
            <p className="text-4xl md:text-5xl font-black text-center drop-shadow-lg">
              {celebrationMessage}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-6xl relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <img
                src="/Images/JaffeFamilyHubLogo.PNG"
                alt="Jaffe Family Hub"
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg"
              />
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
            </div>
            <div className="flex gap-2">
              {allComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowVideo(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Play Celebration
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
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

        {/* Children Grid - Horizontal layout with large avatars */}
        {children.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-600">No children configured yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {children.map((child, index) => {
              const percentage =
                child.stats.total > 0
                  ? Math.round((child.stats.completed / child.stats.total) * 100)
                  : 0;

              return (
                <Card
                  key={child.id}
                  className={`p-4 md:p-6 ${
                    child.stats.isComplete
                      ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-300"
                      : "bg-white"
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* Large Avatar Section */}
                    <div className="flex flex-col items-center md:items-start flex-shrink-0">
                      {/* Avatar - Large display */}
                      {child.avatar_type === "custom" && child.avatar_data ? (
                        <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                          <img
                            src={child.avatar_data}
                            alt={child.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-2xl bg-gradient-to-br ${
                            AVATAR_COLORS[index % AVATAR_COLORS.length]
                          } flex items-center justify-center text-white text-5xl md:text-6xl lg:text-7xl font-bold shadow-xl`}
                        >
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Name and completion badge below avatar */}
                      <div className="mt-3 text-center md:text-left">
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{child.name}</h3>
                        {child.stats.isComplete && child.stats.total > 0 && (
                          <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <span className="text-green-600 font-bold">All done!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checklist Section */}
                    <div className="flex-1 min-w-0">
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
                        </div>
                      )}

                      {/* Checklist Items */}
                      {child.checklist.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-sm">
                          <p>No checklist items yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                                  className={`font-medium ${
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
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
