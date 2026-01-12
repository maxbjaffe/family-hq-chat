import { createClient, SupabaseClient } from "@supabase/supabase-js";

let analyticsClient: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (analyticsClient) return analyticsClient;

  // Use analytics-specific Supabase instance
  const url = process.env.SUPABASE_ANALYTICS_URL;
  const key = process.env.SUPABASE_ANALYTICS_KEY;

  if (!url || !key) {
    console.warn("Supabase analytics not configured - analytics disabled");
    return null;
  }

  analyticsClient = createClient(url, key);
  return analyticsClient;
}

export interface ChatEvent {
  query: string;
  response_time_ms: number;
  user_agent?: string;
  cached_notion?: boolean;
}

export async function logChatEvent(event: ChatEvent): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.from("chat_events").insert({
      query: event.query,
      response_time_ms: event.response_time_ms,
      user_agent: event.user_agent || null,
      cached_notion: event.cached_notion ?? false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't let analytics errors break the app
    console.error("Failed to log chat event:", error);
  }
}

// For viewing analytics
export interface AnalyticsSummary {
  total_queries: number;
  avg_response_time_ms: number;
  queries_today: number;
  top_queries: { query: string; count: number }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total count and average response time
    const { data: stats } = await client
      .from("chat_events")
      .select("response_time_ms");

    const total_queries = stats?.length || 0;
    const avg_response_time_ms = stats?.length
      ? Math.round(
          stats.reduce((sum, e) => sum + e.response_time_ms, 0) / stats.length
        )
      : 0;

    // Get today's count
    const { count: queries_today } = await client
      .from("chat_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Get top queries (simple frequency count)
    const { data: allQueries } = await client
      .from("chat_events")
      .select("query")
      .order("created_at", { ascending: false })
      .limit(500);

    const queryCount = new Map<string, number>();
    allQueries?.forEach((q) => {
      const normalized = q.query.toLowerCase().trim();
      queryCount.set(normalized, (queryCount.get(normalized) || 0) + 1);
    });

    const top_queries = Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      total_queries,
      avg_response_time_ms,
      queries_today: queries_today || 0,
      top_queries,
    };
  } catch (error) {
    console.error("Failed to get analytics:", error);
    return null;
  }
}
