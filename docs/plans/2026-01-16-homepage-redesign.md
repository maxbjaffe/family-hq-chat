# Homepage Redesign

## Overview

Redesign the Family HQ homepage to reduce overlap with the checklist page, make kid avatars more prominent, and add engaging content sections for jokes and fun facts.

## Goals

1. Homepage shows status at a glance; checklist page is where tasks are completed
2. Kid avatars are the visual anchor - large, tappable, showing progress
3. Fresh, engaging content via jokes and fun facts (Claude API, hourly refresh)
4. Fix inactivity timer to work reliably
5. Prevent zoom on touch devices

## Homepage Layout

### Header
- Logo, greeting, clock (existing)
- Weather card (kept, compact)
- Remove: Events section (lives on Calendar tab)

### Main Content - Avatar Row
Each child displayed as a prominent, tappable card:
- Large avatar image (~150-180px) - full image, not cropped
- Name underneath with playful font
- Progress indicator (e.g., "3/5" or progress ring)
- Green glow/border when all tasks complete
- Tap anywhere on card to go to `/kiosk`

### Main Content - Fun Sections
Two separate cards below avatars:

**Joke of the Hour**
- Single joke displayed (setup + punchline)
- Age-adaptive content (rotates simple/clever)
- Refreshes hourly via Claude API
- Subtle "New joke in X min" indicator

**Fun Fact**
- Single educational fact (science, nature, history, animals, space)
- "Did you know..." engaging format
- Refreshes hourly, offset 30 min from jokes
- Same subtle timestamp indicator

### Removed from Homepage
- Interactive checklist (no toggling tasks)
- Events section
- Quick action buttons
- Checklist summary card

## API Implementation

### New Route: `/api/content`

Endpoint to fetch jokes and fun facts from Claude API.

**Behavior:**
- Generates new joke + fact once per hour
- Caches server-side (memory or database)
- All users see same content (shared cache)
- Fallback content if API fails

**Response:**
```json
{
  "joke": {
    "setup": "Why did the scarecrow win an award?",
    "punchline": "Because he was outstanding in his field!",
    "generatedAt": "2026-01-16T10:00:00Z",
    "nextRefresh": "2026-01-16T11:00:00Z"
  },
  "funFact": {
    "fact": "Did you know octopuses have three hearts? Two pump blood to the gills, and one pumps it to the rest of the body.",
    "topic": "animals",
    "generatedAt": "2026-01-16T10:30:00Z",
    "nextRefresh": "2026-01-16T11:30:00Z"
  }
}
```

**Claude API Prompt Guidelines:**
- Jokes: Age-adaptive, family-friendly, mix of silly and clever
- Facts: Educational, engaging for kids, topics rotate (science, nature, history, animals, space)

## Technical Fixes

### Inactivity Timer

**Problem:** `mousemove` events constantly reset timer, preventing timeout.

**Fix in `hooks/useInactivityTimer.ts`:**
- Remove `mousemove` from activity events
- Keep: `mousedown`, `click`, `keydown`, `scroll`, `touchstart`
- Change default timeout: 7 min → 10 min

**Fix in `components/KioskProvider.tsx`:**
- Update default `inactivityTimeoutMinutes` from 7 to 10

### Zoom Prevention

**Existing (viewport meta):**
```typescript
export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
};
```

**Additional CSS in `globals.css`:**
```css
html {
  touch-action: manipulation;
}
```

This prevents double-tap zoom on touch devices where viewport meta is ignored.

## Files to Modify

| File | Changes |
|------|---------|
| `app/page.tsx` | Complete redesign - avatar cards, jokes/facts sections |
| `hooks/useInactivityTimer.ts` | Remove mousemove, update timeout |
| `components/KioskProvider.tsx` | Update default timeout to 10 |
| `app/globals.css` | Add touch-action CSS |

## New Files

| File | Purpose |
|------|---------|
| `app/api/content/route.ts` | Claude API endpoint for jokes/facts |

## Testing

### Homepage
- Avatars display full images, tappable, link to `/kiosk`
- Progress shows correctly for each child
- Jokes and fun facts load and display
- Content refreshes hourly without page reload

### Inactivity Timer
1. Navigate to `/games` or `/chat`
2. Wait without interaction
3. Warning appears at 9 minutes
4. Redirects to `/` at 10 minutes
5. Clicking/tapping resets the timer

### Zoom Prevention
- Double-tap should not zoom on touch devices
- Pinch-zoom should be disabled
