"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useKiosk } from "@/components/KioskProvider";
import { Button } from "@/components/ui/button";
import { Clock } from "@/components/Clock";
import { SyncIndicator, startSync, endSync } from "@/components/SyncIndicator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HouseTasks } from "@/components/HouseTasks";
import { QuickChatWidget } from "@/components/QuickChatWidget";
import { ParentsButton } from "@/components/ParentsButton";
import { TodayHeroCard } from "@/components/home/TodayHeroCard";
import { FamilyAvatarRow } from "@/components/home/FamilyAvatarRow";
import { RestOfWeekCard } from "@/components/home/RestOfWeekCard";
import { RechargeQuickLaunch } from "@/components/home/RechargeQuickLaunch";
import { FunStuffCarousel } from "@/components/home/FunStuffCarousel";
import { FamilyBoardCard } from "@/components/home/FamilyBoardCard";
import { WeatherCard } from "@/components/home/WeatherCard";
import { QuoteCard, JokeCard, FunFactCard } from "@/components/home/ContentCards";

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

interface UpcomingItem {
  id: string;
  title: string;
  date: string;
  type: "calendar" | "school-event" | "action";
  source: string;
  children?: string[];
  urgency?: string;
  location?: string;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export default function UnifiedHomePage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [content, setContent] = useState<ContentData | null>(null);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingContent, setRefreshingContent] = useState(false);

  const loadAllData = useCallback(async () => {
    startSync();
    try {
      const [checklistRes, contentRes, familyRes, upcomingRes] = await Promise.all([
        fetch("/api/checklist"),
        fetch("/api/content"),
        fetch("/api/admin/family"),
        fetch("/api/upcoming?days=7"),
      ]);

      if (checklistRes.ok) {
        const data = await checklistRes.json();
        const kidsWithChecklists = (data.members || []).map(
          (m: FamilyMember & { checklist?: unknown[] }) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            avatar_url: m.avatar_url,
            has_checklist: true,
            stats: m.stats,
          })
        );

        let pets: FamilyMember[] = [];
        if (familyRes.ok) {
          const familyData = await familyRes.json();
          pets = (familyData.members || [])
            .filter((m: FamilyMember) => m.role === "pet")
            .map((m: FamilyMember) => ({
              id: m.id,
              name: m.name,
              role: m.role,
              avatar_url: m.avatar_url,
              has_checklist: false,
            }));
        }

        setFamilyMembers([...kidsWithChecklists, ...pets]);
      }

      if (contentRes.ok) {
        const data = await contentRes.json();
        setContent(data);
      }

      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingItems(data.items || []);
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

  async function refreshContent() {
    setRefreshingContent(true);
    try {
      const res = await fetch("/api/content", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setContent({
          joke: data.joke,
          funFact: data.funFact,
          quote: data.quote,
          jokeNextRefresh: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          factNextRefresh: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          quoteNextRefresh: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      }
    } catch {
      // Silent fail
    }
    setRefreshingContent(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-lg text-slate-600">Loading Family HQ...</div>
      </div>
    );
  }

  const { isKioskMode, isEmbedded } = useKiosk();
  const isWideMode = isKioskMode || isEmbedded;

  const kidsOnly = familyMembers.filter((m) => m.role === "kid");
  const allKidsComplete =
    kidsOnly.length > 0 && kidsOnly.every((c) => c.stats?.isComplete);

  if (isWideMode) {
    // ── Kiosk layout: fits 1920x1080 with no scrolling ──
    // Sidebar is rendered by NavigationWrapper; this is just page content
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 grid grid-rows-[auto_1fr_auto]">
        {/* Row 1: Header */}
        <div className="px-6 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h1>
              <p className="text-slate-600 text-sm mt-0.5">
                Good {getTimeOfDayGreeting()}, Jaffe Family!
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Clock size="lg" />
              <div className="flex items-center gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="min-h-[48px] min-w-[48px]"
                  title="Reload page"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Main content grid */}
        <div className="px-6 min-h-0 grid grid-rows-[auto_1fr_auto_auto] gap-3 pb-3">
          {/* Top: Weather | Family Board */}
          <div className="grid grid-cols-2 gap-3">
            <WeatherCard className="h-full overflow-auto" />
            <FamilyBoardCard className="h-full overflow-auto" />
          </div>

          {/* Middle: Today's Schedule (1col) | Rest of Week (2col) */}
          <div className="grid grid-cols-3 gap-3 min-h-0">
            <TodayHeroCard items={upcomingItems} kioskMode hideWeather className="h-full overflow-auto" />
            <RestOfWeekCard items={upcomingItems} horizontal defaultExpanded className="col-span-2" />
          </div>

          {/* Content: Quote | Joke | Fun Fact */}
          <div className="grid grid-cols-3 gap-3 min-h-[120px]">
            <QuoteCard quote={content?.quote ?? null} className="h-full" />
            <JokeCard joke={content?.joke ?? null} className="h-full" />
            <FunFactCard funFact={content?.funFact ?? null} className="h-full" />
          </div>

          {/* Bottom: Recharge | House Tasks */}
          <div className="grid grid-cols-2 gap-3">
            <RechargeQuickLaunch className="h-full overflow-auto" />
            <HouseTasks className="h-full overflow-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ── Normal (scrollable) layout ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 pb-24">
      <div className="mx-auto px-4 py-4 max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img
              src="/Images/JaffeFamilyHubLogo.PNG"
              alt="Jaffe Family Hub"
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-xl border-2 border-white"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h1>
              <p className="text-slate-600 text-sm mt-0.5">
                Good {getTimeOfDayGreeting()}, Jaffe Family!
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Clock size="lg" className="hidden md:block" />
            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="min-h-[48px] min-w-[48px]"
                title="Reload page"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Weather + Next Up (combined hero) ─────────────── */}
        <div className="mb-6">
          <TodayHeroCard items={upcomingItems} />
        </div>

        {/* ── Family Avatar Row ──────────────────────────────────── */}
        <div className="mb-6">
          <FamilyAvatarRow
            members={familyMembers}
            allKidsComplete={allKidsComplete}
          />
        </div>

        {/* ── Daily Fun + Recharge (side by side) ─────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FunStuffCarousel
            content={content}
            onRefresh={refreshContent}
            refreshing={refreshingContent}
          />
          <RechargeQuickLaunch />
        </div>

        {/* ── Rest of the Week (collapsible) ──────────────────── */}
        <div className="mb-6">
          <RestOfWeekCard items={upcomingItems} />
        </div>

        {/* ── Family Board + House Tasks (side by side) ────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FamilyBoardCard />
          <HouseTasks />
        </div>
      </div>

      {/* ── Quick Chat Widget ──────────────────────────────────── */}
      <QuickChatWidget />
    </div>
  );
}
