# Family HQ Homepage Refresh Design

**Date:** 2026-03-02
**Status:** Approved

## Overview

Refresh the Family HQ homepage layout to lead with calendar/schedule information, consolidate fun content into a carousel, add Recharge quick-launch, and plan for a future "Family Board" pinboard section.

## Layout (top to bottom)

```
┌─────────────────────────────────────────┐
│  Header (logo + date/greeting + buttons)│
├─────────────────────────────────────────┤
│  Today at a Glance (hero card)          │
│  - Weather pill inline (top-right)      │
│  - Compact timeline (6-8 events)        │
│  - Tomorrow preview (2-3 + count)       │
├─────────────────────────────────────────┤
│  Family Row (horizontal: R, P, D, J)    │
├──────────────────┬──────────────────────┤
│  Rest of Week    │  Recharge            │
│  (calendar)      │  (4 category btns)   │
├──────────────────┼──────────────────────┤
│  Fun Stuff       │  House Tasks         │
│  (carousel)      │                      │
├──────────────────┴──────────────────────┤
│  Family Board (full-width placeholder)  │
└─────────────────────────────────────────┘
  Quick Chat Widget (floating bottom-right)
```

Mobile: Single column, same order top to bottom.

## Section Details

### Header
Same as current but tighter padding. Logo, date, greeting on left; clock, sync, parents button, refresh on right.

### Today at a Glance (Hero Card)
- Full-width, indigo-to-violet gradient accent
- Top-left: "Today" heading + event count badge
- Top-right: Weather pill — emoji + temp, tappable popover for hi/lo + forecast
- Body: Compact timeline, max 6-8 events. Each row: time | person pill (avatar xs + name) | event title. Left color border per calendar source.
- Bottom: Tomorrow preview — 2-3 events + "Tomorrow · X events" header
- Overflow: "and X more →" links to /calendar
- Data: `/api/upcoming?days=7`, split client-side

### Family Avatar Row
- Horizontal flex row, centered, gap-4
- Fixed order: Riley, Parker, Devin, Jaffe
- Avatar size: xl (128px)
- Progress ring around avatar showing checklist completion
- Jaffe: no progress ring, "Good boy!" text
- Tap → `/family/[name]`
- All kids complete → celebration glow + "Everyone's Ready! 🎉"

### Section Cards Grid (md:grid-cols-2, gap-4)

**Card 1 — Rest of the Week** (indigo-50/violet-50)
- Tomorrow's full event list
- Remaining days: compact rows with count pills
- "View full calendar →" link

**Card 2 — Recharge** (purple-50/violet-50)
- "⚡ Recharge" header + "Take a Break" subtitle
- 2×2 grid: Energy (rose), Calm (sky), Creative (amber), Fun (violet)
- Tap → `/recharge?category=[name]`

**Card 3 — Fun Stuff** (yellow-50/pink-50)
- Auto-rotating carousel (20s): quote → joke → fact
- Three dots for manual nav
- Refresh button regenerates all
- Joke keeps "Tell me!" interaction

**Card 4 — House Tasks**
- Same HouseTasks component, no changes

**Card 5 — Family Board** (slate-50/stone-50, md:col-span-2)
- Placeholder: dashed border, pushpin icon, "Nothing pinned yet"
- Parent-only "Add" button (future, behind PIN)

## New Components
1. `TodayHeroCard` — hero card with timeline + weather pill + tomorrow preview
2. `WeatherPill` — inline weather (emoji + temp + popover)
3. `FamilyAvatarRow` — horizontal avatar row with progress rings
4. `RestOfWeekCard` — tomorrow detail + weekday summaries
5. `RechargeQuickLaunch` — 4 category buttons
6. `FunStuffCarousel` — rotating quote/joke/fact with dots
7. `FamilyBoardCard` — empty placeholder

## Modified Components
1. `RechargeMenu.tsx` — accept optional category query param
2. `app/page.tsx` — full layout rewrite

## No Backend Changes
All data from existing endpoints. No new API routes or DB tables.
