# Family HQ

## What This Is
Unified family command center combining the functionality of the original Family HQ Chat (kids checklists, family reference data) with Morning Rundown (agentic task management, weekly priorities). Now a single hub for the whole family.

**Key Features:**
- **Unified Home** - Family hub with weather, calendar, family grid, house tasks, quotes/jokes
- **Quick Chat Widget** - Always-visible read-only chat for quick queries
- **Parent Dashboard** - PIN-protected personal command center (calendar, tasks, priorities, full chat)
- **Kids Zone** - Morning checklists with progress tracking
- **House Tasks** - Shared family task list
- **Family Profiles** - Role-based views (kids/pets show profile, adults redirect to dashboard)
- **iCal Calendar Sync** - Recurring events expanded, color-coded by calendar
- **Agentic AI Chat** - Full Todoist/priorities management with tools

## Tech Stack
- **Frontend:** Next.js 16, TypeScript, Tailwind, shadcn/ui
- **Backend:** Next.js API Routes, Supabase
- **AI:** Claude API with tool use (agentic loop)
- **Integrations:** Todoist (Max), Apple Calendar/Reminders (via iOS Shortcuts), Notion (family data)
- **Hosting:** Vercel

## Key Paths
```
app/                    # Pages and API routes
  page.tsx              # Unified Home - family hub with weather, calendar, family grid
  chat/                 # Full AI chat interface
  parents/              # Parent Dashboard (PIN-protected command center)
  dashboard/            # DEPRECATED - redirects to /
  family/[name]/        # Family member profile pages (role-based)
  max/, alex/           # Legacy personal spaces
  kiosk/                # Kids morning checklist interface
  admin/                # Family & checklist management
  games/                # Breaktime activities
  api/
    chat/               # Full agentic chat with tools
    chat/quick/         # Read-only quick chat (no task creation)
    content/            # Jokes, facts, motivational quotes
    weather/            # Weather + 3-day forecast
    calendar/           # Calendar events from iCal sync
    admin/family/       # Family member CRUD
    admin/checklist/    # Checklist item management
    family/             # Notion health data lookup
    family/[name]/school/ # Kid-specific school data from Radar
    house-tasks/        # House Tasks CRUD
    auth/               # PIN verification
    shortcuts/          # iOS Shortcuts endpoints
components/
  Avatar.tsx            # Shared avatar (photo + emoji fallback)
  FamilyMemberCard.tsx  # Role-based family member cards
  WeatherForecast.tsx   # 3-day weather forecast
  QuickChatWidget.tsx   # Fixed mini chat for home screen
  MotivationalQuote.tsx # Daily inspiration card
  ParentsButton.tsx     # PIN-protected parent access
  HouseTasks.tsx        # Shared family task list
  PinModal.tsx          # PIN entry
  UserProvider.tsx      # Auth context
  KidSchoolTab.tsx      # Kid-specific school data (events, actions, teacher emails)
  widgets/              # Dashboard widgets
lib/
  supabase.ts           # DB client + auth + family members
  todoist.ts            # Todoist API (full CRUD)
  claude.ts             # Claude client + system prompt
  tools.ts              # Tool definitions (11 tools)
  tool-executor.ts      # Tool execution with user filtering
  ical-sync.ts          # iCal calendar sync with recurring events
  calendar-colors.ts    # Calendar color coding
```

## Chat Tools
The agentic chat system has 11 tools:

**Todoist:**
- `get_tasks` - List tasks (filtered by user - Max sees all, others exclude "Personal")
- `create_task` - Create new task
- `update_task` - Modify task content/due/priority
- `complete_task` - Mark done
- `delete_task` - Remove task

**Family Data:**
- `get_family_info` - Notion reference data (doctors, contacts, etc.)
- `get_calendar` - Upcoming calendar events
- `get_reminders` - Alex's Apple Reminders

**Priorities:**
- `get_priorities` - Weekly priorities (current or previous week)
- `set_priorities` - Set 1-5 priorities for current week
- `update_priority` - Update single priority by number

## User Filtering
- **Max (logged in):** Sees all Todoist tasks including "Personal" project
- **Alex/Others:** Todoist filtered to exclude "Personal" project
- **House Tasks:** Visible to everyone, no login required
- **Reminders:** Only available for Alex

## Auth Model
- **No auth needed:** Homepage, Kids Zone, House Tasks, Chat (as guest)
- **PIN-protected:** Personal spaces (/max, /alex), full task filtering in chat
- **Roles:** admin, adult, kid, pet (pets have profiles but no PIN/checklist)

## Environment Variables
```bash
CLAUDE_API_KEY=         # Claude API
SUPABASE_URL=           # Supabase project URL
SUPABASE_SERVICE_KEY=   # Supabase service role key
TODOIST_API_TOKEN=      # Max's Todoist token
SHORTCUTS_SECRET_KEY=   # iOS Shortcuts auth
```

## Database Tables
- `family_members` - Unified table for all family (id, name, role, pin_hash, avatar_url, has_checklist)
  - Roles: admin, adult, kid, pet
  - Replaces old `users` and `children` tables
- `checklist_items` - Morning routine items (member_id, title, icon, reset_daily, weekdays_only)
- `checklist_completions` - Daily completion tracking (member_id, item_id, completion_date)
- `weekly_priorities` - Weekly focus areas (week_start, priority_number, content)
- `cached_calendar_events` - Apple Calendar sync
- `cached_reminders` - Apple Reminders sync

## Routes

### Main Navigation (3 items)
- `/` - **Home** - Unified family hub (weather, calendar, family grid, house tasks, quotes/jokes)
- `/kiosk` - **Checklists** - Kids morning/evening routines
- `/games` - **Breaktime** - Games and activities

### Additional Routes
- `/parents` - Parent Dashboard (PIN-protected, identifies user by PIN)
- `/family/[name]` - Family member profiles (kids/pets show profile, adults redirect to PIN → dashboard)
- `/chat` - Full AI chat with all tools
- `/calendar` - Full calendar view
- `/admin` - Family & checklist management
- `/dashboard` - DEPRECATED (redirects to /)
- `/max`, `/alex` - Legacy personal spaces

## Recent Changes

### Jan 28, 2026 - Agent Improvements & Kid School Tabs
- **Kid School Tabs** - New School tab on kid profile pages (`/family/[name]`)
  - Action items section with urgency badges
  - Upcoming events from school calendar
  - Teacher communications
  - Announcements section
  - Data pulled from Radar via `/api/family/[name]/school`
- **FamilyInfoAgent** - Full implementation with Notion integration
  - Health info: allergies, medications, blood type, conditions
  - Contacts: doctors, teachers, emergency contacts
  - Birthdays and ages
  - Smart family member detection (Riley, Parker, Devin, etc.)
- **HouseTasksAgent** - Full Todoist integration
  - View, add, and complete house tasks
  - Fuzzy task name matching for completion
  - Kid-friendly responses
- **CalendarAgent** - Fixed trigger patterns for "what's on the calendar"
- **Agent Analytics** - Cross-app observability via shared `agent_analytics` table
  - Hit rate tracking, fallback analysis
  - Dashboard at `radar.maxjaffe.ai/radar/admin`

### Jan 19, 2025 - Unified Home & Parent Portal
- **Consolidated Home + Dashboard** into single family-first screen
- **Simplified navigation** from 7 items to 3 (Home, Checklists, Breaktime)
- **New Parent Dashboard** (`/parents`) - PIN identifies user, routes to personal command center
- **Quick Chat Widget** - Always-visible mini chat on home for read-only queries
- **3-day Weather Forecast** - Enhanced weather display
- **Motivational Quotes** - Hourly AI-generated inspiration
- **Family Grid** - Role-based cards (kids show progress, adults show PIN hint, pets have profiles)
- **Role-based Profile Views** - Adults redirect to PIN → dashboard; kids/pets show profiles
- **iCal Recurring Events** - Calendar sync now expands recurring events properly
- **48px+ Touch Targets** - All buttons kiosk-ready

### Jan 17, 2025 - Unified Family Profiles
- Consolidated `users` + `children` tables into unified `family_members`
- Created shared `<Avatar>` component (photo with emoji fallback)
- Added family member profile pages (`/family/[name]`)
- Consolidated admin UI: single "Family" tab replaces separate Children/Users tabs
- Added `reset_daily` option for checklist items
- Added Jaffe (dog) to family profiles with pet role
- Hybrid data model: Supabase for app settings, Notion for health/reference data

### Jan 16, 2025 - Agentic Chat
- Merged Morning Rundown agentic chat into Family HQ
- Added 11 Claude tools for task/priority management
- Implemented user-aware filtering in chat
- Added login/logout UI to chat header
- Added weekly priorities (get/set/update)
- Created House Tasks component for homepage
- Reordered nav to show Chat on mobile

## Common Tasks

### Run locally
```bash
npm install
npm run dev
```

### Deploy
Push to GitHub → Vercel auto-deploys

## Related Services
- **Vercel:** family-hq-chat
- **Supabase:** fpxardwqswlofxrupyhz
- **GitHub:** github.com/maxbjaffe/family-hq-chat


## Agent Architecture (Added January 2026)

### Overview
Family HQ uses a hierarchical agent architecture with a warm, family-friendly persona. Simple queries are handled directly by specialized agents without a full Claude API call.

### Architecture
```
FamilyHQOrchestrator (persona: "Family Helper")
│
├── SchoolAgent              ← connected to radar_family_feed, family_members
│
├── CalendarAgent            ← connected to cached_calendar_events
│
├── ChecklistAgent           ← connected to checklist_items, checklist_completions
│
├── FamilyInfoAgent          ← connected to Notion (People, Health databases)
│
├── GamesAgent               ← stateless (game suggestions)
│
└── HouseTasksAgent          ← connected to Todoist "House Tasks" project
```

### Key Files
```
lib/agents/
├── base-agent.ts              # Abstract base class (family-friendly adaptations)
├── orchestrator.ts            # FamilyHQOrchestrator - warm persona, routes to agents
├── types.ts                   # AgentResult, AgentContext, UserInput, AgentPersona
├── integration.ts             # shouldUseAgents(), bridging helpers
└── domain/
    ├── school-agent.ts        # School updates from Radar feed
    ├── calendar-agent.ts      # Family calendar queries
    ├── checklist-agent.ts     # Morning/evening checklists
    ├── family-info-agent.ts   # Family member info (doctors, contacts)
    ├── games-agent.ts         # Fun activities and games
    └── house-tasks-agent.ts   # Household chore tracking
```

### How It Works
1. Chat API receives message
2. `shouldUseAgents()` checks for quick-trigger patterns
3. Orchestrator detects intent (school, calendar, checklist, etc.)
4. Routes to appropriate agent
5. High-confidence (≥0.8) results return directly
6. Low-confidence falls back to full Claude + tools
7. Kid-friendly responses when familyMember.role === 'kid'

### Connected Data Sources
| Agent | Table(s) / API | Operations |
|-------|----------------|------------|
| SchoolAgent | radar_family_feed, family_members | Read |
| CalendarAgent | cached_calendar_events | Read |
| ChecklistAgent | checklist_items, checklist_completions | Read, Toggle |
| FamilyInfoAgent | Notion (People, Health, Accounts DBs) | Read |
| HouseTasksAgent | Todoist "House Tasks" project | Read, Create, Complete |

### Radar Integration
The SchoolAgent pulls data from `radar_family_feed` which is populated by Radar's email processing pipeline:
- Radar scans Gmail for school emails
- Extracts events, announcements, action items → `radar_school_extractions`
- Syncs to `radar_family_feed` via CRON job
- Family HQ agents read from feed for school updates

### Remaining Work
- GamesAgent → Expand game options

### Agent Analytics (January 2026)
Agent performance is tracked via the shared `agent_analytics` table:
- Hit rate, response times, confidence scores
- Fallback analysis (no_match, low_confidence)
- Dashboard at `radar.maxjaffe.ai/radar/admin` → Agent Analytics tab
