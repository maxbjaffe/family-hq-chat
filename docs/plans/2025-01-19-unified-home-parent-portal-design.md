# Unified Home & Parent Portal Design

## Overview

Consolidate Home and Dashboard into a single family-first, kiosk-optimized screen. Create a Parent Portal for Max/Alex with full personal command center capabilities. Simplify navigation to three items.

## Navigation Structure

### Main Nav (3 items)
- **Home** - Unified family hub
- **Checklists** - Kids morning/evening routines (`/kiosk`)
- **Breaktime** - Games and activities (`/games`)

### Access Points
- **Parents button** (on home screen) → PIN entry → routes to parent dashboard based on PIN
- **Family member cards** - Tap to drill down:
  - Kids → Activity detail view
  - Adults → PIN prompt → Parent Dashboard
  - Pets → Profile view

### Removed
- Dashboard nav item (merged into Home)
- Chat nav item (integrated into home + parent dashboard)
- Calendar nav item (integrated into home + parent dashboard)
- Admin nav item (moved to parent dashboard)

---

## Unified Home Screen

### Layout (Top to Bottom)

**1. Header Section**
- Large, clear date display (e.g., "Sunday, January 19, 2025")
- Current time (prominent for kiosk glanceability)
- Parents button (top-right)

**2. Weather Section**
- 3-day forecast (Today, Tomorrow, Day 3)
- Each day: icon, high/low temps, condition
- Current temperature prominent

**3. Today's Events**
- All family calendar events for today
- Color-coded by calendar:
  - School = blue
  - Kids Activities = green
  - Home = purple
  - Individual kids = their assigned colors

**4. Family Grid**
- Cards for: Devin, Parker, Riley, Jaffe
- Kids show: avatar, name, checklist progress bar
- Jaffe shows: avatar, name (no progress bar)
- Tap → detail view

**5. House Tasks**
- Current shared family tasks
- Completable by anyone (tap to mark done)
- Read-only creation (add via parent dashboard)

**6. Bottom Section (Fun & Quick Access)**
- **Quick Chat Widget** - Fixed bottom-right, always visible
- **Motivational Quote** - Hourly refresh, attribution shown
- **Joke of the Hour** - Current format with reveal button
- **Fun Fact** - Current format with topic tag

---

## Parent Dashboard

### Entry Flow
1. Tap "Parents" button on home screen
2. PIN modal appears (no name selection)
3. System identifies Max or Alex by their unique PIN
4. Routes directly to their personalized dashboard

### Layout

**Header**
- Large avatar display (hero style)
- "[Name]'s Dashboard" title
- Back to Family Home link
- Logout button

**Main Content (2-column desktop, stacked mobile)**

| Left Column | Right Column |
|-------------|--------------|
| Full Calendar (filters, all events) | Tasks (Todoist projects, CRUD) |
| Weekly Priorities | Full Chat (all tools enabled) |

**Person-Specific Content**
- **Max**: Todoist projects and tasks prominently featured
- **Alex**: Apple Reminders section

**Footer**
- Admin link (family management, checklist config)
- Settings

---

## Quick Chat Widget

### Appearance
- Fixed position: bottom-right corner
- Collapsed: ~60px tall (input field + chat icon)
- Expanded: ~300px tall (input + last 2-3 exchanges + scroll)

### Behavior
- Tap input or icon to expand
- Tap outside or X to collapse
- "Open full chat" link → requires parent PIN

### Capabilities (Read-Only)
Allowed queries:
- "When is Riley's soccer practice?"
- "What's the weather tomorrow?"
- "Who is Parker's doctor?"
- "What events are on Thursday?"

Blocked actions (friendly redirect):
- "Add a task..." → "To add tasks, open the Parent Dashboard"
- "Create...", "Delete...", "Update..." → Same redirect

### Style
- Purple/blue gradient accents (matches app theme)
- 48px+ input height (touch-friendly)
- Clear, readable response text

---

## Family Member Detail Views

### Kids (Riley, Parker, Devin)
- **Large avatar** - Hero style (~150px), top of page
- **Today's checklist** - Progress bar + task list with status
- **Their calendar** - Personal + School + Kids Activities events
- **Profile info** - Birthday, school/grade, activities, doctors, allergies
- **Back button** - Large (48px+), clear label "Back"

### Pet (Jaffe)
- **Large avatar** - Hero style
- **Profile info** - Vet, medications, feeding schedule, birthday
- **No checklist/calendar**
- **Back button** - Large, clear

### Adults (Max, Alex)
- No detail view
- Tap → PIN modal → Parent Dashboard

---

## Motivational Quotes Feature

### Content
- Family-friendly motivational/inspirational quotes
- Mix of famous quotes and kid-appropriate encouragement
- Context-aware when possible (Monday motivation, weekend vibes)

### Technical
- Hourly refresh (same as jokes)
- Added to `/api/content` endpoint
- Claude-generated, stored in content cache
- Display: quote text + attribution

---

## Technical Changes Summary

### New Components
- `QuickChatWidget.tsx` - Mini chat panel for home screen
- `ParentDashboard.tsx` - Full parent command center
- `MotivationalQuote.tsx` - Quote display card
- `WeatherForecast.tsx` - 3-day forecast display

### Modified Components
- `app/page.tsx` - Complete rewrite as unified home
- `Navigation.tsx` - Reduce to 3 items
- `app/api/content/route.ts` - Add quotes generation
- `PinModal.tsx` - Return user identity on success

### Removed/Deprecated
- `app/dashboard/page.tsx` - Functionality merged into home + parent dashboard
- Dashboard nav link
- Chat nav link (integrated)
- Calendar nav link (integrated)

### New Routes
- `/parents` - Parent dashboard (PIN-protected)
- `/family/[name]` - Enhanced with role-based views

### Database
- Add `motivational_quotes` to content cache or reuse existing structure

---

## Success Criteria

1. Family can see everything important on one glanceable home screen
2. Parents access their personal tools via single PIN entry
3. Navigation reduced from 7 items to 3
4. Quick chat handles read-only queries without leaving home screen
5. All touch targets 48px+ for kiosk/tablet use
6. Kids and Jaffe have appropriate detail views with large back buttons
