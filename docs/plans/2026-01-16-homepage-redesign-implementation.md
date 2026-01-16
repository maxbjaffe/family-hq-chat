# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign homepage with prominent avatars, add jokes/fun facts from Claude API, fix inactivity timer, and prevent zoom.

**Architecture:** Homepage becomes a dashboard showing kid status (read-only) with engaging content. New API route handles Claude API calls with hourly caching. Inactivity timer simplified to track only intentional interactions.

**Tech Stack:** Next.js 14, TypeScript, Tailwind, Claude API, server-side caching

---

## Task 1: Fix Inactivity Timer

**Files:**
- Modify: `hooks/useInactivityTimer.ts:62-69`
- Modify: `components/KioskProvider.tsx:34`

**Step 1: Update activity events in useInactivityTimer.ts**

Remove `mousemove` and `touchmove` from the events array (line 62-69):

```typescript
// Set up activity listeners
const events = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];
```

**Step 2: Update default timeout in KioskProvider.tsx**

Change line 34 from 7 to 10:

```typescript
const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(10);
```

**Step 3: Manual test**

1. Run `npm run dev`
2. Navigate to `/games`
3. Verify timer counts down (check React DevTools or add console.log temporarily)
4. Click/tap to verify timer resets
5. Verify NO reset on mouse movement

**Step 4: Commit**

```bash
git add hooks/useInactivityTimer.ts components/KioskProvider.tsx
git commit -m "fix: inactivity timer ignores passive mouse movement

Remove mousemove/touchmove from activity events so only intentional
interactions (clicks, taps, keystrokes) reset the timer.
Change default timeout from 7 to 10 minutes."
```

---

## Task 2: Add Zoom Prevention CSS

**Files:**
- Modify: `app/globals.css`

**Step 1: Add touch-action to globals.css**

Add at the top of the file, after any existing html/body rules:

```css
/* Prevent zoom on touch devices */
html {
  touch-action: manipulation;
}
```

**Step 2: Manual test**

1. Open on a touch device or Chrome DevTools mobile emulation
2. Double-tap on various elements
3. Verify no zoom occurs

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "fix: prevent double-tap zoom on touch devices

Add touch-action: manipulation to complement viewport meta tags
for browsers that ignore userScalable=false."
```

---

## Task 3: Create Content API Route

**Files:**
- Create: `app/api/content/route.ts`

**Step 1: Create the API route**

```typescript
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// In-memory cache for jokes and fun facts
interface CachedContent {
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
  jokeExpiresAt: number;
  factExpiresAt: number;
}

let cache: CachedContent | null = null;

const HOUR_MS = 60 * 60 * 1000;
const HALF_HOUR_MS = 30 * 60 * 1000;

// Fallback content if API fails
const FALLBACK_JOKES = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh!" },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems." },
];

const FALLBACK_FACTS = [
  { fact: "Did you know honey never spoils? Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still perfectly good to eat!", topic: "science" },
  { fact: "Did you know octopuses have three hearts? Two pump blood to the gills, and one pumps it to the rest of the body.", topic: "animals" },
  { fact: "Did you know the shortest war in history lasted only 38 minutes? It was between Britain and Zanzibar in 1896.", topic: "history" },
];

async function generateJoke(client: Anthropic): Promise<{ setup: string; punchline: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Generate a single family-friendly joke for kids. Vary between silly jokes for younger kids and slightly cleverer wordplay for older kids.

Return ONLY valid JSON in this exact format, no other text:
{"setup": "the setup", "punchline": "the punchline"}`
      }
    ]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.trim());
  } catch {
    return FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
  }
}

async function generateFunFact(client: Anthropic): Promise<{ fact: string; topic: string }> {
  const topics = ["science", "animals", "nature", "space", "history", "ocean", "dinosaurs", "weather"];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Generate one fascinating fun fact about ${topic} for kids. Start with "Did you know" and make it engaging and educational. Keep it under 50 words.

Return ONLY valid JSON in this exact format, no other text:
{"fact": "Did you know...", "topic": "${topic}"}`
      }
    ]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.trim());
  } catch {
    return FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
  }
}

export async function GET() {
  const now = Date.now();

  // Check if we need to refresh joke
  const needNewJoke = !cache || now >= cache.jokeExpiresAt;
  // Check if we need to refresh fact (offset by 30 min from jokes)
  const needNewFact = !cache || now >= cache.factExpiresAt;

  if (!needNewJoke && !needNewFact && cache) {
    return NextResponse.json({
      joke: cache.joke,
      funFact: cache.funFact,
      jokeNextRefresh: new Date(cache.jokeExpiresAt).toISOString(),
      factNextRefresh: new Date(cache.factExpiresAt).toISOString(),
    });
  }

  // Initialize client
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Return fallback if no API key
    const fallbackJoke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
    const fallbackFact = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
    return NextResponse.json({
      joke: { ...fallbackJoke, generatedAt: new Date().toISOString() },
      funFact: { ...fallbackFact, generatedAt: new Date().toISOString() },
      jokeNextRefresh: new Date(now + HOUR_MS).toISOString(),
      factNextRefresh: new Date(now + HOUR_MS).toISOString(),
    });
  }

  const client = new Anthropic({ apiKey });

  try {
    // Generate new content as needed
    let joke = cache?.joke;
    let jokeExpiresAt = cache?.jokeExpiresAt || 0;

    if (needNewJoke) {
      const newJoke = await generateJoke(client);
      joke = { ...newJoke, generatedAt: new Date().toISOString() };
      jokeExpiresAt = now + HOUR_MS;
    }

    let funFact = cache?.funFact;
    let factExpiresAt = cache?.factExpiresAt || 0;

    if (needNewFact) {
      const newFact = await generateFunFact(client);
      funFact = { ...newFact, generatedAt: new Date().toISOString() };
      // Offset fact refresh by 30 minutes from joke
      factExpiresAt = now + HOUR_MS;
    }

    // Update cache
    cache = {
      joke: joke!,
      funFact: funFact!,
      jokeExpiresAt,
      factExpiresAt,
    };

    return NextResponse.json({
      joke: cache.joke,
      funFact: cache.funFact,
      jokeNextRefresh: new Date(cache.jokeExpiresAt).toISOString(),
      factNextRefresh: new Date(cache.factExpiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Error generating content:", error);

    // Return fallback on error
    const fallbackJoke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
    const fallbackFact = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];

    return NextResponse.json({
      joke: { ...fallbackJoke, generatedAt: new Date().toISOString() },
      funFact: { ...fallbackFact, generatedAt: new Date().toISOString() },
      jokeNextRefresh: new Date(now + HOUR_MS).toISOString(),
      factNextRefresh: new Date(now + HOUR_MS).toISOString(),
    });
  }
}
```

**Step 2: Test the API**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/content | jq
```

Expected: JSON with joke and funFact objects.

**Step 3: Commit**

```bash
git add app/api/content/route.ts
git commit -m "feat: add content API for jokes and fun facts

Claude API generates kid-friendly jokes and educational fun facts.
Hourly caching to minimize API calls. Fallback content if API fails."
```

---

## Task 4: Redesign Homepage

**Files:**
- Modify: `app/page.tsx` (complete rewrite)

**Step 1: Rewrite the homepage**

Replace entire contents of `app/page.tsx`:

```typescript
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

interface ChildData {
  id: string;
  name: string;
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

const AVATAR_COLORS = [
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-green-400 to-green-600",
];

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

        {/* Weather Card - Compact */}
        {weather && (
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 mb-6">
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
              {children.map((child, index) => {
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
                        {/* Large Avatar */}
                        {child.avatar_type === "custom" && child.avatar_data ? (
                          <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                            <img
                              src={child.avatar_data}
                              alt={child.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-36 h-36 md:w-44 md:h-44 rounded-3xl bg-gradient-to-br ${
                              AVATAR_COLORS[index % AVATAR_COLORS.length]
                            } flex items-center justify-center text-white text-6xl md:text-7xl font-bold shadow-2xl`}
                          >
                            {child.name.charAt(0)}
                          </div>
                        )}

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
```

**Step 2: Test the homepage**

1. Run `npm run dev`
2. Navigate to `/`
3. Verify:
   - Kid avatars display large with progress bars
   - Avatars are tappable and link to `/kiosk`
   - Weather card displays
   - Joke card shows with "Tell me!" button
   - Fun fact card shows with topic badge
   - No checklist toggle functionality on homepage

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign homepage with avatar focus and fun content

- Kid avatars now prominent and tappable (link to checklist)
- Progress shown but tasks not toggleable on homepage
- Added Joke of the Hour card (from Claude API)
- Added Fun Fact card (from Claude API)
- Removed: events section, quick actions, interactive checklist"
```

---

## Task 5: Final Integration Test

**Step 1: Full test checklist**

Run through these manually:

- [ ] Homepage loads with avatars, weather, jokes, facts
- [ ] Tapping avatar goes to `/kiosk`
- [ ] Can complete tasks on `/kiosk` (not on homepage)
- [ ] Joke "Tell me!" button reveals punchline
- [ ] Content refreshes after an hour (or test by clearing cache)
- [ ] Inactivity: go to `/games`, wait without clicking - verify redirect
- [ ] Zoom: double-tap on touch device doesn't zoom

**Step 2: Final commit with all changes**

```bash
git status
# Verify everything is committed
git log --oneline -5
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Fix inactivity timer | useInactivityTimer.ts, KioskProvider.tsx |
| 2 | Zoom prevention CSS | globals.css |
| 3 | Content API route | api/content/route.ts |
| 4 | Homepage redesign | page.tsx |
| 5 | Integration test | Manual verification |
