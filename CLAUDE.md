# Family HQ

## What This Is
Unified family command center combining the functionality of the original Family HQ Chat (kids checklists, family reference data) with Morning Rundown (agentic task management, weekly priorities). Now a single hub for the whole family.

**Key Features:**
- Kids Zone with morning checklists and progress tracking
- Agentic AI chat with Todoist task management
- PIN-protected personal spaces (Max, Alex)
- House Tasks shared list for family contributions
- Weekly priorities tracking
- Family reference data (doctors, contacts, insurance)

## Tech Stack
- **Frontend:** Next.js 16, TypeScript, Tailwind, shadcn/ui
- **Backend:** Next.js API Routes, Supabase
- **AI:** Claude API with tool use (agentic loop)
- **Integrations:** Todoist (Max), Apple Calendar/Reminders (via iOS Shortcuts), Notion (family data)
- **Hosting:** Vercel

## Key Paths
```
app/                    # Pages and API routes
  page.tsx              # Homepage with kids progress + House Tasks
  chat/                 # AI chat interface
  dashboard/            # Family dashboard with space cards
  family/[name]/        # Family member profile pages
  max/, alex/           # PIN-protected personal spaces
  kiosk/                # Kids morning checklist interface
  admin/                # Unified family & checklist management
  api/
    chat/               # Agentic chat with tools
    admin/family/       # Family member CRUD (unified)
    admin/checklist/    # Checklist item management
    family/             # Notion health data lookup
    house-tasks/        # House Tasks CRUD
    auth/               # PIN verification
    shortcuts/          # iOS Shortcuts endpoints
components/
  Avatar.tsx            # Shared avatar (photo + emoji fallback)
  FamilyCards.tsx       # Dashboard family member grid
  HouseTasks.tsx        # Shared family task list
  PinModal.tsx          # PIN entry
  UserProvider.tsx      # Auth context
  widgets/              # Dashboard widgets
lib/
  supabase.ts           # DB client + auth + family members
  todoist.ts            # Todoist API (full CRUD)
  claude.ts             # Claude client + system prompt
  tools.ts              # Tool definitions (11 tools)
  tool-executor.ts      # Tool execution with user filtering
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
- `/` - Homepage (kids progress, weather, House Tasks, jokes)
- `/chat` - AI chat with tools
- `/dashboard` - Space cards for Max, Alex, Kids Zone
- `/max` - Max's space (PIN) - Todoist tasks by project
- `/alex` - Alex's space (PIN) - Apple Reminders
- `/kiosk` - Kids checklist interface
- `/admin` - User management, checklist config

## Recent Changes

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
