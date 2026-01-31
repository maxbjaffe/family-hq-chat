"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Loader2,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { Clock } from "@/components/Clock";
import { SyncIndicator, startSync, endSync } from "@/components/SyncIndicator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HouseTasks } from "@/components/HouseTasks";
import { UpcomingEventsCard } from "@/components/UpcomingEventsCard";
import { WeatherForecast } from "@/components/WeatherForecast";
import { FamilyMemberCard } from "@/components/FamilyMemberCard";
import { QuickChatWidget } from "@/components/QuickChatWidget";
import { MotivationalQuote } from "@/components/MotivationalQuote";
import { ParentsButton } from "@/components/ParentsButton";

interface FamilyMember {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid" | "pet";
  avatar_url: string | null;
  has_checklist: boolean;
  stats?: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

interface ContentData {
  joke: {
    setup: string;
    punchline: string;
    generatedAt: string;
  };
  funFact: {
    fact: string;
    topic: string;
    generatedAt: string;
  };
  quote: {
    quote: string;
    author: string;
    generatedAt: string;
  };
  jokeNextRefresh: string;
  factNextRefresh: string;
  quoteNextRefresh: string;
}

export default function UnifiedHomePage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPunchline, setShowPunchline] = useState(false);

  const loadAllData = useCallback(async () => {
    startSync();
    try {
      // Fetch checklist data (includes kids with stats) and content
      const [checklistRes, contentRes] = await Promise.all([
        fetch("/api/checklist"),
        fetch("/api/content"),
      ]);

      if (checklistRes.ok) {
        const data = await checklistRes.json();
        // Get kids with checklist data
        const kidsWithChecklists = (data.members || []).map((m: FamilyMember & { checklist?: unknown[] }) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          avatar_url: m.avatar_url,
          has_checklist: true,
          stats: m.stats,
        }));

        // Fetch all family members to get adults and pets
        const familyRes = await fetch("/api/admin/family");
        if (familyRes.ok) {
          const familyData = await familyRes.json();

          // Get adults (admin/adult roles)
          const adults = (familyData.members || [])
            .filter((m: FamilyMember) => m.role === "admin" || m.role === "adult")
            .map((m: FamilyMember) => ({
              id: m.id,
              name: m.name,
              role: m.role,
              avatar_url: m.avatar_url,
              has_checklist: false,
            }));

          // Get pets
          const pets = (familyData.members || [])
            .filter((m: FamilyMember) => m.role === "pet")
            .map((m: FamilyMember) => ({
              id: m.id,
              name: m.name,
              role: m.role,
              avatar_url: m.avatar_url,
              has_checklist: false,
            }));

          setFamilyMembers([...kidsWithChecklists, ...adults, ...pets]);
        } else {
          setFamilyMembers(kidsWithChecklists);
        }
      }

      if (contentRes.ok) {
        const data = await contentRes.json();
        setContent(data);
        setShowPunchline(false);
      }

      endSync(true);
    } catch {
      endSync(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Poll for content updates every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/content");
        if (res.ok) {
          const data = await res.json();
          if (data.joke.generatedAt !== content?.joke.generatedAt) {
            setContent(data);
            setShowPunchline(false);
          }
        }
      } catch {
        // Silent fail on background refresh
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [content?.joke.generatedAt]);

  async function refreshData() {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }

  function getTimeUntilRefresh(isoString: string): string {
    const diff = new Date(isoString).getTime() - Date.now();
    if (diff <= 0) return "Refreshing...";
    const minutes = Math.ceil(diff / 60000);
    return `New in ${minutes} min`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-lg text-slate-600">Loading Family HQ...</div>
      </div>
    );
  }

  const kidsOnly = familyMembers.filter((m) => m.role === "kid");
  const adultsAndPets = familyMembers.filter((m) => m.role === "admin" || m.role === "adult" || m.role === "pet");
  const allKidsComplete = kidsOnly.length > 0 && kidsOnly.every((c) => c.stats?.isComplete);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <img
                  src="/Images/JaffeFamilyHubLogo.PNG"
                  alt="Jaffe Family Hub"
                  className="w-20 h-20 md:w-28 md:h-28 rounded-3xl object-cover shadow-2xl border-4 border-white"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">
                    Good{" "}
                    {new Date().getHours() < 12
                      ? "Morning"
                      : new Date().getHours() < 17
                      ? "Afternoon"
                      : "Evening"}
                    , Jaffe Family!
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Clock size="lg" className="hidden md:block" />
                <div className="flex items-center gap-3">
                  <SyncIndicator />
                  <ParentsButton className="min-h-[48px]" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={refreshing}
                    className="min-h-[48px] min-w-[48px]"
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Cards Row: Weather, Quote, Joke, Fun Fact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Weather - Compact */}
              <WeatherForecast compact />

              {/* Motivational Quote */}
              <MotivationalQuote
                quote={content?.quote || null}
                nextRefresh={content?.quoteNextRefresh}
              />

              {/* Joke of the Hour */}
              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">😄</span>
                  <h3 className="font-bold text-slate-800">Joke</h3>
                </div>

                {content?.joke ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 font-medium line-clamp-2">
                      {content.joke.setup}
                    </p>

                    {showPunchline ? (
                      <p className="text-sm text-orange-600 font-bold">
                        {content.joke.punchline}
                      </p>
                    ) : (
                      <Button
                        onClick={() => setShowPunchline(true)}
                        size="sm"
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold min-h-[40px] w-full"
                      >
                        Tell me! 🤭
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm">Loading...</div>
                )}
              </Card>

              {/* Fun Fact */}
              <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-6 w-6 text-emerald-500" />
                  <h3 className="font-bold text-slate-800">Fun Fact</h3>
                </div>

                {content?.funFact ? (
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
                    {content.funFact.fact}
                  </p>
                ) : (
                  <div className="text-slate-500 text-sm">Loading...</div>
                )}
              </Card>
            </div>

            {/* Family Grid */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                {allKidsComplete ? (
                  <>
                    <Sparkles className="h-6 w-6 text-green-500" />
                    Everyone&apos;s Ready!
                  </>
                ) : (
                  "Family"
                )}
              </h2>

              {familyMembers.length === 0 ? (
                <Card className="p-6 text-center text-slate-500">
                  No family members configured yet
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Kids Row */}
                  {kidsOnly.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {kidsOnly.map((member) => (
                        <FamilyMemberCard key={member.id} member={member} />
                      ))}
                    </div>
                  )}
                  {/* Adults & Pet Row */}
                  {adultsAndPets.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {adultsAndPets.map((member) => (
                        <FamilyMemberCard key={member.id} member={member} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* House Tasks */}
            <div className="mb-6">
              <HouseTasks />
            </div>
          </div>

          {/* Sidebar - Upcoming Events */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6">
              <UpcomingEventsCard sidebar />
            </div>
          </div>
        </div>

        {/* Mobile: Upcoming Events (shown below on small screens) */}
        <div className="lg:hidden mt-6">
          <UpcomingEventsCard />
        </div>
      </div>

      {/* Quick Chat Widget - Fixed bottom-right */}
      <QuickChatWidget />
    </div>
  );
}
