# Unified Home & Parent Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate Home + Dashboard into a single family-first screen with quick chat, create Parent Portal with PIN-based routing.

**Architecture:** Simplified 3-item navigation (Home, Checklists, Breaktime). Unified home shows weather, calendar, family grid, tasks, fun content. Parents button triggers PIN modal that identifies user and routes to their dashboard. Role-based detail views for family members.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, shadcn/ui, Claude API for quotes

---

## Task 1: Simplify Navigation to 3 Items

**Files:**
- Modify: `components/Navigation.tsx:32-40`

**Step 1: Update navItems array**

Replace lines 32-40:

```typescript
const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/kiosk", label: "Checklists", icon: CheckSquare },
  { href: "/games", label: "Breaktime", icon: Gamepad2 },
];
```

**Step 2: Remove unused imports**

Remove from imports (line 8-14):
- `MessageSquare`
- `Calendar`
- `Settings`
- `LayoutDashboard`

Keep: `Home`, `CheckSquare`, `Gamepad2`, `Maximize`

**Step 3: Verify navigation renders**

Run: `npm run dev`
Check: Navigation shows only 3 items (Home, Checklists, Breaktime)

**Step 4: Commit**

```bash
git add components/Navigation.tsx
git commit -m "refactor(nav): simplify to 3 items - Home, Checklists, Breaktime"
```

---

## Task 2: Add Motivational Quotes to Content API

**Files:**
- Modify: `app/api/content/route.ts`

**Step 1: Add fallback quotes array**

Add after `FALLBACK_FACTS` array (~line 79):

```typescript
const FALLBACK_QUOTES = [
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { quote: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { quote: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
  { quote: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Kindness is a language which the deaf can hear and the blind can see.", author: "Mark Twain" },
  { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
];
```

**Step 2: Add generateQuote function**

Add after `generateFunFact` function:

```typescript
async function generateQuote(client: Anthropic): Promise<{ quote: string; author: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Generate one short, family-friendly motivational or inspirational quote. Can be from a famous person or a wise saying. Keep it uplifting and suitable for all ages.

Return ONLY valid JSON in this exact format, no other text:
{"quote": "the quote text", "author": "attribution"}`
      }
    ]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.warn('Quote generation failed, using fallback:', e);
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  }
}
```

**Step 3: Update CachedContent interface**

Add to interface (~line 5-18):

```typescript
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
  quote: {
    quote: string;
    author: string;
    generatedAt: string;
  };
  jokeExpiresAt: number;
  factExpiresAt: number;
  quoteExpiresAt: number;
}
```

**Step 4: Update GET handler to include quotes**

Update the GET function to handle quotes similarly to jokes/facts. Add:
- `needNewQuote` check
- Generate quote when needed
- Include in cache and response
- Add `quoteNextRefresh` to response

**Step 5: Test the endpoint**

Run: `curl http://localhost:3000/api/content | jq .`
Expected: Response includes `quote`, `quoteNextRefresh` fields

**Step 6: Commit**

```bash
git add app/api/content/route.ts
git commit -m "feat(content): add motivational quotes to content API"
```

---

## Task 3: Create Weather Forecast API for 3-Day View

**Files:**
- Modify: `app/api/weather/route.ts`

**Step 1: Read current weather API**

Check current implementation structure.

**Step 2: Add forecast data to response**

Update the weather API to return 3-day forecast array:

```typescript
// Add to response
forecast: [
  { day: 'Today', high: number, low: number, icon: string, description: string },
  { day: 'Tomorrow', high: number, low: number, icon: string, description: string },
  { day: 'Wed', high: number, low: number, icon: string, description: string },
]
```

**Step 3: Test endpoint**

Run: `curl http://localhost:3000/api/weather | jq .`
Expected: Response includes `forecast` array with 3 days

**Step 4: Commit**

```bash
git add app/api/weather/route.ts
git commit -m "feat(weather): add 3-day forecast to weather API"
```

---

## Task 4: Create WeatherForecast Component

**Files:**
- Create: `components/WeatherForecast.tsx`

**Step 1: Create component**

```typescript
'use client';

import { Card } from '@/components/ui/card';

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  icon: string;
  description: string;
}

interface WeatherForecastProps {
  current: {
    temperature: number;
    description: string;
    icon: string;
  };
  forecast: ForecastDay[];
}

export function WeatherForecast({ current, forecast }: WeatherForecastProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Current weather - prominent */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-5xl">{current.icon}</div>
        <div>
          <div className="text-3xl font-bold text-slate-900">
            {current.temperature}°F
          </div>
          <div className="text-sm text-slate-600">{current.description}</div>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-100">
        {forecast.map((day) => (
          <div key={day.day} className="text-center">
            <div className="text-xs font-medium text-slate-500">{day.day}</div>
            <div className="text-2xl my-1">{day.icon}</div>
            <div className="text-xs text-slate-600">
              <span className="font-medium">{day.high}°</span>
              <span className="text-slate-400 mx-1">/</span>
              <span>{day.low}°</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/WeatherForecast.tsx
git commit -m "feat(components): add WeatherForecast component with 3-day view"
```

---

## Task 5: Create QuickChatWidget Component

**Files:**
- Create: `components/QuickChatWidget.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function QuickChatWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble with that. Try again?' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-24 md:bottom-6 right-4 z-40 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all min-w-[56px] min-h-[56px] flex items-center justify-center"
        aria-label="Open quick chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-24 md:bottom-6 right-4 z-40 w-80 max-h-96 flex flex-col shadow-xl border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
        <span className="font-medium">Quick Question</span>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-white/20 rounded"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-48">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            Ask me anything about the family schedule, weather, or info!
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm p-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-purple-100 text-purple-900 ml-8'
                : 'bg-slate-100 text-slate-700 mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
            disabled={loading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !input.trim()}
            className="min-h-[44px] min-w-[44px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/QuickChatWidget.tsx
git commit -m "feat(components): add QuickChatWidget for home screen"
```

---

## Task 6: Create Quick Chat API Endpoint

**Files:**
- Create: `app/api/chat/quick/route.ts`

**Step 1: Create read-only chat endpoint**

```typescript
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCachedCalendarEvents } from '@/lib/supabase';

const BLOCKED_ACTIONS = [
  'create', 'add', 'make', 'new', 'delete', 'remove', 'update', 'change', 'edit', 'modify', 'complete', 'finish', 'mark'
];

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ response: 'Please ask a question!' });
    }

    // Check for blocked action words
    const lowerMessage = message.toLowerCase();
    const hasBlockedAction = BLOCKED_ACTIONS.some(action => lowerMessage.includes(action));

    if (hasBlockedAction && (lowerMessage.includes('task') || lowerMessage.includes('reminder') || lowerMessage.includes('todo'))) {
      return NextResponse.json({
        response: "I can only answer questions from the family home screen. To create or modify tasks, tap the Parents button to access the full dashboard."
      });
    }

    // Get context data
    const events = await getCachedCalendarEvents(7);
    const eventContext = events.length > 0
      ? `Upcoming events:\n${events.slice(0, 10).map(e => `- ${e.title} on ${new Date(e.start_time).toLocaleDateString()}`).join('\n')}`
      : 'No upcoming events.';

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You are a helpful family assistant on a home dashboard. Answer questions briefly and friendly.
You can help with:
- Calendar/schedule questions
- Weather questions
- Family member info
- General family questions

Keep responses short (1-2 sentences). Be warm and helpful.

Context:
${eventContext}`,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : "I couldn't understand that.";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Quick chat error:', error);
    return NextResponse.json({ response: "Sorry, I'm having trouble right now. Try again?" });
  }
}
```

**Step 2: Test endpoint**

Run: `curl -X POST http://localhost:3000/api/chat/quick -H "Content-Type: application/json" -d '{"message":"What events are coming up?"}'`

**Step 3: Commit**

```bash
git add app/api/chat/quick/route.ts
git commit -m "feat(api): add read-only quick chat endpoint"
```

---

## Task 7: Create MotivationalQuote Component

**Files:**
- Create: `components/MotivationalQuote.tsx`

**Step 1: Create component**

```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface MotivationalQuoteProps {
  quote: string;
  author: string;
  nextRefresh: string;
}

export function MotivationalQuote({ quote, author, nextRefresh }: MotivationalQuoteProps) {
  function getTimeUntilRefresh(isoString: string): string {
    const diff = new Date(isoString).getTime() - Date.now();
    if (diff <= 0) return 'Refreshing...';
    const minutes = Math.ceil(diff / 60000);
    return `New in ${minutes} min`;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-emerald-500" />
        <h3 className="font-semibold text-slate-800">Daily Inspiration</h3>
      </div>
      <blockquote className="text-slate-700 italic mb-2">
        "{quote}"
      </blockquote>
      <p className="text-sm text-emerald-600 font-medium">— {author}</p>
      <p className="text-xs text-slate-400 mt-2">{getTimeUntilRefresh(nextRefresh)}</p>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/MotivationalQuote.tsx
git commit -m "feat(components): add MotivationalQuote component"
```

---

## Task 8: Create Parents Button Component

**Files:**
- Create: `components/ParentsButton.tsx`

**Step 1: Create component**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinModal } from '@/components/PinModal';
import { useUser } from '@/components/UserProvider';

export function ParentsButton() {
  const router = useRouter();
  const { login } = useUser();
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const handlePinSuccess = (user: { id: string; name: string; role: 'admin' | 'adult' | 'kid' }) => {
    login(user.id, user.name, user.role);
    setPinModalOpen(false);
    // Route to parent dashboard - PIN identifies which parent
    router.push('/parents');
  };

  return (
    <>
      <Button
        onClick={() => setPinModalOpen(true)}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white min-h-[48px] px-4"
      >
        <Users className="h-5 w-5 mr-2" />
        Parents
      </Button>

      <PinModal
        isOpen={pinModalOpen}
        onSuccess={handlePinSuccess}
        onCancel={() => setPinModalOpen(false)}
        title="Enter Parent PIN"
      />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add components/ParentsButton.tsx
git commit -m "feat(components): add ParentsButton with PIN modal"
```

---

## Task 9: Create Parent Dashboard Page

**Files:**
- Create: `app/parents/page.tsx`

**Step 1: Create protected parent dashboard**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/Avatar';
import { useUser } from '@/components/UserProvider';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { TasksWidget } from '@/components/widgets/TasksWidget';
import Link from 'next/link';

export default function ParentDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, userName, userRole, logout } = useUser();

  // Redirect if not authenticated or not a parent
  useEffect(() => {
    if (!isAuthenticated || (userRole !== 'admin' && userRole !== 'adult')) {
      router.push('/');
    }
  }, [isAuthenticated, userRole, router]);

  if (!isAuthenticated || (userRole !== 'admin' && userRole !== 'adult')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="min-h-[48px] min-w-[48px]"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Avatar
              member={{ name: userName || '', role: userRole || 'adult' }}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{userName}'s Dashboard</h1>
              <button
                onClick={logout}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CalendarWidget expanded />
          <TasksWidget expanded />
        </div>

        {/* Chat Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Full Chat</h2>
          <p className="text-slate-500 mb-4">Access the full AI assistant with all capabilities.</p>
          <Link href="/chat">
            <Button className="w-full md:w-auto">Open Full Chat</Button>
          </Link>
        </Card>

        {/* Admin Link */}
        <Card className="p-4">
          <Link href="/admin" className="flex items-center gap-3 text-slate-600 hover:text-purple-600">
            <Settings className="h-5 w-5" />
            <span>Admin Settings</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/parents/page.tsx
git commit -m "feat(pages): add parent dashboard page"
```

---

## Task 10: Create FamilyMemberCard Component

**Files:**
- Create: `components/FamilyMemberCard.tsx`

**Step 1: Create card for family grid**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/Avatar';
import { PinModal } from '@/components/PinModal';
import { useUser } from '@/components/UserProvider';
import { CheckCircle2 } from 'lucide-react';

interface FamilyMemberCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string | null;
  };
  stats?: {
    total: number;
    completed: number;
    isComplete: boolean;
  };
}

export function FamilyMemberCard({ member, stats }: FamilyMemberCardProps) {
  const router = useRouter();
  const { login } = useUser();
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const isParent = member.role === 'admin' || member.role === 'adult';
  const isPet = member.role === 'pet';
  const isKid = member.role === 'kid';

  const handleClick = () => {
    if (isParent) {
      setPinModalOpen(true);
    } else {
      // Kids and pets go to their profile
      router.push(`/family/${member.name.toLowerCase().split(' ')[0]}`);
    }
  };

  const handlePinSuccess = (user: { id: string; name: string; role: 'admin' | 'adult' | 'kid' }) => {
    login(user.id, user.name, user.role);
    setPinModalOpen(false);
    router.push('/parents');
  };

  const percentage = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <>
      <Card
        onClick={handleClick}
        className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
          stats?.isComplete
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : ''
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <Avatar
            member={member}
            size="xl"
            className="shadow-lg border-2 border-white"
          />
          <h3 className="mt-3 text-lg font-bold text-slate-800">
            {member.name.split(' ')[0]}
          </h3>

          {/* Progress bar for kids */}
          {isKid && stats && (
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Progress</span>
                <span className="font-medium">{stats.completed}/{stats.total}</span>
              </div>
              <Progress value={percentage} className="h-2" />
              {stats.isComplete && (
                <div className="flex items-center justify-center gap-1 mt-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Done!
                </div>
              )}
            </div>
          )}

          {/* Role badge for parents */}
          {isParent && (
            <span className="mt-2 text-xs text-purple-600 font-medium">
              Tap for dashboard
            </span>
          )}

          {/* Pet indicator */}
          {isPet && (
            <span className="mt-2 text-xs text-amber-600">🐕 Family pet</span>
          )}
        </div>
      </Card>

      <PinModal
        isOpen={pinModalOpen}
        onSuccess={handlePinSuccess}
        onCancel={() => setPinModalOpen(false)}
        title="Enter Parent PIN"
      />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add components/FamilyMemberCard.tsx
git commit -m "feat(components): add FamilyMemberCard with role-based behavior"
```

---

## Task 11: Rewrite Unified Home Page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Rewrite home page with new layout**

This is a full rewrite. The new page should:
1. Show date/time prominently at top
2. Include ParentsButton in header
3. Show WeatherForecast (3-day)
4. Show today's calendar events
5. Show family member grid (kids + Jaffe + parents)
6. Show House Tasks
7. Show fun content (quotes, jokes, facts)
8. Include QuickChatWidget

**Step 2: Test all sections render**

Run: `npm run dev`
Navigate to `/` and verify all sections display

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): rewrite as unified family hub"
```

---

## Task 12: Update Family Profile for Role-Based Views

**Files:**
- Modify: `app/family/[name]/page.tsx`

**Step 1: Add checklist section for kids**

For kid profiles, add their checklist progress and tasks.

**Step 2: Enlarge back button**

Update back button to be more prominent:

```typescript
<Button
  variant="outline"
  onClick={() => router.push('/')}
  className="mb-6 min-h-[48px] px-6 text-base"
>
  <ArrowLeft className="h-5 w-5 mr-2" />
  Back to Home
</Button>
```

**Step 3: Enlarge avatar**

Update avatar size to hero style (increase to 3xl or custom size).

**Step 4: Commit**

```bash
git add app/family/[name]/page.tsx
git commit -m "feat(family): enhance profile with larger back button and avatar"
```

---

## Task 13: Clean Up Deprecated Routes

**Files:**
- Delete or redirect: `app/dashboard/page.tsx`
- Delete or redirect: `app/calendar/page.tsx` (optional - could keep for deep link)
- Delete or redirect: `app/chat/page.tsx` (keep for full chat access)

**Step 1: Add redirect from /dashboard to /**

Update `app/dashboard/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/');
}
```

**Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "refactor(routes): redirect /dashboard to unified home"
```

---

## Task 14: Final Integration Testing

**Step 1: Test navigation**

- Verify nav shows only 3 items
- Verify Home shows unified view

**Step 2: Test Parents flow**

- Tap Parents button
- Enter PIN
- Verify routes to parent dashboard
- Verify correct user identified

**Step 3: Test family member cards**

- Tap kid → goes to profile
- Tap parent → shows PIN modal → goes to parent dashboard
- Tap pet → goes to profile

**Step 4: Test quick chat**

- Expand widget
- Ask a question
- Try blocked action (should show redirect message)

**Step 5: Test all content loads**

- Weather forecast (3 days)
- Calendar events
- Quotes, jokes, facts

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete unified home and parent portal implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Simplify navigation | `components/Navigation.tsx` |
| 2 | Add quotes to API | `app/api/content/route.ts` |
| 3 | Weather 3-day API | `app/api/weather/route.ts` |
| 4 | WeatherForecast component | `components/WeatherForecast.tsx` |
| 5 | QuickChatWidget component | `components/QuickChatWidget.tsx` |
| 6 | Quick chat API | `app/api/chat/quick/route.ts` |
| 7 | MotivationalQuote component | `components/MotivationalQuote.tsx` |
| 8 | ParentsButton component | `components/ParentsButton.tsx` |
| 9 | Parent dashboard page | `app/parents/page.tsx` |
| 10 | FamilyMemberCard component | `components/FamilyMemberCard.tsx` |
| 11 | Rewrite home page | `app/page.tsx` |
| 12 | Enhance family profiles | `app/family/[name]/page.tsx` |
| 13 | Clean up old routes | `app/dashboard/page.tsx` |
| 14 | Integration testing | - |
