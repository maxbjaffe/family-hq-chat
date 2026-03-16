"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles, RefreshCw, X, Loader2, Battery, Apple } from "lucide-react";
import confetti from "canvas-confetti";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SyncIndicator, startSync, endSync } from "@/components/SyncIndicator";
import { Clock, HeaderClock } from "@/components/Clock";
import { Avatar } from "@/components/Avatar";
import { RechargeMenu } from "@/components/recharge";
import { NutritionMenu } from "@/components/nutrition";
import { useKiosk } from "@/components/KioskProvider";

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

interface MemberData {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  checklist: ChecklistItem[];
  stats: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

export default function KioskPage() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [hasShownVideo, setHasShownVideo] = useState(false);
  const [togglingItems, setTogglingItems] = useState<Set<string>>(new Set());
  const [showRecharge, setShowRecharge] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadData = useCallback(async () => {
    startSync();
    try {
      const response = await fetch("/api/checklist");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        endSync(true);
      } else {
        endSync(false);
      }
    } catch (error) {
      console.error("Error loading checklist data:", error);
      endSync(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if all members are complete
  const allComplete =
    members.length > 0 &&
    members.every((member) => member.stats.isComplete && member.stats.total > 0);

  // Trigger celebration video when everyone completes
  useEffect(() => {
    if (allComplete && members.length > 0 && !hasShownVideo) {
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
  }, [allComplete, members.length, hasShownVideo]);

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

  async function toggleItem(memberId: string, itemId: string, isCurrentlyCompleted: boolean) {
    const itemKey = `${memberId}-${itemId}`;
    setTogglingItems((prev) => new Set(prev).add(itemKey));
    startSync();

    // Check if this will complete the member's checklist
    const member = members.find((m) => m.id === memberId);
    const willComplete = !isCurrentlyCompleted && member && member.stats.remaining === 1;

    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const newChecklist = m.checklist.map((item) =>
          item.id === itemId ? { ...item, isCompleted: !isCurrentlyCompleted } : item
        );
        const completed = newChecklist.filter((i) => i.isCompleted).length;
        return {
          ...m,
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
      const response = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, itemId, isCompleted: isCurrentlyCompleted }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Checklist API error:", response.status, errorData);
        throw new Error(`API error: ${response.status}`);
      }

      endSync(true);

      // Celebrate when a member completes their checklist
      if (willComplete) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#fbbf24"],
        });

        const message = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
        setCelebrationMessage(`${member?.name}: ${message}`);
        setTimeout(() => setCelebrationMessage(null), 4000);
      }
    } catch (error) {
      console.error("Error toggling item:", error);
      endSync(false);
      // Revert on error
      loadData();
    } finally {
      setTogglingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
    }
  }

  const { isKioskMode, isEmbedded } = useKiosk();
  const isWideMode = isKioskMode || isEmbedded;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-lg text-slate-600">Loading checklists...</div>
      </div>
    );
  }

  // Shared overlays for both layouts
  const overlays = (
    <>
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
    </>
  );

  // ── Kiosk layout: 3-column side-by-side ──
  if (isWideMode) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 grid grid-rows-[auto_1fr] relative">
        {overlays}

        {/* Row 1: Compact header */}
        <div className="px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Images/JaffeFamilyHubLogo.PNG"
              alt="Jaffe Family Hub"
              className="w-12 h-12 rounded-xl object-cover shadow-lg"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Morning Checklist
              </h1>
              <p className="text-slate-500 text-xs">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {allComplete && members.length > 0 && (
              <span className="ml-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                Everyone&apos;s Ready!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <HeaderClock />
            <SyncIndicator />
            {allComplete && (
              <Button
                onClick={() => setShowVideo(true)}
                size="sm"
                className="min-h-[40px] bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Celebrate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="min-h-[40px] min-w-[40px]"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={() => setShowRecharge((v) => !v)}
              size="sm"
              className={`min-h-[40px] ${
                showRecharge
                  ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0"
                  : ""
              }`}
              variant={showRecharge ? "default" : "outline"}
            >
              <Battery className="h-4 w-4 mr-1" />
              Recharge
            </Button>
            <Button
              onClick={() => setShowNutrition((v) => !v)}
              size="sm"
              className={`min-h-[40px] ${
                showNutrition
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                  : ""
              }`}
              variant={showNutrition ? "default" : "outline"}
            >
              <Apple className="h-4 w-4 mr-1" />
              Nutrition
            </Button>
          </div>
        </div>

        {/* Row 2: Columns */}
        <div className="px-6 pb-4 min-h-0 flex flex-col">
          {/* Recharge Menu (inline above columns) */}
          {showRecharge && (
            <Card className="p-4 mb-3 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 flex-shrink-0">
              <RechargeMenu />
            </Card>
          )}

          {/* Nutrition Menu (inline above columns) */}
          {showNutrition && (
            <Card className="p-4 mb-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 flex-shrink-0">
              <NutritionMenu />
            </Card>
          )}

          {members.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-600">No members configured yet</p>
            </Card>
          ) : (
            <div
              className="grid gap-4 min-h-0 flex-1"
              style={{ gridTemplateColumns: `repeat(${members.length}, 1fr)` }}
            >
              {members.map((member) => {
                const percentage =
                  member.stats.total > 0
                    ? Math.round((member.stats.completed / member.stats.total) * 100)
                    : 0;

                return (
                  <Card
                    key={member.id}
                    className={`h-full flex flex-col overflow-hidden ${
                      member.stats.isComplete
                        ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-300"
                        : "bg-white"
                    }`}
                  >
                    {/* Header: Avatar + Name + Badge */}
                    <div className="flex items-center gap-3 p-3 flex-shrink-0">
                      <Avatar
                        member={{ name: member.name, role: member.role, avatar_url: member.avatar_url }}
                        size="xl"
                        className="shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 truncate">{member.name}</h3>
                        {member.stats.isComplete && member.stats.total > 0 && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-bold text-sm">All done!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {member.stats.total > 0 && (
                      <div className="px-3 pb-2 flex-shrink-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">{percentage}%</span>
                          <span className="font-bold text-slate-700">
                            {member.stats.completed}/{member.stats.total}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )}

                    {/* Checklist Items — scrollable */}
                    <div className="flex-1 overflow-auto min-h-0 px-3 pb-3">
                      {member.checklist.length === 0 ? (
                        <p className="text-center py-4 text-slate-400 text-sm">No items yet</p>
                      ) : (
                        <div className="space-y-2">
                          {member.checklist.map((item) => {
                            const itemKey = `${member.id}-${item.id}`;
                            const isToggling = togglingItems.has(itemKey);
                            return (
                              <button
                                key={item.id}
                                onClick={() => toggleItem(member.id, item.id, item.isCompleted)}
                                disabled={isToggling}
                                className={`w-full flex items-center gap-2 p-3 min-h-[48px] rounded-xl transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${
                                  item.isCompleted
                                    ? "bg-green-100 border-2 border-green-300"
                                    : "bg-slate-50 border-2 border-slate-200 hover:bg-slate-100"
                                } ${isToggling ? "opacity-60" : ""}`}
                              >
                                <div className="flex-shrink-0">
                                  {isToggling ? (
                                    <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                                  ) : item.isCompleted ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                  ) : (
                                    <Circle className="h-6 w-6 text-slate-400" />
                                  )}
                                </div>
                                {item.icon && (
                                  <div className="text-xl flex-shrink-0">{item.icon}</div>
                                )}
                                <p
                                  className={`font-semibold text-sm text-left ${
                                    item.isCompleted
                                      ? "text-green-900 line-through"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {item.title}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
      {overlays}

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
            <div className="flex flex-col items-end gap-2">
              <Clock size="md" className="hidden md:block" />
              <div className="flex items-center gap-2">
                <SyncIndicator />
                {allComplete && (
                  <Button
                    onClick={() => setShowVideo(true)}
                    className="min-h-[48px] bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Play Celebration
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="min-h-[48px] min-w-[48px]"
                >
                  {refreshing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  onClick={() => setShowRecharge((v) => !v)}
                  className={`min-h-[48px] ${
                    showRecharge
                      ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 hover:from-purple-600 hover:to-violet-600"
                      : ""
                  }`}
                  variant={showRecharge ? "default" : "outline"}
                >
                  <Battery className="h-5 w-5 mr-2" />
                  Recharge
                </Button>
                <Button
                  onClick={() => setShowNutrition((v) => !v)}
                  className={`min-h-[48px] ${
                    showNutrition
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600"
                      : ""
                  }`}
                  variant={showNutrition ? "default" : "outline"}
                >
                  <Apple className="h-5 w-5 mr-2" />
                  Nutrition
                </Button>
              </div>
            </div>
          </div>

          {/* All Complete Message */}
          {allComplete && members.length > 0 && (
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

        {/* Recharge Menu */}
        {showRecharge && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <RechargeMenu />
          </Card>
        )}

        {/* Nutrition Menu */}
        {showNutrition && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <NutritionMenu />
          </Card>
        )}

        {/* Members Grid - Horizontal layout with large avatars */}
        {members.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-600">No members configured yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {members.map((member) => {
              const percentage =
                member.stats.total > 0
                  ? Math.round((member.stats.completed / member.stats.total) * 100)
                  : 0;

              return (
                <Card
                  key={member.id}
                  className={`p-4 md:p-6 ${
                    member.stats.isComplete
                      ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-300"
                      : "bg-white"
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* Large Avatar Section */}
                    <div className="flex flex-col items-center md:items-start flex-shrink-0">
                      {/* Avatar - Large display */}
                      <Avatar
                        member={{ name: member.name, role: member.role, avatar_url: member.avatar_url }}
                        size="2xl"
                        className="shadow-xl"
                      />
                      {/* Name and completion badge below avatar */}
                      <div className="mt-3 text-center md:text-left">
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{member.name}</h3>
                        {member.stats.isComplete && member.stats.total > 0 && (
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
                      {member.stats.total > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600 font-medium">Progress</span>
                            <span className="font-bold text-slate-900">
                              {member.stats.completed}/{member.stats.total}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-3" />
                        </div>
                      )}

                      {/* Checklist Items */}
                      {member.checklist.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-sm">
                          <p>No checklist items yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {member.checklist.map((item) => {
                            const itemKey = `${member.id}-${item.id}`;
                            const isToggling = togglingItems.has(itemKey);
                            return (
                              <button
                                key={item.id}
                                onClick={() => toggleItem(member.id, item.id, item.isCompleted)}
                                disabled={isToggling}
                                className={`w-full flex items-center gap-3 p-4 min-h-[56px] rounded-xl transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${
                                  item.isCompleted
                                    ? "bg-green-100 border-2 border-green-300"
                                    : "bg-slate-50 border-2 border-slate-200 hover:bg-slate-100"
                                } ${isToggling ? "opacity-60" : ""}`}
                              >
                                <div className="flex-shrink-0">
                                  {isToggling ? (
                                    <Loader2 className="h-7 w-7 text-purple-500 animate-spin" />
                                  ) : item.isCompleted ? (
                                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                                  ) : (
                                    <Circle className="h-7 w-7 text-slate-400" />
                                  )}
                                </div>
                                {item.icon && (
                                  <div className="text-2xl flex-shrink-0">{item.icon}</div>
                                )}
                                <div className="flex-1 min-w-0 text-left">
                                  <p
                                    className={`font-semibold text-base ${
                                      item.isCompleted
                                        ? "text-green-900 line-through"
                                        : "text-slate-900"
                                    }`}
                                  >
                                    {item.title}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
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
