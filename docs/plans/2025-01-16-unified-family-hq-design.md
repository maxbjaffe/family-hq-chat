# Unified Family HQ - Design Document

**Date:** January 16, 2025
**Status:** Approved

## Overview

Merge Morning Rundown into Family HQ Chat to create a unified family command center. Supports shared family functionality, personal spaces with PIN protection, and role-based data visibility.

## Users & Roles

| User | Role | Access |
|------|------|--------|
| Max | Admin | Full access, all integrations, admin settings |
| Alex | Adult | Family content + her personal integrations |
| Kids | Kid | Kids Zone only, no PIN areas |

## Auth Model

- **Default:** No auth required for family dashboard and Kids Zone
- **PIN-protected:** Personal spaces, admin settings, configurable per section
- **Admin configurable:** Which sections require PIN

## Data Model

### Users Table
```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_hash text,
  role text not null check (role in ('admin', 'adult', 'kid')),
  integrations jsonb default '{}',
  created_at timestamptz default now()
);
```

### Content Visibility
```sql
create table content_visibility (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id text not null,
  visibility text not null check (visibility in ('family', 'private', 'shared_with')),
  shared_with uuid[],
  owner_id uuid references users(id)
);
```

### Cached Calendar Events
```sql
create table cached_calendar_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  title text,
  start_time timestamptz,
  end_time timestamptz,
  calendar_name text,
  location text,
  updated_at timestamptz default now()
);
```

### Cached Reminders
```sql
create table cached_reminders (
  id uuid primary key default gen_random_uuid(),
  reminder_id text unique,
  user_id uuid references users(id),
  title text,
  due_date timestamptz,
  list_name text,
  priority int,
  is_completed boolean default false,
  updated_at timestamptz default now()
);
```

## Integrations

| Source | User | Method |
|--------|------|--------|
| Todoist | Max | API (ported from Morning Rundown) |
| Notion | Max | API (future phase) |
| Apple Calendar | All | iOS Shortcuts → API endpoint |
| Apple Reminders | Alex | iOS Shortcuts → API endpoint |

### Shortcuts API Endpoints

```
POST /api/shortcuts/calendar
  Header: X-Shortcut-Key: [secret]
  Body: { events: [...] }

POST /api/shortcuts/reminders
  Header: X-Shortcut-Key: [secret]
  Body: { user: "alex", reminders: [...] }
```

## UI Structure

### Family Dashboard (default, no PIN)
```
┌─────────────────────────────────────────────────┐
│  Family HQ                    [User ▼] [⚙️]    │
├─────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │  📅 Today       │  │  ✓ Tasks            │   │
│  │  (Apple Cal)    │  │  (shared only)      │   │
│  └─────────────────┘  └─────────────────────┘   │
│  ┌───────────────────────────────────────────┐  │
│  │  💬 Chat (family context)                 │  │
│  └───────────────────────────────────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Max's   │ │ Alex's  │ │ Kids    │            │
│  │ Space 🔒│ │ Space 🔒│ │ Zone    │            │
│  └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────┘
```

### Personal Space (after PIN)
- Same layout
- Tasks widget shows user's full data
- Chat has full personal context

### Kids Zone
- Current Family HQ experience (avatars, jokes, games, doodle)
- No changes needed

## PWA Deep Links

Each family member can save their zone to home screen:
- `/` → Family dashboard
- `/max` → Max's space (PIN on entry)
- `/alex` → Alex's space (PIN on entry)
- `/kids` → Kids Zone (no PIN)

## Permission Logic

### Role Defaults
| Permission | Admin | Adult | Kid |
|------------|-------|-------|-----|
| Family content | ✓ | ✓ | ✓ |
| Own personal content | ✓ | ✓ | ✓ |
| Other adult's personal | ✗ | ✗ | ✗ |
| Manage integrations | ✓ | Own only | ✗ |
| Admin settings | ✓ | ✗ | ✗ |

### Content Visibility Override
- `family` → Everyone sees it
- `private` → Owner only
- `shared_with` → Owner + specified users

Example: Max marks Todoist "House" project as `family`, "Job Search" as `private`.

## Components

| Component | Source | Notes |
|-----------|--------|-------|
| `DashboardLayout` | New | Grid layout with widget slots |
| `CalendarWidget` | New | Shows cached Apple Calendar events |
| `TasksWidget` | Port from Morning Rundown | Filtered by user context |
| `ChatPanel` | Merge | Best of both apps, role-aware |
| `SpaceCard` | New | PIN-protected entry to personal spaces |
| `PinModal` | New | PIN entry overlay |
| `ProtectedRoute` | New | Wrapper for PIN-required sections |

## Implementation Phases

### Phase 1: MVP Foundation
1. PIN auth system (users table, PIN check, role lookup)
2. PIN-protected route wrapper component
3. Dashboard layout with widget slots
4. Port Todoist integration from Morning Rundown
5. Shortcuts API endpoints for Calendar/Reminders
6. Cache tables for Apple data
7. Context-aware chat (filter data by role)

### Phase 2: Polish & Alex's Data
1. Build Apple Reminders Shortcut + test flow
2. Content visibility admin UI
3. Alex's personal space with her Reminders

### Phase 3: Expand
1. Port weekly priorities from Morning Rundown
2. Notion integration for Max
3. Kids Zone enhancements
4. Kiosk mode improvements

## Environment Variables

```
# Existing
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# New
SHORTCUTS_SECRET_KEY=  # For authenticating Shortcut requests
TODOIST_API_TOKEN=     # Max's Todoist (port from Morning Rundown)
NOTION_API_KEY=        # Future phase
NOTION_DATABASE_ID=    # Future phase
```

## Success Criteria

- [ ] Family can see shared calendar and tasks without logging in
- [ ] Max can PIN into his space and see full Todoist
- [ ] Alex can PIN into her space and see Apple Reminders
- [ ] Kids can access Kids Zone with no friction
- [ ] Chat is context-aware based on current user/view
- [ ] Apple data syncs via Shortcuts
- [ ] PWA installable with deep links working
