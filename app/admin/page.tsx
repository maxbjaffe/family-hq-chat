"use client";

import { useState, useEffect } from "react";

interface AnalyticsSummary {
  total_queries: number;
  avg_response_time_ms: number;
  queries_today: number;
  top_queries: { query: string; count: number }[];
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(setAnalytics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-8">Analytics</h1>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-8">Analytics</h1>
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error || "Analytics not available. Check Supabase configuration."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">
          Family HQ Analytics
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Queries</p>
            <p className="text-3xl font-bold text-slate-800">
              {analytics.total_queries}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Queries Today</p>
            <p className="text-3xl font-bold text-purple-600">
              {analytics.queries_today}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Avg Response Time</p>
            <p className="text-3xl font-bold text-teal-600">
              {(analytics.avg_response_time_ms / 1000).toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Top Queries */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Top Queries
          </h2>
          {analytics.top_queries.length === 0 ? (
            <p className="text-slate-500">No queries yet</p>
          ) : (
            <ul className="space-y-3">
              {analytics.top_queries.map((q, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-slate-700">{q.query}</span>
                  <span className="text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {q.count}x
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-sm text-slate-400 mt-8 text-center">
          <a href="/" className="hover:text-slate-600">
            ← Back to Chat
          </a>
        </p>
      </div>
    </div>
  );
}
