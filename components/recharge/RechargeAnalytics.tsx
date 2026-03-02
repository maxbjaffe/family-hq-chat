"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import type { RechargeCategory } from "./constants";
import { CATEGORY_CONFIG } from "./constants";

interface SessionWithBreak {
  id: string;
  child_id: string;
  break_id: string;
  started_at: string;
  completed_at: string | null;
  completed: boolean;
  duration_planned: number;
  duration_actual: number | null;
  rating: number | null;
  recharge_breaks: {
    name: string;
    emoji: string;
    category: RechargeCategory;
    duration: number;
  } | null;
}

interface RechargeAnalyticsProps {
  childId: string;
  childName: string;
}

export function RechargeAnalytics({ childId, childName }: RechargeAnalyticsProps) {
  const [sessions, setSessions] = useState<SessionWithBreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/recharge/analytics?childId=${childId}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error("[RechargeAnalytics] Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [childId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-600 mb-1">No breaks yet</h3>
        <p className="text-sm text-slate-400">
          {childName}&apos;s break stats will show up here after some recharge sessions.
        </p>
      </div>
    );
  }

  // Compute stats
  const totalBreaks = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed);
  const completionPct =
    totalBreaks > 0 ? Math.round((completedSessions.length / totalBreaks) * 100) : 0;

  const ratingsArr = sessions
    .filter((s) => s.rating != null)
    .map((s) => s.rating!);
  const avgRating =
    ratingsArr.length > 0
      ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1)
      : "--";

  const totalMinutes = sessions.reduce((sum, s) => {
    const actual = s.duration_actual ?? s.duration_planned;
    return sum + Math.round(actual / 60);
  }, 0);

  // Category distribution
  const catCounts: Record<string, number> = {};
  for (const s of sessions) {
    const cat = s.recharge_breaks?.category || "fun";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  const maxCatCount = Math.max(...Object.values(catCounts), 1);

  // Favorite breaks (top 5)
  const breakCounts: Record<string, { name: string; emoji: string; count: number }> = {};
  for (const s of sessions) {
    const key = s.break_id;
    if (!breakCounts[key]) {
      breakCounts[key] = {
        name: s.recharge_breaks?.name || "Unknown",
        emoji: s.recharge_breaks?.emoji || "?",
        count: 0,
      };
    }
    breakCounts[key].count++;
  }
  const topBreaks = Object.values(breakCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Breaks" value={String(totalBreaks)} color="bg-purple-50 text-purple-700" />
        <StatCard label="Completion %" value={`${completionPct}%`} color="bg-green-50 text-green-700" />
        <StatCard label="Avg Rating" value={String(avgRating)} color="bg-amber-50 text-amber-700" />
        <StatCard label="Total Time" value={`${totalMinutes}m`} color="bg-sky-50 text-sky-700" />
      </div>

      {/* Category distribution */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Category Breakdown</h4>
        <div className="flex flex-col gap-2.5">
          {(Object.keys(CATEGORY_CONFIG) as RechargeCategory[]).map((cat) => {
            const count = catCounts[cat] || 0;
            if (count === 0) return null;
            const config = CATEGORY_CONFIG[cat];
            const pct = Math.round((count / maxCatCount) * 100);

            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-xs w-16 text-slate-500 font-medium flex-shrink-0">
                  {config.icon} {config.label}
                </span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${config.accent} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-6 text-right flex-shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Favorite breaks */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Favorite Breaks</h4>
        <div className="flex flex-col gap-2">
          {topBreaks.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 w-5 text-center">
                #{i + 1}
              </span>
              <span className="text-lg flex-shrink-0">{b.emoji}</span>
              <span className="text-sm text-slate-700 font-medium flex-1 truncate">
                {b.name}
              </span>
              <span className="text-xs text-slate-400">
                {b.count}x
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-lg ${color} p-3 text-center`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-70 mt-0.5">{label}</p>
    </div>
  );
}
