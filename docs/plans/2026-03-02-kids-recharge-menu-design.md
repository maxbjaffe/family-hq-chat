# Kids Recharge Menu — Design

## Overview

Touch-first dopamine break system for Riley, Parker, and Devin on the Family HQ kiosk. Kids pick a duration, pick a vibe, do the break, and get back to it.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data ownership | All in Family HQ (3 Supabase tables) | Self-contained; enrich Profile Hub later via API |
| Foundation breaks | Shared (`child_id = NULL`), 36 rows | No duplication; per-child overrides for hiding/customization |
| Categories | 4: energy, calm, creative, fun | Kid-simple; dropped adventure (overlaps energy/fun) |
| Category colors | Rose, Sky, Amber, Violet | Native to Family HQ's Tailwind palette |
| Entry points | Kiosk page (with avatar picker) + kid profile tab (skip picker) | One `RechargeMenu` component, two mount points |
| Routes | No new routes; component mounted in existing pages | Consistent with Family HQ patterns |
| Timer | Floating pill (minimized) + full-screen expand | Supports concurrent timers for all 3 kids |
| Timer state | `RechargeTimerContext` provider | Persists across kiosk navigation |
| Analytics | CSS-only bars and percentages | Matches Unloader's no-library approach |
| Confetti | `canvas-confetti` or CSS keyframes | Lightweight celebration on timer completion |

## Data Model

### `recharge_breaks`

Foundation breaks (shared) + custom per-child breaks.

```sql
id              uuid PK DEFAULT gen_random_uuid()
child_id        uuid FK -> family_members (NULL for foundation breaks)
category        text CHECK (category IN ('energy','calm','creative','fun'))
duration        integer CHECK (duration IN (5,10,15,30))
name            text NOT NULL
emoji           text NOT NULL
description     text
is_foundation   boolean DEFAULT false
is_active       boolean DEFAULT true
source          text CHECK (source IN ('foundation','survey','parent_added'))
sort_order      integer DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `recharge_profiles`

Per-child survey responses and preferences.

```sql
id                  uuid PK DEFAULT gen_random_uuid()
child_id            uuid FK -> family_members (UNIQUE)
hype_song           text
calm_strategy       text
movement_preference text
creative_preference text
free_time_choice    text
favorite_snack      text
break_style         text CHECK (break_style IN ('solo','sibling','pet','any'))
never_suggest       text[] DEFAULT '{}'
victory_move        text
custom_break_idea   text
hidden_breaks       uuid[] DEFAULT '{}' -- foundation break IDs this child doesn't see
survey_completed    boolean DEFAULT false
survey_completed_at timestamptz
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

### `recharge_sessions`

Usage tracking for analytics.

```sql
id              uuid PK DEFAULT gen_random_uuid()
child_id        uuid FK -> family_members
break_id        uuid FK -> recharge_breaks
started_at      timestamptz DEFAULT now()
completed_at    timestamptz -- NULL if ended early
completed       boolean DEFAULT false
paused_duration integer DEFAULT 0 -- total seconds spent paused
duration_planned integer NOT NULL -- minutes
duration_actual  integer -- seconds
context         text CHECK (context IN ('homework','frustrated','celebration','low_energy','transition','manual'))
rating          integer CHECK (rating BETWEEN 1 AND 5)
created_at      timestamptz DEFAULT now()
```

## Kiosk UX Flow

```
[Kiosk Page]
    │
    ├─ Tap "Recharge Menu" button
    │
    ▼
[Avatar Picker] ← skip if entering from /family/[name]
    Riley | Parker | Devin (large circles, 2xl avatars)
    │
    ▼
[Duration Picker]
    5 min (N) | 10 min (N) | 15 min (N) | 30 min (N)
    + "Surprise Me!" button
    │
    ▼
[Break Grid]
    Grouped by category (rose/sky/amber/violet section headers)
    Cards: large emoji + bold name + short description
    │
    ▼
[Break Detail + Start]
    Full description, category badge
    Big "START" button
    │
    ▼
[Full-screen "GO!" splash] (2-3 seconds)
    Big emoji + break name + "Have fun!"
    │
    ▼
[Auto-minimize to floating pill]
    Top-right corner: avatar (small) + countdown + emoji
    Kiosk is FREE for next kid
    │
    ├─ Tap pill → expand to full-screen timer
    │   - Large countdown + progress ring
    │   - Rotating encouragement messages
    │   - Pause / End Early buttons
    │   - Tap outside or minimize button → back to pill
    │
    ▼
[Timer Complete]
    Full-screen celebration: confetti + "Ready to get back to it!"
    Optional 1-5 star rating (large tap targets)
    "Done" button → pill disappears
```

### Concurrent Timer Support

- `RechargeTimerContext` wraps the kiosk layout
- Tracks up to 3 active timers (one per kid)
- Each timer: `{ childId, breakId, breakName, breakEmoji, totalSeconds, remainingSeconds, status: 'running' | 'paused' | 'complete' }`
- Floating pills stack vertically in top-right
- Pills show kid avatar + countdown + break emoji
- Timer state survives kiosk page navigation

## Component Architecture

```
components/recharge/
├── RechargeMenu.tsx          # Main orchestrator (avatar → duration → grid → detail)
├── AvatarPicker.tsx          # Kid selector (reuses Avatar component)
├── DurationPicker.tsx        # 5/10/15/30 buttons + Surprise Me
├── BreakGrid.tsx             # Category-grouped break cards
├── BreakCard.tsx             # Individual break card (emoji + name + desc)
├── BreakDetail.tsx           # Expanded view + START button
├── TimerPill.tsx             # Minimized floating timer
├── TimerFullScreen.tsx       # Expanded timer (progress ring, controls)
├── TimerCelebration.tsx      # Completion: confetti + rating
├── RechargeTimerContext.tsx   # Multi-timer state management
├── SurpriseBreak.tsx         # Random break picker (adapted from Unloader)
└── constants.ts              # Category colors, encouragement messages

app/api/recharge/
├── breaks/route.ts           # GET breaks, POST custom break
├── breaks/[id]/route.ts      # PATCH/DELETE break
├── sessions/route.ts         # POST start session, PATCH complete/end
├── profiles/route.ts         # GET/PATCH survey responses
└── profiles/[childId]/route.ts # GET child profile + hidden breaks
```

## Category Design

| Category | Color | Tailwind Gradient | Icon Vibe |
|----------|-------|-------------------|-----------|
| Energy | Rose | from-rose-50 to-rose-100, accent from-rose-400 to-rose-500 | Movement, dance, sports |
| Calm | Sky | from-sky-50 to-sky-100, accent from-sky-400 to-sky-500 | Breathing, pets, nature |
| Creative | Amber | from-amber-50 to-amber-100, accent from-amber-400 to-amber-500 | Art, building, writing |
| Fun | Violet | from-violet-50 to-violet-100, accent from-violet-400 to-violet-500 | Games, jokes, challenges |

## Foundation Breaks

36 breaks total: 11 at 5 min, 10 at 10 min, 9 at 15 min, 6 at 30 min. (Full list in spec doc.)

Category mapping for breaks that shifted from spec:
- `adventure` breaks → `energy` or `fun`
- `learning` breaks → `creative`
- `chill` breaks → `calm`

## Build Phases

1. **Database + seed** — Migration SQL for 3 tables, seed 36 foundation breaks
2. **Core kiosk flow** — RechargeMenu component, API routes, mount on kiosk page
3. **Timer system** — Context, floating pills, full-screen expand, pause/end, confetti, session tracking
4. **Kid profile integration** — Mount in `/family/[name]` tab, skip avatar picker
5. **Personalization** — Survey flow, parent management (add/edit/toggle breaks)
6. **Analytics + polish** — CSS-only parent stats, checklist completion prompt

## Integration Points (Future)

- Profile Hub: push `recharge_activities` via `/api/enrich` endpoint
- Kids Mode Agent: read recharge patterns for proactive suggestions
- Study Buddy: offer recharge after flashcard sessions
- Checklist: "You earned a recharge!" prompt after completion
