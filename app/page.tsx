"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { Clock } from "@/components/Clock";
import { SyncIndicator, startSync, endSync } from "@/components/SyncIndicator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HouseTasks } from "@/components/HouseTasks";
import { Avatar } from "@/components/Avatar";

interface ChildData {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  avatar_type: string | null;
  avatar_data: string | null;
  stats: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  high: number;
  low: number;
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
  jokeNextRefresh: string;
  factNextRefresh: string;
}

export default function DashboardPage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPunchline, setShowPunchline] = useState(false);

  const loadAllData = useCallback(async () => {
    startSync();
    try {
      const [checklistRes, weatherRes, contentRes] = await Promise.all([
        fetch("/api/checklist"),
        fetch("/api/weather"),
        fetch("/api/content"),
      ]);

      if (checklistRes.ok) {
        const data = await checklistRes.json();
        setChildren(data.children || []);
      }
      if (weatherRes.ok) {
        const data = await weatherRes.json();
        setWeather(data);
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
          // Only update if content changed
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

  const allComplete = children.length > 0 && children.every((c) => c.stats.isComplete);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <img
              src="/Images/JaffeFamilyHubLogo.PNG"
              alt="Jaffe Family Hub"
              className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover shadow-2xl border-4 border-white"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}!
              </h1>
              <p className="text-slate-600 text-lg">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Clock size="lg" className="hidden md:block" />
            <div className="flex items-center gap-3">
              <SyncIndicator />
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

        {/* Weather and House Tasks Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Weather Card - Compact */}
          {weather && (
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{weather.icon}</div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {weather.temperature}°F
                  </div>
                  <div className="text-sm text-slate-600">{weather.description}</div>
                </div>
                <div className="ml-auto text-sm text-slate-500">
                  H: {weather.high}° L: {weather.low}°
                </div>
              </div>
            </Card>
          )}

          {/* House Tasks */}
          <HouseTasks />
        </div>

        {/* Kid Avatar Cards - Main Focus */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            {allComplete ? (
              <>
                <Sparkles className="h-6 w-6 text-green-500" />
                Everyone&apos;s Ready!
              </>
            ) : (
              "Morning Progress"
            )}
          </h2>

          {children.length === 0 ? (
            <Card className="p-6 text-center text-slate-500">
              No children configured yet
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => {
                const percentage = child.stats.total > 0
                  ? Math.round((child.stats.completed / child.stats.total) * 100)
                  : 0;

                return (
                  <Link key={child.id} href="/kiosk">
                    <Card
                      className={`p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                        child.stats.isComplete
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 ring-2 ring-green-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {/* Large Avatar - using Avatar component for consistency */}
                        <Avatar
                          member={{
                            name: child.name,
                            role: child.role || 'kid',
                            avatar_url: child.avatar_url || child.avatar_data,
                          }}
                          size="2xl"
                          className="shadow-2xl border-4 border-white"
                        />

                        {/* Name */}
                        <h3
                          className="mt-4 text-2xl md:text-3xl font-black text-slate-800 tracking-tight"
                          style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive" }}
                        >
                          {child.name}
                        </h3>

                        {/* Progress */}
                        <div className="w-full mt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Progress</span>
                            <span className="font-bold text-slate-700">
                              {child.stats.completed}/{child.stats.total}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-3" />
                        </div>

                        {/* Status */}
                        {child.stats.isComplete && (
                          <div className="flex items-center gap-2 mt-3 text-green-600 font-bold">
                            <CheckCircle2 className="h-5 w-5" />
                            All done!
                          </div>
                        )}

                        {/* Tap hint */}
                        {!child.stats.isComplete && (
                          <p className="text-sm text-slate-400 mt-3">
                            Tap to complete tasks
                          </p>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Joke and Fun Fact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Joke of the Hour */}
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">😄</span>
              <h3 className="text-lg font-bold text-slate-800">Joke of the Hour</h3>
            </div>

            {content?.joke ? (
              <div className="space-y-4">
                <p className="text-lg text-slate-700 font-medium">
                  {content.joke.setup}
                </p>

                {showPunchline ? (
                  <p className="text-lg text-orange-600 font-bold animate-fade-in">
                    {content.joke.punchline}
                  </p>
                ) : (
                  <Button
                    onClick={() => setShowPunchline(true)}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold"
                  >
                    Tell me! 🤭
                  </Button>
                )}

                <p className="text-xs text-slate-400">
                  {getTimeUntilRefresh(content.jokeNextRefresh)}
                </p>
              </div>
            ) : (
              <div className="text-slate-500">Loading joke...</div>
            )}
          </Card>

          {/* Fun Fact */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-8 w-8 text-blue-500" />
              <h3 className="text-lg font-bold text-slate-800">Fun Fact</h3>
              {content?.funFact?.topic && (
                <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full capitalize">
                  {content.funFact.topic}
                </span>
              )}
            </div>

            {content?.funFact ? (
              <div className="space-y-4">
                <p className="text-lg text-slate-700 leading-relaxed">
                  {content.funFact.fact}
                </p>

                <p className="text-xs text-slate-400">
                  {getTimeUntilRefresh(content.factNextRefresh)}
                </p>
              </div>
            ) : (
              <div className="text-slate-500">Loading fun fact...</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
