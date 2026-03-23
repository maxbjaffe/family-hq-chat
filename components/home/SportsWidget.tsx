"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Flame, ExternalLink, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types (mirrors Focus Hub /api/sports/summary response)
// ---------------------------------------------------------------------------

interface LastGame {
  date: string;
  opponent: string;
  result: "W" | "L" | "T";
  score: string;
  isRivalry: boolean;
}

interface NextGame {
  date: string;
  opponent: string;
  time: string;
  isRivalry: boolean;
}

interface TeamSummary {
  name: string;
  league: string;
  emoji: string;
  lastGame: LastGame | null;
  nextGame: NextGame | null;
  news: { headline: string; summary: string }[];
  watercooler: string;
}

interface EventSummary {
  label: string;
  league: string;
  emoji: string;
  isActive: boolean;
  summary: string;
  watercooler: string;
  highlights: string[];
}

interface SportsSummaryResponse {
  generatedAt: string;
  teams: TeamSummary[];
  events: EventSummary[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === -1) return "Yday";
  if (diff === 1) return "Tmrw";
  if (diff > 1 && diff <= 6) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// SportsWidget — Family HQ edition (light theme, Card-based)
// ---------------------------------------------------------------------------

interface SportsWidgetProps {
  className?: string;
}

export function SportsWidget({ className }: SportsWidgetProps) {
  const [data, setData] = useState<SportsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const apiEndpoint = process.env.NEXT_PUBLIC_FOCUS_HUB_URL
    ? `${process.env.NEXT_PUBLIC_FOCUS_HUB_URL}/api/sports/summary`
    : "https://focus.maxjaffe.ai/api/sports/summary";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <Card className={`bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ${className || ""}`}>
        <div className="flex items-center gap-2 text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading sports...</span>
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className={`bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ${className || ""}`}>
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-sm">Sports unavailable</span>
          <button onClick={fetchData} className="text-xs text-emerald-600 hover:underline">
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const teams = data.teams.filter(t =>
    ["Yankees", "Red Sox", "Knicks", "Celtics", "Patriots"].includes(t.name)
  );
  const activeEvents = data.events.filter(e => e.isActive);

  return (
    <Card className={`bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Sports</h3>
        </div>
        <button
          onClick={fetchData}
          className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Team rows */}
      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={`${team.league}-${team.name}`}
            className="flex items-center gap-2 text-sm py-1 border-l-[3px] pl-3 border-emerald-300"
          >
            <span>{team.emoji}</span>
            <span className="font-medium text-slate-800 min-w-[65px]">{team.name}</span>

            {team.lastGame ? (
              <>
                <span
                  className={`font-bold ${
                    team.lastGame.result === "W"
                      ? "text-emerald-600"
                      : team.lastGame.result === "L"
                      ? "text-rose-500"
                      : "text-slate-400"
                  }`}
                >
                  {team.lastGame.result}
                </span>
                <span className="text-slate-600">
                  {team.lastGame.score} vs {team.lastGame.opponent}
                </span>
                {team.lastGame.isRivalry && (
                  <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                )}
              </>
            ) : (
              <span className="text-slate-400">Offseason</span>
            )}

            {team.nextGame && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 text-xs">
                  Next: {formatRelativeDate(team.nextGame.date)} vs {team.nextGame.opponent}
                </span>
                {team.nextGame.isRivalry && (
                  <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                )}
              </>
            )}
          </div>
        ))}

        {/* Active events */}
        {activeEvents.map((event) => (
          <div
            key={event.label}
            className="flex items-center gap-2 text-sm py-1 border-l-[3px] pl-3 border-amber-300"
          >
            <span>{event.emoji}</span>
            <span className="font-medium text-slate-800">{event.label}</span>
            <span className="text-slate-500 text-xs truncate">{event.watercooler}</span>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <div className="mt-3 pt-2 border-t border-emerald-200">
        <a
          href="https://focus.maxjaffe.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View full briefing
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </Card>
  );
}
