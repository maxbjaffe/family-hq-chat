# Kids Recharge Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a touch-first dopamine break system for Riley, Parker, and Devin on the Family HQ kiosk, with concurrent timer support and parent management.

**Architecture:** One shared `RechargeMenu` component mounted in two places (kiosk page + kid profile). Foundation breaks are shared rows (`child_id = NULL`); custom breaks are per-child. A `RechargeTimerContext` manages up to 3 concurrent floating timer pills. All data in 3 new Supabase tables owned by Family HQ.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase, canvas-confetti (already installed), lucide-react, shadcn/ui

---

## Phase 1: Database + Seed Data

### Task 1: Create migration SQL for 3 tables

**Files:**
- Create: `supabase/migrations/20260302_recharge_menu.sql`

**Step 1: Write the migration SQL**

```sql
-- Recharge Menu tables for Kids break system
-- Run in Supabase Dashboard SQL Editor

-- 1. Foundation + custom breaks
CREATE TABLE IF NOT EXISTS recharge_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('energy', 'calm', 'creative', 'fun')),
  duration integer NOT NULL CHECK (duration IN (5, 10, 15, 30)),
  name text NOT NULL,
  emoji text NOT NULL,
  description text,
  is_foundation boolean DEFAULT false,
  is_active boolean DEFAULT true,
  source text NOT NULL CHECK (source IN ('foundation', 'survey', 'parent_added')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recharge_breaks_child ON recharge_breaks(child_id);
CREATE INDEX idx_recharge_breaks_foundation ON recharge_breaks(is_foundation) WHERE is_foundation = true;
CREATE INDEX idx_recharge_breaks_duration ON recharge_breaks(duration);

-- 2. Per-child survey profiles
CREATE TABLE IF NOT EXISTS recharge_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE UNIQUE,
  hype_song text,
  calm_strategy text,
  movement_preference text,
  creative_preference text,
  free_time_choice text,
  favorite_snack text,
  break_style text CHECK (break_style IN ('solo', 'sibling', 'pet', 'any')),
  never_suggest text[] DEFAULT '{}',
  victory_move text,
  custom_break_idea text,
  hidden_breaks uuid[] DEFAULT '{}',
  survey_completed boolean DEFAULT false,
  survey_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Session tracking for analytics
CREATE TABLE IF NOT EXISTS recharge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  break_id uuid NOT NULL REFERENCES recharge_breaks(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  completed boolean DEFAULT false,
  paused_duration integer DEFAULT 0,
  duration_planned integer NOT NULL,
  duration_actual integer,
  context text CHECK (context IN ('homework', 'frustrated', 'celebration', 'low_energy', 'transition', 'manual')),
  rating integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recharge_sessions_child ON recharge_sessions(child_id);
CREATE INDEX idx_recharge_sessions_break ON recharge_sessions(break_id);
CREATE INDEX idx_recharge_sessions_date ON recharge_sessions(started_at);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260302_recharge_menu.sql
git commit -m "feat(recharge): add migration SQL for recharge_breaks, recharge_profiles, recharge_sessions"
```

**Step 3: Run migration in Supabase Dashboard**

Navigate to Supabase Dashboard → SQL Editor → paste and run the migration.
Verify tables exist: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'recharge%';`

### Task 2: Create foundation break seed data

**Files:**
- Create: `supabase/migrations/20260302_recharge_seed.sql`

**Step 1: Write the seed SQL**

All 36 foundation breaks with `child_id = NULL`, `is_foundation = true`, `source = 'foundation'`. Organized by duration and category.

```sql
-- Seed foundation breaks (shared across all kids)
-- Run in Supabase Dashboard SQL Editor after table creation

INSERT INTO recharge_breaks (child_id, category, duration, name, emoji, description, is_foundation, source, sort_order) VALUES
-- === 5 MINUTE - ENERGY ===
(NULL, 'energy', 5, 'Dance Break', '💃', 'Blast your favorite song and go full out. No judgment, just move.', true, 'foundation', 1),
(NULL, 'energy', 5, 'Jaffe Sprint', '🏃', 'Take Jaffe to the yard or hallway and race him. Throw a ball 5 times. Get your heart pumping.', true, 'foundation', 2),
(NULL, 'energy', 5, 'Living Room Gymnastics', '🤸', 'Handstands against the wall, cartwheels, stretches, or whatever your body feels like.', true, 'foundation', 3),
(NULL, 'energy', 5, 'Lip Sync Battle', '🎤', 'Pick a song, grab a hairbrush mic, and perform for an imaginary crowd.', true, 'foundation', 4),
-- === 5 MINUTE - CALM ===
(NULL, 'calm', 5, 'Star Breathing', '🌟', 'Trace a star shape with your finger. Breathe in going up, out going down. Do 5 stars.', true, 'foundation', 5),
(NULL, 'calm', 5, 'Jaffe Cuddle Break', '🐶', 'Find Jaffe. Sit with him. Pet him slowly. Dogs actually lower your stress — science says so.', true, 'foundation', 6),
(NULL, 'calm', 5, 'Plant Check', '🌿', 'Walk around and check on the plants. Water one if it needs it. Tell a plant it''s doing a good job.', true, 'foundation', 7),
(NULL, 'calm', 5, 'Quick Doodle', '🎨', 'Grab paper and draw whatever comes to mind for 5 minutes. No erasing. No rules.', true, 'foundation', 8),
-- === 5 MINUTE - FUN ===
(NULL, 'fun', 5, 'Riddle Challenge', '🧩', 'Ask Family HQ for a riddle. Try to solve it before peeking at the answer.', true, 'foundation', 9),
(NULL, 'fun', 5, 'Joke Swap', '😂', 'Each person tells their best joke. Worst joke wins. Ask Family HQ if you need new material.', true, 'foundation', 10),
(NULL, 'fun', 5, 'Quick Game Round', '📱', 'One round of a favorite quick game. Wordle, a puzzle app, or a card game speed round.', true, 'foundation', 11),

-- === 10 MINUTE - ENERGY ===
(NULL, 'energy', 10, 'Dance Party: Full Set', '🎶', '3 songs, full energy. Make a playlist of your top 3 hype songs and let it rip.', true, 'foundation', 1),
(NULL, 'energy', 10, 'Backyard Challenge', '⚽', 'Shoot hoops, kick a ball, run an obstacle course, or make one up.', true, 'foundation', 2),
(NULL, 'energy', 10, 'Sibling Challenge', '🤼', 'Pick a challenge: who can hold a plank longest, most jumping jacks in a minute, best cartwheel.', true, 'foundation', 3),
-- === 10 MINUTE - CALM ===
(NULL, 'calm', 10, 'Reading Break', '📖', 'Read whatever you want — a book, a comic, a magazine. No screens. Just you and a story.', true, 'foundation', 4),
(NULL, 'calm', 10, 'Art Break', '🎨', 'Draw, color, paint, or build something with craft supplies. Make it for someone else for bonus points.', true, 'foundation', 5),
(NULL, 'calm', 10, 'Garden Walk', '🌺', 'Go outside. Look at the sky. Check on Mom''s garden. Find something cool — a bug, a rock, a cloud.', true, 'foundation', 6),
(NULL, 'calm', 10, 'Chill Playlist', '🎵', 'Put on calming music and just sit or lie down. Close your eyes if you want. Let your brain wander.', true, 'foundation', 7),
-- === 10 MINUTE - CREATIVE ===
(NULL, 'creative', 10, 'Build Something', '🔨', 'LEGOs, blocks, blanket forts, card towers. Build for 10 minutes then take a picture of your creation.', true, 'foundation', 8),
(NULL, 'creative', 10, 'Story Starter', '✍️', 'Ask Family HQ for a random story prompt and write a mini-story. Can be silly, spooky, or totally weird.', true, 'foundation', 9),
-- === 10 MINUTE - FUN ===
(NULL, 'fun', 10, 'Trivia Blast', '🧠', 'Ask Family HQ for 10 trivia questions. See how many you get right. Challenge a sibling to beat your score.', true, 'foundation', 10),

-- === 15 MINUTE - ENERGY ===
(NULL, 'energy', 15, 'Outdoor Adventure', '🚴', 'Bike ride around the block, scooter session, or a walk with Jaffe. Get outside and move.', true, 'foundation', 1),
(NULL, 'energy', 15, 'Talent Show Rehearsal', '🎭', 'Choreograph a dance, practice a routine, or plan a skit. Perform for the family later.', true, 'foundation', 2),
(NULL, 'energy', 15, 'Game Time', '🎲', 'Play a quick board game or card game with a sibling. Uno, Go Fish, or whatever''s fast and fun.', true, 'foundation', 3),
-- === 15 MINUTE - CALM ===
(NULL, 'calm', 15, 'Journal Time', '📓', 'Write about your day, draw what you''re feeling, or make a list of things you''re grateful for.', true, 'foundation', 4),
(NULL, 'calm', 15, 'Snack Creation', '🍳', 'Make yourself a fancy snack. Arrange it on a plate like a restaurant. Bonus points for a sibling.', true, 'foundation', 5),
(NULL, 'fun', 15, 'Photo Scavenger Hunt', '📸', 'Family HQ gives you 5 things to photograph around the house. Race to find and snap them all.', true, 'foundation', 6),
-- === 15 MINUTE - CREATIVE ===
(NULL, 'creative', 15, 'Mini Research', '🔬', 'Pick one question you''re curious about and look it up. Learn something new and share it.', true, 'foundation', 7),
(NULL, 'creative', 15, 'Short Video Learn', '🎥', 'Watch ONE educational video (ask Dad for approved channels). Tell someone one thing you learned.', true, 'foundation', 8),
(NULL, 'creative', 15, 'Teach Jaffe a Trick', '🧱', 'Spend 15 minutes training Jaffe. Sit, shake, roll over, or a new one. Patience and treats required.', true, 'foundation', 9),

-- === 30 MINUTE - ENERGY ===
(NULL, 'energy', 30, 'Big Outdoor Session', '🏞️', 'Extended Jaffe walk, bike ride to somewhere specific, or backyard obstacle course.', true, 'foundation', 1),
(NULL, 'energy', 30, 'Full Production', '🎭', 'Plan and perform a skit, talent show, or dance recital. Costumes encouraged. Jaffe is the judge.', true, 'foundation', 2),
(NULL, 'fun', 30, 'Board Game Tournament', '🎲', 'Full game of a family favorite. Monopoly Deal, Sorry, Clue, or whatever the group agrees on.', true, 'foundation', 3),
-- === 30 MINUTE - CREATIVE ===
(NULL, 'creative', 30, 'Art Project', '🎨', 'Start a real art project — painting, craft, building something. A real creation you''re proud of.', true, 'foundation', 4),
(NULL, 'creative', 30, 'Story Writing', '📝', 'Write a full short story. Illustrate it if you want. Read it to the family at dinner.', true, 'foundation', 5),
(NULL, 'creative', 30, 'Baking Break', '🍳', 'Pick a simple recipe and bake something. Cookies, brownies, or a no-bake treat. Adult supervision as needed.', true, 'foundation', 6),
-- === 30 MINUTE - CALM ===
(NULL, 'calm', 30, 'Movie Snack Break', '🎬', 'Pick a show episode or part of a movie. Make popcorn. Full couch mode with Jaffe.', true, 'foundation', 7),
(NULL, 'calm', 30, 'Room Makeover', '🛍️', 'Rearrange your room, clean and organize your space, or redecorate a corner. Fresh space = fresh brain.', true, 'foundation', 8),
(NULL, 'fun', 30, 'Full Reset Combo', '🧘', 'Mix and match from shorter menus: 10 min outside + 10 min art + 10 min reading. Build your own combo.', true, 'foundation', 9);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260302_recharge_seed.sql
git commit -m "feat(recharge): add seed data for 36 foundation breaks"
```

**Step 3: Run seed in Supabase Dashboard**

Verify: `SELECT duration, category, count(*) FROM recharge_breaks GROUP BY duration, category ORDER BY duration, category;`

Expected: 36 total rows across 4 durations and 4 categories.

### Task 3: Add Supabase helper functions

**Files:**
- Modify: `lib/supabase.ts` (add at end of file, after line ~500)

**Step 1: Add recharge types and data functions**

Add these types and functions to the end of `lib/supabase.ts`:

```typescript
// === RECHARGE MENU ===

export interface RechargeBreak {
  id: string;
  child_id: string | null;
  category: 'energy' | 'calm' | 'creative' | 'fun';
  duration: 5 | 10 | 15 | 30;
  name: string;
  emoji: string;
  description: string | null;
  is_foundation: boolean;
  is_active: boolean;
  source: 'foundation' | 'survey' | 'parent_added';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RechargeProfile {
  id: string;
  child_id: string;
  hype_song: string | null;
  calm_strategy: string | null;
  movement_preference: string | null;
  creative_preference: string | null;
  free_time_choice: string | null;
  favorite_snack: string | null;
  break_style: 'solo' | 'sibling' | 'pet' | 'any' | null;
  never_suggest: string[];
  victory_move: string | null;
  custom_break_idea: string | null;
  hidden_breaks: string[];
  survey_completed: boolean;
  survey_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RechargeSession {
  id: string;
  child_id: string;
  break_id: string;
  started_at: string;
  completed_at: string | null;
  completed: boolean;
  paused_duration: number;
  duration_planned: number;
  duration_actual: number | null;
  context: 'homework' | 'frustrated' | 'celebration' | 'low_energy' | 'transition' | 'manual' | null;
  rating: number | null;
  created_at: string;
}

export async function getRechargeBreaks(childId: string): Promise<RechargeBreak[]> {
  const supabase = getFamilyDataClient();
  const { data, error } = await supabase
    .from('recharge_breaks')
    .select('*')
    .or(`child_id.is.null,child_id.eq.${childId}`)
    .eq('is_active', true)
    .order('duration')
    .order('sort_order');

  if (error) {
    console.error('[Recharge] Error fetching breaks:', error);
    return [];
  }
  return data || [];
}

export async function getRechargeProfile(childId: string): Promise<RechargeProfile | null> {
  const supabase = getFamilyDataClient();
  const { data, error } = await supabase
    .from('recharge_profiles')
    .select('*')
    .eq('child_id', childId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Recharge] Error fetching profile:', error);
  }
  return data || null;
}

export async function createRechargeSession(session: {
  child_id: string;
  break_id: string;
  duration_planned: number;
  context?: string;
}): Promise<RechargeSession | null> {
  const supabase = getFamilyDataClient();
  const { data, error } = await supabase
    .from('recharge_sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    console.error('[Recharge] Error creating session:', error);
    return null;
  }
  return data;
}

export async function completeRechargeSession(
  sessionId: string,
  updates: { completed: boolean; duration_actual: number; paused_duration?: number; rating?: number }
): Promise<boolean> {
  const supabase = getFamilyDataClient();
  const { error } = await supabase
    .from('recharge_sessions')
    .update({
      ...updates,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[Recharge] Error completing session:', error);
    return false;
  }
  return true;
}

export async function getKidMembers(): Promise<FamilyMember[]> {
  const supabase = getFamilyDataClient();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('role', 'kid')
    .order('name');

  if (error) {
    console.error('[Recharge] Error fetching kid members:', error);
    return [];
  }
  return data || [];
}
```

**Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat(recharge): add Supabase types and data functions for recharge menu"
```

---

## Phase 2: Core Kiosk Flow

### Task 4: Create recharge API routes

**Files:**
- Create: `app/api/recharge/breaks/route.ts`
- Create: `app/api/recharge/sessions/route.ts`

**Step 1: Create breaks API**

```typescript
// app/api/recharge/breaks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRechargeBreaks, getRechargeProfile, getFamilyDataClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    const [breaks, profile] = await Promise.all([
      getRechargeBreaks(childId),
      getRechargeProfile(childId),
    ]);

    // Filter out hidden breaks
    const hiddenSet = new Set(profile?.hidden_breaks || []);
    const visibleBreaks = breaks.filter((b) => !hiddenSet.has(b.id));

    return NextResponse.json({ breaks: visibleBreaks, profile });
  } catch (error) {
    console.error("[Recharge API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch breaks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { child_id, category, duration, name, emoji, description } = body;

    if (!child_id || !category || !duration || !name || !emoji) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getFamilyDataClient();
    const { data, error } = await supabase
      .from("recharge_breaks")
      .insert({
        child_id,
        category,
        duration,
        name,
        emoji,
        description: description || null,
        is_foundation: false,
        source: "parent_added",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ break: data });
  } catch (error) {
    console.error("[Recharge API] Error creating break:", error);
    return NextResponse.json({ error: "Failed to create break" }, { status: 500 });
  }
}
```

**Step 2: Create sessions API**

```typescript
// app/api/recharge/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRechargeSession, completeRechargeSession } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { child_id, break_id, duration_planned, context } = body;

    if (!child_id || !break_id || !duration_planned) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await createRechargeSession({
      child_id,
      break_id,
      duration_planned,
      context: context || "manual",
    });

    if (!session) throw new Error("Failed to create session");
    return NextResponse.json({ session });
  } catch (error) {
    console.error("[Recharge Sessions API] Error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, completed, duration_actual, paused_duration, rating } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const success = await completeRechargeSession(sessionId, {
      completed: completed ?? false,
      duration_actual,
      paused_duration,
      rating,
    });

    if (!success) throw new Error("Failed to update session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Recharge Sessions API] Error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/recharge/breaks/route.ts app/api/recharge/sessions/route.ts
git commit -m "feat(recharge): add API routes for breaks and sessions"
```

### Task 5: Create recharge constants and types

**Files:**
- Create: `components/recharge/constants.ts`

**Step 1: Write constants file**

```typescript
// components/recharge/constants.ts

export const CATEGORY_CONFIG = {
  energy: {
    label: "Energy",
    gradient: "from-rose-50 to-rose-100",
    accent: "from-rose-400 to-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    pill: "bg-rose-100 text-rose-700",
    icon: "🔥",
  },
  calm: {
    label: "Calm",
    gradient: "from-sky-50 to-sky-100",
    accent: "from-sky-400 to-sky-500",
    text: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    pill: "bg-sky-100 text-sky-700",
    icon: "🌊",
  },
  creative: {
    label: "Creative",
    gradient: "from-amber-50 to-amber-100",
    accent: "from-amber-400 to-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    pill: "bg-amber-100 text-amber-700",
    icon: "✨",
  },
  fun: {
    label: "Fun",
    gradient: "from-violet-50 to-violet-100",
    accent: "from-violet-400 to-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    pill: "bg-violet-100 text-violet-700",
    icon: "🎮",
  },
} as const;

export type RechargeCategory = keyof typeof CATEGORY_CONFIG;

export const DURATIONS = [5, 10, 15, 30] as const;
export type RechargeDuration = (typeof DURATIONS)[number];

export const DURATION_LABELS: Record<RechargeDuration, string> = {
  5: "5 min",
  10: "10 min",
  15: "15 min",
  30: "30 min",
};

export const DURATION_DESCRIPTIONS: Record<RechargeDuration, string> = {
  5: "Quick Reset",
  10: "Real Reset",
  15: "Bigger Break",
  30: "Full Reset",
};

export const ENCOURAGEMENT_MESSAGES = [
  "You're doing great! 🌟",
  "Your brain is recharging! 🔋",
  "Almost there! Keep going! 💪",
  "You're halfway there! 🎯",
  "Great job taking a break! ✨",
  "Your brain says thank you! 🧠",
  "Recharging in progress... ⚡",
  "You earned this break! 🏆",
  "Breathe and enjoy! 🌈",
  "Do First, Grumble Later! 😄",
];

export const CELEBRATION_MESSAGES = [
  "Ready to get back to it! 💪",
  "You're recharged! 🔋",
  "Brain battery: FULL! ⚡",
  "Let's do this! 🚀",
  "Feeling fresh! ✨",
];
```

**Step 2: Commit**

```bash
git add components/recharge/constants.ts
git commit -m "feat(recharge): add category config, duration labels, and message constants"
```

### Task 6: Create AvatarPicker component

**Files:**
- Create: `components/recharge/AvatarPicker.tsx`

**Step 1: Write the avatar picker**

Uses the existing `Avatar` component with the same `2xl` size as the kiosk checklist (line 383 of `app/kiosk/page.tsx`).

```typescript
// components/recharge/AvatarPicker.tsx
"use client";

import { Avatar } from "@/components/Avatar";

interface KidMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface AvatarPickerProps {
  kids: KidMember[];
  onSelect: (kid: KidMember) => void;
}

export function AvatarPicker({ kids, onSelect }: AvatarPickerProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div>
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          Who&apos;s Recharging?
        </h2>
        <p className="text-slate-500 text-center mt-2">Tap your face to get started</p>
      </div>
      <div className="flex gap-8 justify-center flex-wrap">
        {kids.map((kid) => (
          <button
            key={kid.id}
            onClick={() => onSelect(kid)}
            className="flex flex-col items-center gap-3 group cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <div className="rounded-full ring-4 ring-transparent group-hover:ring-purple-300 transition-all">
              <Avatar
                member={{ name: kid.name, role: kid.role, avatar_url: kid.avatar_url }}
                size="3xl"
                className="shadow-xl"
              />
            </div>
            <span className="text-xl font-bold text-slate-700 group-hover:text-purple-600 transition-colors">
              {kid.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/AvatarPicker.tsx
git commit -m "feat(recharge): add AvatarPicker component for kid selection"
```

### Task 7: Create DurationPicker component

**Files:**
- Create: `components/recharge/DurationPicker.tsx`

**Step 1: Write the duration picker**

```typescript
// components/recharge/DurationPicker.tsx
"use client";

import { Shuffle } from "lucide-react";
import { DURATIONS, DURATION_LABELS, DURATION_DESCRIPTIONS, type RechargeDuration } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

interface DurationPickerProps {
  breaks: RechargeBreak[];
  onSelect: (duration: RechargeDuration) => void;
  onSurprise: () => void;
  onBack: () => void;
  kidName: string;
}

export function DurationPicker({ breaks, onSelect, onSurprise, onBack, kidName }: DurationPickerProps) {
  const countByDuration = (d: number) => breaks.filter((b) => b.duration === d).length;

  return (
    <div className="flex flex-col items-center gap-8">
      <div>
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          How much time, {kidName}?
        </h2>
        <p className="text-slate-500 text-center mt-2">Pick your break length</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-300 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[120px] cursor-pointer"
          >
            <span className="text-3xl font-black text-slate-800">{DURATION_LABELS[d]}</span>
            <span className="text-sm text-slate-500">{DURATION_DESCRIPTIONS[d]}</span>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {countByDuration(d)} breaks
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={onSurprise}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer min-h-[60px]"
      >
        <Shuffle className="h-6 w-6" />
        Surprise Me!
      </button>

      <button
        onClick={onBack}
        className="text-slate-400 hover:text-slate-600 font-medium transition-colors min-h-[48px] min-w-[48px]"
      >
        ← Back
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/DurationPicker.tsx
git commit -m "feat(recharge): add DurationPicker with break counts and Surprise Me"
```

### Task 8: Create BreakCard and BreakGrid components

**Files:**
- Create: `components/recharge/BreakCard.tsx`
- Create: `components/recharge/BreakGrid.tsx`

**Step 1: Write BreakCard**

```typescript
// components/recharge/BreakCard.tsx
"use client";

import { CATEGORY_CONFIG, type RechargeCategory } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

interface BreakCardProps {
  breakItem: RechargeBreak;
  onSelect: (breakItem: RechargeBreak) => void;
}

export function BreakCard({ breakItem, onSelect }: BreakCardProps) {
  const config = CATEGORY_CONFIG[breakItem.category as RechargeCategory];

  return (
    <button
      onClick={() => onSelect(breakItem)}
      className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${config.border} ${config.bg} hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left min-h-[80px] w-full`}
    >
      <span className="text-4xl flex-shrink-0">{breakItem.emoji}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-lg">{breakItem.name}</h3>
        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{breakItem.description}</p>
      </div>
    </button>
  );
}
```

**Step 2: Write BreakGrid**

```typescript
// components/recharge/BreakGrid.tsx
"use client";

import { BreakCard } from "./BreakCard";
import { CATEGORY_CONFIG, DURATION_LABELS, type RechargeCategory, type RechargeDuration } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

interface BreakGridProps {
  breaks: RechargeBreak[];
  duration: RechargeDuration;
  onSelect: (breakItem: RechargeBreak) => void;
  onBack: () => void;
  kidName: string;
}

export function BreakGrid({ breaks, duration, onSelect, onBack, kidName }: BreakGridProps) {
  const filtered = breaks.filter((b) => b.duration === duration);
  const categories = Object.keys(CATEGORY_CONFIG) as RechargeCategory[];

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          {DURATION_LABELS[duration]} Breaks
        </h2>
        <p className="text-slate-500 text-center mt-2">Pick your vibe, {kidName}</p>
      </div>

      {categories.map((cat) => {
        const catBreaks = filtered.filter((b) => b.category === cat);
        if (catBreaks.length === 0) return null;
        const config = CATEGORY_CONFIG[cat];

        return (
          <div key={cat}>
            <div className={`flex items-center gap-2 mb-3 px-1`}>
              <span className="text-xl">{config.icon}</span>
              <h3 className={`font-bold text-lg ${config.text}`}>{config.label}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.pill}`}>
                {catBreaks.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catBreaks.map((b) => (
                <BreakCard key={b.id} breakItem={b} onSelect={onSelect} />
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={onBack}
        className="text-slate-400 hover:text-slate-600 font-medium transition-colors min-h-[48px] self-center"
      >
        ← Change Duration
      </button>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/recharge/BreakCard.tsx components/recharge/BreakGrid.tsx
git commit -m "feat(recharge): add BreakCard and BreakGrid with category sections"
```

### Task 9: Create BreakDetail component

**Files:**
- Create: `components/recharge/BreakDetail.tsx`

**Step 1: Write the break detail + start screen**

```typescript
// components/recharge/BreakDetail.tsx
"use client";

import { Play, ArrowLeft } from "lucide-react";
import { CATEGORY_CONFIG, DURATION_LABELS, type RechargeCategory, type RechargeDuration } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

interface BreakDetailProps {
  breakItem: RechargeBreak;
  onStart: (breakItem: RechargeBreak) => void;
  onBack: () => void;
}

export function BreakDetail({ breakItem, onStart, onBack }: BreakDetailProps) {
  const config = CATEGORY_CONFIG[breakItem.category as RechargeCategory];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      <button
        onClick={onBack}
        className="self-start text-slate-400 hover:text-slate-600 font-medium transition-colors min-h-[48px] flex items-center gap-2"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className={`w-full rounded-3xl p-8 ${config.bg} border-2 ${config.border} text-center`}>
        <span className="text-7xl block mb-4">{breakItem.emoji}</span>
        <h2 className="text-3xl font-black text-slate-800 mb-2">{breakItem.name}</h2>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${config.pill}`}>
            {config.label}
          </span>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            {DURATION_LABELS[breakItem.duration as RechargeDuration]}
          </span>
        </div>
        <p className="text-slate-600 text-lg leading-relaxed mb-8">{breakItem.description}</p>

        <button
          onClick={() => onStart(breakItem)}
          className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-2xl shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer min-h-[72px]"
        >
          <Play className="h-8 w-8" fill="white" />
          START
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/BreakDetail.tsx
git commit -m "feat(recharge): add BreakDetail with category styling and START button"
```

### Task 10: Create RechargeMenu orchestrator component

**Files:**
- Create: `components/recharge/RechargeMenu.tsx`
- Create: `components/recharge/index.ts`

**Step 1: Write the main orchestrator**

This component manages the flow: avatar picker → duration → grid → detail → start timer. It accepts optional `childId` and `childName` props to skip the avatar picker when mounted from a kid profile.

```typescript
// components/recharge/RechargeMenu.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { AvatarPicker } from "./AvatarPicker";
import { DurationPicker } from "./DurationPicker";
import { BreakGrid } from "./BreakGrid";
import { BreakDetail } from "./BreakDetail";
import { DURATIONS, type RechargeDuration } from "./constants";
import type { RechargeBreak } from "@/lib/supabase";

type Step = "avatar" | "duration" | "grid" | "detail";

interface KidMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface RechargeMenuProps {
  childId?: string;
  childName?: string;
}

export function RechargeMenu({ childId: propChildId, childName: propChildName }: RechargeMenuProps) {
  const [step, setStep] = useState<Step>(propChildId ? "duration" : "avatar");
  const [kids, setKids] = useState<KidMember[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidMember | null>(
    propChildId && propChildName
      ? { id: propChildId, name: propChildName, role: "kid", avatar_url: null }
      : null
  );
  const [breaks, setBreaks] = useState<RechargeBreak[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<RechargeDuration | null>(null);
  const [selectedBreak, setSelectedBreak] = useState<RechargeBreak | null>(null);
  const [loading, setLoading] = useState(true);

  // Load kids list (only if no childId prop)
  useEffect(() => {
    if (propChildId) {
      setLoading(false);
      return;
    }
    async function loadKids() {
      try {
        const res = await fetch("/api/checklist");
        if (res.ok) {
          const data = await res.json();
          const kidMembers = (data.members || []).filter(
            (m: KidMember) => m.role === "kid"
          );
          setKids(kidMembers);
        }
      } catch (error) {
        console.error("Error loading kids:", error);
      }
      setLoading(false);
    }
    loadKids();
  }, [propChildId]);

  // Load breaks when kid is selected
  const loadBreaks = useCallback(async (kidId: string) => {
    try {
      const res = await fetch(`/api/recharge/breaks?childId=${kidId}`);
      if (res.ok) {
        const data = await res.json();
        setBreaks(data.breaks || []);
      }
    } catch (error) {
      console.error("Error loading breaks:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedKid?.id) {
      loadBreaks(selectedKid.id);
    }
  }, [selectedKid?.id, loadBreaks]);

  // Also load breaks on mount if childId prop provided
  useEffect(() => {
    if (propChildId) {
      loadBreaks(propChildId);
    }
  }, [propChildId, loadBreaks]);

  const handleSelectKid = (kid: KidMember) => {
    setSelectedKid(kid);
    setStep("duration");
  };

  const handleSelectDuration = (d: RechargeDuration) => {
    setSelectedDuration(d);
    setStep("grid");
  };

  const handleSurprise = () => {
    if (breaks.length === 0) return;
    const randomBreak = breaks[Math.floor(Math.random() * breaks.length)];
    setSelectedBreak(randomBreak);
    setSelectedDuration(randomBreak.duration as RechargeDuration);
    setStep("detail");
  };

  const handleSelectBreak = (b: RechargeBreak) => {
    setSelectedBreak(b);
    setStep("detail");
  };

  const handleStartBreak = async (b: RechargeBreak) => {
    if (!selectedKid) return;

    // Start a session
    try {
      const res = await fetch("/api/recharge/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: selectedKid.id,
          break_id: b.id,
          duration_planned: b.duration,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Dispatch event for timer context to pick up
        window.dispatchEvent(
          new CustomEvent("recharge:start", {
            detail: {
              sessionId: data.session.id,
              childId: selectedKid.id,
              childName: selectedKid.name.split(" ")[0],
              childAvatar: selectedKid.avatar_url,
              breakId: b.id,
              breakName: b.name,
              breakEmoji: b.emoji,
              durationSeconds: b.duration * 60,
            },
          })
        );
      }
    } catch (error) {
      console.error("Error starting session:", error);
    }

    // Reset menu to duration picker for next kid
    setSelectedBreak(null);
    setSelectedDuration(null);
    setStep(propChildId ? "duration" : "avatar");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-4">
      {step === "avatar" && (
        <AvatarPicker kids={kids} onSelect={handleSelectKid} />
      )}
      {step === "duration" && selectedKid && (
        <DurationPicker
          breaks={breaks}
          onSelect={handleSelectDuration}
          onSurprise={handleSurprise}
          onBack={() => propChildId ? undefined : setStep("avatar")}
          kidName={selectedKid.name.split(" ")[0]}
        />
      )}
      {step === "grid" && selectedKid && selectedDuration && (
        <BreakGrid
          breaks={breaks}
          duration={selectedDuration}
          onSelect={handleSelectBreak}
          onBack={() => setStep("duration")}
          kidName={selectedKid.name.split(" ")[0]}
        />
      )}
      {step === "detail" && selectedBreak && (
        <BreakDetail
          breakItem={selectedBreak}
          onStart={handleStartBreak}
          onBack={() => setStep("grid")}
        />
      )}
    </div>
  );
}
```

**Step 2: Write index export**

```typescript
// components/recharge/index.ts
export { RechargeMenu } from "./RechargeMenu";
```

**Step 3: Commit**

```bash
git add components/recharge/RechargeMenu.tsx components/recharge/index.ts
git commit -m "feat(recharge): add RechargeMenu orchestrator component with full flow"
```

### Task 11: Mount RechargeMenu on kiosk page

**Files:**
- Modify: `app/kiosk/page.tsx`

**Step 1: Add recharge state and button**

Add import at top (after line 12):
```typescript
import { Battery } from "lucide-react";
import { RechargeMenu } from "@/components/recharge";
```

Add state in the component (after line 72):
```typescript
const [showRecharge, setShowRecharge] = useState(false);
```

Add Recharge Menu button in the header controls area (after the refresh button, after line 332, before closing `</div>`):
```typescript
<Button
  onClick={() => setShowRecharge(!showRecharge)}
  className={`min-h-[48px] ${
    showRecharge
      ? "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0"
      : ""
  }`}
  variant={showRecharge ? "default" : "outline"}
>
  <Battery className="h-5 w-5 mr-2" />
  Recharge
</Button>
```

Add RechargeMenu render section (after the "All Complete Message" card, after line 352, before the members grid):
```typescript
{showRecharge && (
  <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
    <RechargeMenu />
  </Card>
)}
```

**Step 2: Verify the kiosk page renders correctly**

```bash
cd ~/Developer/active/family-hq-chat && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add app/kiosk/page.tsx
git commit -m "feat(recharge): mount RechargeMenu on kiosk page with toggle button"
```

---

## Phase 3: Timer System

### Task 12: Create RechargeTimerContext

**Files:**
- Create: `components/recharge/RechargeTimerContext.tsx`

**Step 1: Write the context provider**

Manages up to 3 concurrent timers. Listens for `recharge:start` custom events. Provides timer state + controls (pause, resume, end) to floating pills.

```typescript
// components/recharge/RechargeTimerContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export interface ActiveTimer {
  sessionId: string;
  childId: string;
  childName: string;
  childAvatar: string | null;
  breakId: string;
  breakName: string;
  breakEmoji: string;
  totalSeconds: number;
  remainingSeconds: number;
  pausedDuration: number;
  status: "running" | "paused" | "complete";
}

interface TimerContextValue {
  timers: ActiveTimer[];
  pauseTimer: (sessionId: string) => void;
  resumeTimer: (sessionId: string) => void;
  endTimer: (sessionId: string, rating?: number) => void;
  expandedTimer: string | null;
  setExpandedTimer: (sessionId: string | null) => void;
}

const TimerContext = createContext<TimerContextValue>({
  timers: [],
  pauseTimer: () => {},
  resumeTimer: () => {},
  endTimer: () => {},
  expandedTimer: null,
  setExpandedTimer: () => {},
});

export function useRechargeTimers() {
  return useContext(TimerContext);
}

export function RechargeTimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [expandedTimer, setExpandedTimer] = useState<string | null>(null);
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Listen for start events from RechargeMenu
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { sessionId, childId, childName, childAvatar, breakId, breakName, breakEmoji, durationSeconds } = e.detail;

      // Don't allow duplicate timers for same child
      setTimers((prev) => {
        const existing = prev.find((t) => t.childId === childId && t.status !== "complete");
        if (existing) return prev;
        return [
          ...prev,
          {
            sessionId,
            childId,
            childName,
            childAvatar,
            breakId,
            breakName,
            breakEmoji,
            totalSeconds: durationSeconds,
            remainingSeconds: durationSeconds,
            pausedDuration: 0,
            status: "running" as const,
          },
        ];
      });
    };

    window.addEventListener("recharge:start", handler as EventListener);
    return () => window.removeEventListener("recharge:start", handler as EventListener);
  }, []);

  // Tick running timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (t.status !== "running") return t;
          const next = t.remainingSeconds - 1;
          if (next <= 0) {
            return { ...t, remainingSeconds: 0, status: "complete" as const };
          }
          return { ...t, remainingSeconds: next };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-expand timer when it completes
  useEffect(() => {
    const justCompleted = timers.find((t) => t.status === "complete" && t.remainingSeconds === 0);
    if (justCompleted && !expandedTimer) {
      setExpandedTimer(justCompleted.sessionId);
    }
  }, [timers, expandedTimer]);

  const pauseTimer = useCallback((sessionId: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.sessionId === sessionId ? { ...t, status: "paused" as const } : t))
    );
  }, []);

  const resumeTimer = useCallback((sessionId: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.sessionId === sessionId ? { ...t, status: "running" as const } : t))
    );
  }, []);

  const endTimer = useCallback(async (sessionId: string, rating?: number) => {
    const timer = timers.find((t) => t.sessionId === sessionId);
    if (!timer) return;

    const durationActual = timer.totalSeconds - timer.remainingSeconds;

    // Complete session via API
    try {
      await fetch("/api/recharge/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          completed: timer.status === "complete",
          duration_actual: durationActual,
          paused_duration: timer.pausedDuration,
          rating,
        }),
      });
    } catch (error) {
      console.error("Error completing session:", error);
    }

    // Remove timer
    setTimers((prev) => prev.filter((t) => t.sessionId !== sessionId));
    if (expandedTimer === sessionId) {
      setExpandedTimer(null);
    }
  }, [timers, expandedTimer]);

  return (
    <TimerContext.Provider value={{ timers, pauseTimer, resumeTimer, endTimer, expandedTimer, setExpandedTimer }}>
      {children}
    </TimerContext.Provider>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/RechargeTimerContext.tsx
git commit -m "feat(recharge): add RechargeTimerContext with concurrent timer support"
```

### Task 13: Create TimerPill component

**Files:**
- Create: `components/recharge/TimerPill.tsx`

**Step 1: Write the floating pill**

```typescript
// components/recharge/TimerPill.tsx
"use client";

import { Pause, Play, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useRechargeTimers, type ActiveTimer } from "./RechargeTimerContext";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TimerPillProps {
  timer: ActiveTimer;
}

export function TimerPill({ timer }: TimerPillProps) {
  const { pauseTimer, resumeTimer, endTimer, setExpandedTimer } = useRechargeTimers();
  const progress = ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100;

  const isComplete = timer.status === "complete";
  const isPaused = timer.status === "paused";

  return (
    <button
      onClick={() => setExpandedTimer(timer.sessionId)}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border-2 backdrop-blur-sm transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer min-h-[56px] ${
        isComplete
          ? "bg-green-50/95 border-green-300 animate-bounce-in"
          : isPaused
          ? "bg-amber-50/95 border-amber-300"
          : "bg-white/95 border-purple-200"
      }`}
    >
      <Avatar
        member={{ name: timer.childName, role: "kid", avatar_url: timer.childAvatar }}
        size="sm"
      />
      <span className="text-2xl">{timer.breakEmoji}</span>
      <span className={`font-bold text-lg tabular-nums ${isComplete ? "text-green-600" : "text-slate-800"}`}>
        {isComplete ? "Done!" : formatTime(timer.remainingSeconds)}
      </span>

      {/* Mini progress bar */}
      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-purple-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Quick controls */}
      {!isComplete && (
        <div className="flex gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
          {isPaused ? (
            <button
              onClick={() => resumeTimer(timer.sessionId)}
              className="p-2 rounded-full hover:bg-purple-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Play className="h-4 w-4 text-purple-600" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => pauseTimer(timer.sessionId)}
              className="p-2 rounded-full hover:bg-amber-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Pause className="h-4 w-4 text-amber-600" />
            </button>
          )}
          <button
            onClick={() => endTimer(timer.sessionId)}
            className="p-2 rounded-full hover:bg-red-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      )}
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/TimerPill.tsx
git commit -m "feat(recharge): add floating TimerPill with progress bar and quick controls"
```

### Task 14: Create TimerFullScreen component

**Files:**
- Create: `components/recharge/TimerFullScreen.tsx`

**Step 1: Write the full-screen expanded timer**

```typescript
// components/recharge/TimerFullScreen.tsx
"use client";

import { useState, useEffect } from "react";
import { Pause, Play, X, Minimize2, Star } from "lucide-react";
import confetti from "canvas-confetti";
import { useRechargeTimers, type ActiveTimer } from "./RechargeTimerContext";
import { ENCOURAGEMENT_MESSAGES, CELEBRATION_MESSAGES } from "./constants";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TimerFullScreenProps {
  timer: ActiveTimer;
}

export function TimerFullScreen({ timer }: TimerFullScreenProps) {
  const { pauseTimer, resumeTimer, endTimer, setExpandedTimer } = useRechargeTimers();
  const [messageIndex, setMessageIndex] = useState(0);
  const [celebrationFired, setCelebrationFired] = useState(false);
  const [rating, setRating] = useState<number>(0);

  const progress = ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100;
  const isComplete = timer.status === "complete";
  const isPaused = timer.status === "paused";

  // Rotate encouragement messages
  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % ENCOURAGEMENT_MESSAGES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isComplete]);

  // Fire confetti on completion
  useEffect(() => {
    if (isComplete && !celebrationFired) {
      setCelebrationFired(true);
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#8b5cf6", "#ec4899", "#f59e0b"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#8b5cf6", "#ec4899", "#f59e0b"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isComplete, celebrationFired]);

  const handleDone = () => {
    endTimer(timer.sessionId, rating || undefined);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 to-violet-900/95 z-[90] flex flex-col items-center justify-center px-6">
      {/* Minimize button */}
      <button
        onClick={() => setExpandedTimer(null)}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
      >
        <Minimize2 className="h-6 w-6 text-white" />
      </button>

      {/* Break info */}
      <span className="text-6xl mb-4">{timer.breakEmoji}</span>
      <h2 className="text-2xl font-bold text-white mb-2">{timer.breakName}</h2>
      <p className="text-purple-200 mb-8">{timer.childName}&apos;s break</p>

      {isComplete ? (
        /* Celebration state */
        <div className="flex flex-col items-center gap-6">
          <div className="text-5xl font-black text-green-400 animate-bounce-in">
            {CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]}
          </div>

          {/* Star rating */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <p className="text-purple-200 text-lg">How was that break?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2 transition-all hover:scale-110 active:scale-90 min-h-[56px] min-w-[56px] flex items-center justify-center"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDone}
            className="mt-6 px-10 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all min-h-[60px]"
          >
            Done
          </button>
        </div>
      ) : (
        /* Active timer state */
        <>
          {/* Countdown */}
          <div className="text-8xl font-black text-white tabular-nums mb-6">
            {formatTime(timer.remainingSeconds)}
          </div>

          {/* Progress ring (SVG) */}
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={isPaused ? "#f59e0b" : "#a78bfa"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/60 text-lg font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Encouragement message */}
          <p className="text-purple-200 text-xl mb-8 h-8 transition-opacity">
            {isPaused ? "⏸️ Paused" : ENCOURAGEMENT_MESSAGES[messageIndex]}
          </p>

          {/* Controls */}
          <div className="flex gap-4">
            {isPaused ? (
              <button
                onClick={() => resumeTimer(timer.sessionId)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-purple-500 text-white font-bold text-lg hover:bg-purple-400 transition-all min-h-[60px]"
              >
                <Play className="h-6 w-6" fill="white" />
                Resume
              </button>
            ) : (
              <button
                onClick={() => pauseTimer(timer.sessionId)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all min-h-[60px]"
              >
                <Pause className="h-6 w-6" />
                Pause
              </button>
            )}
            <button
              onClick={() => endTimer(timer.sessionId)}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-white/50 hover:text-white/80 font-medium transition-all min-h-[60px]"
            >
              <X className="h-5 w-5" />
              End Early
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/TimerFullScreen.tsx
git commit -m "feat(recharge): add full-screen timer with progress ring, confetti, and star rating"
```

### Task 15: Create TimerOverlay (pill container) and wire into layout

**Files:**
- Create: `components/recharge/TimerOverlay.tsx`
- Modify: `app/layout.tsx` (wrap with provider, add overlay)

**Step 1: Write TimerOverlay**

```typescript
// components/recharge/TimerOverlay.tsx
"use client";

import { useRechargeTimers } from "./RechargeTimerContext";
import { TimerPill } from "./TimerPill";
import { TimerFullScreen } from "./TimerFullScreen";

export function TimerOverlay() {
  const { timers, expandedTimer } = useRechargeTimers();

  const activeTimers = timers.filter((t) => t.status !== "complete" || t.remainingSeconds === 0);
  const expanded = timers.find((t) => t.sessionId === expandedTimer);

  if (activeTimers.length === 0) return null;

  return (
    <>
      {/* Floating pills - top right */}
      <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2">
        {activeTimers.map((timer) => (
          <TimerPill key={timer.sessionId} timer={timer} />
        ))}
      </div>

      {/* Full-screen expanded view */}
      {expanded && <TimerFullScreen timer={expanded} />}
    </>
  );
}
```

**Step 2: Wire into app layout**

Modify `app/layout.tsx`. Add imports and wrap with provider:

Add import after line 7:
```typescript
import { RechargeTimerProvider } from "@/components/recharge/RechargeTimerContext";
import { TimerOverlay } from "@/components/recharge/TimerOverlay";
```

Replace lines 43-47 with:
```typescript
        <UserProvider>
          <KioskProvider>
            <RechargeTimerProvider>
              <NavigationWrapper>{children}</NavigationWrapper>
              <TimerOverlay />
              <Toaster position="top-center" richColors />
            </RechargeTimerProvider>
          </KioskProvider>
        </UserProvider>
```

**Step 3: Build and verify**

```bash
cd ~/Developer/active/family-hq-chat && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/recharge/TimerOverlay.tsx app/layout.tsx
git commit -m "feat(recharge): add TimerOverlay with floating pills and wire into app layout"
```

---

## Phase 4: Kid Profile Integration

### Task 16: Add Recharge section to KidProfileDashboard

**Files:**
- Modify: `components/kid-profile/KidProfileDashboard.tsx`

**Step 1: Add RechargeMenu to the kid profile**

Add import after line 9:
```typescript
import { RechargeMenu } from '@/components/recharge';
import { Battery } from 'lucide-react';
import { Card } from '@/components/ui/card';
```

Add state for showing recharge (after line 26):
```typescript
const [showRecharge, setShowRecharge] = useState(false);
```

Add Recharge card after the 2x2 grid (after the closing `</div>` on line 47, before KidTodosCard):
```typescript
      {/* Recharge Menu */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowRecharge(!showRecharge)}
          className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors min-h-[56px] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100">
              <Battery className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800">Recharge Menu</h3>
              <p className="text-sm text-slate-500">Take a brain break</p>
            </div>
          </div>
          <span className="text-2xl">{showRecharge ? '🔽' : '⚡'}</span>
        </button>
        {showRecharge && (
          <div className="border-t">
            <RechargeMenu childId={memberId} childName={firstName} />
          </div>
        )}
      </Card>
```

**Step 2: Build and verify**

```bash
cd ~/Developer/active/family-hq-chat && npm run build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add components/kid-profile/KidProfileDashboard.tsx
git commit -m "feat(recharge): mount RechargeMenu in kid profile dashboard"
```

---

## Phase 5: Personalization Survey + Parent Management

### Task 17: Create recharge profile API route

**Files:**
- Create: `app/api/recharge/profiles/route.ts`

**Step 1: Write profile CRUD API**

```typescript
// app/api/recharge/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient, getRechargeProfile } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    const profile = await getRechargeProfile(childId);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Recharge Profiles API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, ...fields } = body;

    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    const supabase = getFamilyDataClient();
    const { data, error } = await supabase
      .from("recharge_profiles")
      .upsert(
        {
          child_id: childId,
          ...fields,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "child_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("[Recharge Profiles API] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/recharge/profiles/route.ts
git commit -m "feat(recharge): add profiles API route for survey data"
```

### Task 18: Create break management API route

**Files:**
- Create: `app/api/recharge/breaks/[id]/route.ts`

**Step 1: Write PATCH/DELETE for individual breaks**

```typescript
// app/api/recharge/breaks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getFamilyDataClient();

    const { data, error } = await supabase
      .from("recharge_breaks")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ break: data });
  } catch (error) {
    console.error("[Recharge Break API] Error:", error);
    return NextResponse.json({ error: "Failed to update break" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getFamilyDataClient();

    // Don't allow deleting foundation breaks — just deactivate
    const { data: existing } = await supabase
      .from("recharge_breaks")
      .select("is_foundation")
      .eq("id", id)
      .single();

    if (existing?.is_foundation) {
      return NextResponse.json({ error: "Cannot delete foundation breaks. Deactivate instead." }, { status: 400 });
    }

    const { error } = await supabase.from("recharge_breaks").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Recharge Break API] Error:", error);
    return NextResponse.json({ error: "Failed to delete break" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/recharge/breaks/[id]/route.ts
git commit -m "feat(recharge): add individual break PATCH/DELETE API route"
```

### Task 19: Create PersonalizationSurvey component

**Files:**
- Create: `components/recharge/PersonalizationSurvey.tsx`

**Step 1: Write the 10-question survey**

This is a parent-assisted, computer-based flow (not kiosk). One question at a time with large, friendly UI.

```typescript
// components/recharge/PersonalizationSurvey.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

const QUESTIONS = [
  { key: "hype_song", emoji: "🎵", question: "What's your go-to hype song?", placeholder: "The one that makes you want to dance every time", type: "text" as const },
  { key: "calm_strategy", emoji: "💆", question: "When you're upset, what helps you feel better?", placeholder: "Alone time, hugging Jaffe, talking to someone, going outside?", type: "text" as const },
  { key: "movement_preference", emoji: "🏃", question: "What's your favorite way to move your body?", placeholder: "Dance, gymnastics, running, riding, sports?", type: "text" as const },
  { key: "creative_preference", emoji: "🎨", question: "What's your favorite creative thing?", placeholder: "Drawing, building, writing, making music, crafts?", type: "text" as const },
  { key: "free_time_choice", emoji: "⏰", question: "If you had 10 free minutes right now, what would you do?", placeholder: "Anything at all!", type: "text" as const },
  { key: "favorite_snack", emoji: "🍪", question: "What's a snack that always makes you smile?", placeholder: "Your favorite treat", type: "text" as const },
  { key: "break_style", emoji: "👥", question: "Do you like doing breaks alone, with a sibling, or with Jaffe?", placeholder: "", type: "choice" as const, choices: [
    { value: "solo", label: "Solo 🎧" },
    { value: "sibling", label: "With a sibling 👯" },
    { value: "pet", label: "With Jaffe 🐕" },
    { value: "any", label: "Any of these! 🌟" },
  ]},
  { key: "never_suggest", emoji: "🚫", question: "What's something you'd NEVER want as a break suggestion?", placeholder: "We'll make sure to never suggest this", type: "text" as const },
  { key: "victory_move", emoji: "🏆", question: "When you're celebrating, what's your victory move?", placeholder: "Dance, fist pump, tell everyone, happy scream?", type: "text" as const },
  { key: "custom_break_idea", emoji: "💡", question: "If you could add any break to the menu, what would it be?", placeholder: "Your dream break activity", type: "text" as const },
];

interface PersonalizationSurveyProps {
  childId: string;
  childName: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function PersonalizationSurvey({ childId, childName, onComplete, onCancel }: PersonalizationSurveyProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[currentQ];
  const isLast = currentQ === QUESTIONS.length - 1;
  const isFirst = currentQ === 0;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        childId,
        survey_completed: true,
        survey_completed_at: new Date().toISOString(),
      };

      for (const [key, value] of Object.entries(answers)) {
        if (key === "never_suggest") {
          payload[key] = value.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          payload[key] = value;
        }
      }

      await fetch("/api/recharge/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      onComplete();
    } catch (error) {
      console.error("Error saving survey:", error);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i <= currentQ ? "bg-purple-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <Card className="p-8">
        <div className="text-center mb-6">
          <span className="text-5xl block mb-4">{q.emoji}</span>
          <h3 className="text-2xl font-bold text-slate-800">{q.question}</h3>
          <p className="text-sm text-slate-500 mt-1">For {childName}</p>
        </div>

        {q.type === "choice" ? (
          <div className="grid grid-cols-2 gap-3">
            {q.choices?.map((c) => (
              <button
                key={c.value}
                onClick={() => handleAnswer(c.value)}
                className={`p-4 rounded-xl border-2 font-medium text-lg transition-all min-h-[56px] cursor-pointer ${
                  answers[q.key] === c.value
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 hover:border-purple-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[q.key] || ""}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={q.placeholder}
            className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-lg min-h-[100px] resize-none"
          />
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={isFirst ? onCancel : () => setCurrentQ((p) => p - 1)}
            className="min-h-[48px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isFirst ? "Cancel" : "Back"}
          </Button>

          {isLast ? (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-h-[48px] bg-gradient-to-r from-purple-500 to-violet-500 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Answers
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQ((p) => p + 1)}
              className="min-h-[48px]"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/PersonalizationSurvey.tsx
git commit -m "feat(recharge): add 10-question PersonalizationSurvey component"
```

### Task 20: Create ParentBreakManager component

**Files:**
- Create: `components/recharge/ParentBreakManager.tsx`

**Step 1: Write the parent management UI**

Parent-facing component for viewing breaks, adding custom ones, toggling active/inactive, and launching the survey. Designed for computer use (not kiosk).

```typescript
// components/recharge/ParentBreakManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Trash2, ClipboardList, Loader2 } from "lucide-react";
import { CATEGORY_CONFIG, DURATION_LABELS, type RechargeCategory, type RechargeDuration } from "./constants";
import { PersonalizationSurvey } from "./PersonalizationSurvey";
import type { RechargeBreak, RechargeProfile } from "@/lib/supabase";

interface ParentBreakManagerProps {
  childId: string;
  childName: string;
}

export function ParentBreakManager({ childId, childName }: ParentBreakManagerProps) {
  const [breaks, setBreaks] = useState<RechargeBreak[]>([]);
  const [profile, setProfile] = useState<RechargeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBreak, setNewBreak] = useState({ name: "", emoji: "", description: "", category: "fun" as RechargeCategory, duration: 10 as RechargeDuration });

  const loadData = async () => {
    try {
      const [breaksRes, profileRes] = await Promise.all([
        fetch(`/api/recharge/breaks?childId=${childId}`),
        fetch(`/api/recharge/profiles?childId=${childId}`),
      ]);
      if (breaksRes.ok) {
        const data = await breaksRes.json();
        setBreaks(data.breaks || []);
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error loading recharge data:", error);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [childId]);

  const toggleBreak = async (breakId: string, isActive: boolean) => {
    try {
      await fetch(`/api/recharge/breaks/${breakId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      setBreaks((prev) => prev.map((b) => b.id === breakId ? { ...b, is_active: !isActive } : b));
    } catch (error) {
      console.error("Error toggling break:", error);
    }
  };

  const deleteBreak = async (breakId: string) => {
    try {
      await fetch(`/api/recharge/breaks/${breakId}`, { method: "DELETE" });
      setBreaks((prev) => prev.filter((b) => b.id !== breakId));
    } catch (error) {
      console.error("Error deleting break:", error);
    }
  };

  const addBreak = async () => {
    if (!newBreak.name || !newBreak.emoji) return;
    try {
      const res = await fetch("/api/recharge/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId, ...newBreak }),
      });
      if (res.ok) {
        const data = await res.json();
        setBreaks((prev) => [...prev, data.break]);
        setNewBreak({ name: "", emoji: "", description: "", category: "fun", duration: 10 });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding break:", error);
    }
  };

  if (showSurvey) {
    return (
      <PersonalizationSurvey
        childId={childId}
        childName={childName}
        onComplete={() => { setShowSurvey(false); loadData(); }}
        onCancel={() => setShowSurvey(false)}
      />
    );
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-500" /></div>;
  }

  const categories = Object.keys(CATEGORY_CONFIG) as RechargeCategory[];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowSurvey(true)} variant="outline" className="min-h-[48px]">
          <ClipboardList className="h-4 w-4 mr-2" />
          {profile?.survey_completed ? "Retake Survey" : "Take Survey"}
        </Button>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="min-h-[48px] bg-gradient-to-r from-purple-500 to-violet-500 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Break
        </Button>
      </div>

      {/* Survey status */}
      {profile?.survey_completed && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-green-700 text-sm font-medium">
            Survey completed {profile.survey_completed_at ? new Date(profile.survey_completed_at).toLocaleDateString() : ""}
          </p>
        </Card>
      )}

      {/* Add form */}
      {showAddForm && (
        <Card className="p-6 border-purple-200">
          <h4 className="font-bold mb-4">Add Custom Break for {childName}</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input value={newBreak.emoji} onChange={(e) => setNewBreak((p) => ({ ...p, emoji: e.target.value }))} placeholder="Emoji" maxLength={2} className="p-3 border rounded-xl text-center text-2xl" />
            <input value={newBreak.name} onChange={(e) => setNewBreak((p) => ({ ...p, name: e.target.value }))} placeholder="Break name" className="p-3 border rounded-xl" />
          </div>
          <textarea value={newBreak.description} onChange={(e) => setNewBreak((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full p-3 border rounded-xl mb-4 min-h-[80px]" />
          <div className="flex gap-3 mb-4">
            {categories.map((c) => (
              <button key={c} onClick={() => setNewBreak((p) => ({ ...p, category: c }))} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${newBreak.category === c ? CATEGORY_CONFIG[c].pill : "bg-slate-100 text-slate-600"}`}>
                {CATEGORY_CONFIG[c].label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mb-4">
            {([5, 10, 15, 30] as const).map((d) => (
              <button key={d} onClick={() => setNewBreak((p) => ({ ...p, duration: d }))} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${newBreak.duration === d ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                {DURATION_LABELS[d]}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button onClick={addBreak} disabled={!newBreak.name || !newBreak.emoji} className="bg-purple-500 text-white">Save</Button>
            <Button onClick={() => setShowAddForm(false)} variant="outline">Cancel</Button>
          </div>
        </Card>
      )}

      {/* Break list by category */}
      {categories.map((cat) => {
        const catBreaks = breaks.filter((b) => b.category === cat);
        if (catBreaks.length === 0) return null;
        const config = CATEGORY_CONFIG[cat];
        return (
          <div key={cat}>
            <h4 className={`font-bold ${config.text} mb-2 flex items-center gap-2`}>
              {config.icon} {config.label} ({catBreaks.length})
            </h4>
            <div className="space-y-2">
              {catBreaks.map((b) => (
                <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border ${b.is_active ? "" : "opacity-50"}`}>
                  <span className="text-2xl">{b.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{b.name}</p>
                    <p className="text-xs text-slate-500">{DURATION_LABELS[b.duration as RechargeDuration]} &middot; {b.source}</p>
                  </div>
                  <button onClick={() => toggleBreak(b.id, b.is_active)} className="p-2 rounded-lg hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center">
                    {b.is_active ? <Eye className="h-4 w-4 text-slate-400" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
                  </button>
                  {!b.is_foundation && (
                    <button onClick={() => deleteBreak(b.id)} className="p-2 rounded-lg hover:bg-red-50 min-h-[40px] min-w-[40px] flex items-center justify-center">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/recharge/ParentBreakManager.tsx
git commit -m "feat(recharge): add ParentBreakManager with add/toggle/delete and survey launcher"
```

---

## Phase 6: Analytics + Polish

### Task 21: Create RechargeAnalytics component

**Files:**
- Create: `app/api/recharge/analytics/route.ts`
- Create: `components/recharge/RechargeAnalytics.tsx`

**Step 1: Write analytics API**

```typescript
// app/api/recharge/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) {
      return NextResponse.json({ error: "childId required" }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Get last 30 days of sessions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions, error } = await supabase
      .from("recharge_sessions")
      .select("*, recharge_breaks(name, emoji, category, duration)")
      .eq("child_id", childId)
      .gte("started_at", thirtyDaysAgo.toISOString())
      .order("started_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("[Recharge Analytics API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
```

**Step 2: Write analytics component (CSS-only charts)**

```typescript
// components/recharge/RechargeAnalytics.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CATEGORY_CONFIG, type RechargeCategory } from "./constants";

interface SessionWithBreak {
  id: string;
  started_at: string;
  completed: boolean;
  duration_planned: number;
  duration_actual: number | null;
  rating: number | null;
  recharge_breaks: {
    name: string;
    emoji: string;
    category: string;
    duration: number;
  };
}

interface RechargeAnalyticsProps {
  childId: string;
  childName: string;
}

export function RechargeAnalytics({ childId, childName }: RechargeAnalyticsProps) {
  const [sessions, setSessions] = useState<SessionWithBreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/recharge/analytics?childId=${childId}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error("Error loading analytics:", error);
      }
      setLoading(false);
    }
    load();
  }, [childId]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-500" /></div>;
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-500">
        No recharge sessions yet for {childName}. They&apos;ll show up here after the first break!
      </Card>
    );
  }

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed).length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const avgRating = sessions.filter((s) => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / (sessions.filter((s) => s.rating).length || 1);

  // Category distribution
  const catCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    const cat = s.recharge_breaks?.category || "fun";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  const maxCatCount = Math.max(...Object.values(catCounts), 1);

  // Top breaks
  const breakCounts: Record<string, { name: string; emoji: string; count: number }> = {};
  sessions.forEach((s) => {
    const key = s.recharge_breaks?.name || "Unknown";
    if (!breakCounts[key]) {
      breakCounts[key] = { name: key, emoji: s.recharge_breaks?.emoji || "❓", count: 0 };
    }
    breakCounts[key].count++;
  });
  const topBreaks = Object.values(breakCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-purple-600">{totalSessions}</p>
          <p className="text-xs text-slate-500 mt-1">Total Breaks</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-green-600">{completionRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Completion</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-amber-500">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-1">Avg Rating</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-sky-600">
            {Math.round(sessions.reduce((sum, s) => sum + (s.duration_actual || s.duration_planned * 60), 0) / 60)}m
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Time</p>
        </Card>
      </div>

      {/* Category distribution (CSS bars) */}
      <Card className="p-5">
        <h4 className="font-bold text-slate-800 mb-4">Category Breakdown</h4>
        <div className="space-y-3">
          {(Object.keys(CATEGORY_CONFIG) as RechargeCategory[]).map((cat) => {
            const count = catCounts[cat] || 0;
            const config = CATEGORY_CONFIG[cat];
            const pct = maxCatCount > 0 ? (count / maxCatCount) * 100 : 0;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm font-medium w-20 text-slate-600">{config.label}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${config.accent} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top breaks */}
      <Card className="p-5">
        <h4 className="font-bold text-slate-800 mb-4">Favorite Breaks</h4>
        <div className="space-y-2">
          {topBreaks.map((b, i) => (
            <div key={b.name} className="flex items-center gap-3">
              <span className="text-slate-400 font-bold w-6">#{i + 1}</span>
              <span className="text-2xl">{b.emoji}</span>
              <span className="flex-1 font-medium text-sm text-slate-700">{b.name}</span>
              <span className="text-sm font-bold text-purple-600">{b.count}x</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/api/recharge/analytics/route.ts components/recharge/RechargeAnalytics.tsx
git commit -m "feat(recharge): add analytics API and CSS-only analytics component"
```

### Task 22: Update index exports

**Files:**
- Modify: `components/recharge/index.ts`

**Step 1: Export all public components**

```typescript
// components/recharge/index.ts
export { RechargeMenu } from "./RechargeMenu";
export { RechargeTimerProvider } from "./RechargeTimerContext";
export { TimerOverlay } from "./TimerOverlay";
export { ParentBreakManager } from "./ParentBreakManager";
export { PersonalizationSurvey } from "./PersonalizationSurvey";
export { RechargeAnalytics } from "./RechargeAnalytics";
```

**Step 2: Commit**

```bash
git add components/recharge/index.ts
git commit -m "feat(recharge): export all public components from index"
```

### Task 23: Final build verification

**Step 1: Full build check**

```bash
cd ~/Developer/active/family-hq-chat && npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no TypeScript errors.

**Step 2: Verify Supabase tables**

In Supabase Dashboard, run:
```sql
SELECT 'recharge_breaks' as tbl, count(*) FROM recharge_breaks
UNION ALL SELECT 'recharge_profiles', count(*) FROM recharge_profiles
UNION ALL SELECT 'recharge_sessions', count(*) FROM recharge_sessions;
```

Expected: recharge_breaks = 36, profiles = 0, sessions = 0.

**Step 3: Commit any remaining changes**

```bash
git add -A && git status
git commit -m "feat(recharge): Kids Recharge Menu - complete implementation"
```
