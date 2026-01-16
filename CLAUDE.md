# Family HQ Chat

## What This Is
Unified family command center with PIN-protected personal spaces. Combines kids' checklist tracking, family dashboard, calendar/tasks widgets, and AI chat.

## Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind, shadcn/ui
- **Backend:** Next.js API Routes, Supabase
- **AI:** Claude API
- **Integrations:** Todoist (Max), Apple Calendar/Reminders (via iOS Shortcuts)
- **Hosting:** Vercel

## Key Paths
```
app/                  # Pages and API routes
  chat/               # AI chat interface
  dashboard/          # Family dashboard page
  api/auth/           # PIN verification, user lookup
  api/chat/           # Agentic chat endpoint with tool use
  api/dashboard/      # Calendar and tasks APIs
  api/shortcuts/      # iOS Shortcuts endpoints for Apple data
components/           # React components
  widgets/            # Dashboard widgets (calendar, tasks)
  PinModal.tsx        # PIN entry component
  UserProvider.tsx    # Auth context
  DashboardLayout.tsx # Dashboard wrapper
lib/                  # Utilities and services
  supabase.ts         # DB client + auth functions
  todoist.ts          # Todoist API integration
  claude.ts           # Claude API client + system prompt
  tools.ts            # Claude tool definitions
  tool-executor.ts    # Tool execution logic
hooks/                # Custom React hooks
```

## Chat System (Agentic)
The chat system uses Claude with tool use for actionable conversations.

**Available Tools:**
- `get_tasks` / `create_task` / `update_task` / `complete_task` / `delete_task` - Todoist operations
- `get_family_info` - Notion family reference data (doctors, contacts, etc.)
- `get_calendar` - Upcoming calendar events
- `get_reminders` - Alex's Apple Reminders

**Architecture:**
- SSE streaming with tool call/result events
- Agentic loop continues until no more tool calls
- Family data from Notion included as context

## Auth Model
- **Default:** No auth required for family dashboard and Kids Zone
- **PIN-protected:** Personal spaces (Max, Alex) require 4-digit PIN
- User roles: admin, adult, kid

## Environment Variables
```bash
# Existing
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# New for unified Family HQ
TODOIST_API_TOKEN=      # Max's Todoist token
SHORTCUTS_SECRET_KEY=   # Secret for iOS Shortcuts auth
```

## Routes
- `/` - Kids Zone (current homepage with checklists)
- `/chat` - AI chat interface with tools
- `/dashboard` - Family dashboard with widgets and space cards
- `/max` - Max's personal space (PIN required)
- `/alex` - Alex's personal space (PIN required)
- `/kids` - Kids Zone

## Shortcuts API
iOS Shortcuts push Apple Calendar/Reminders data:
```
POST /api/shortcuts/calendar
  Header: X-Shortcut-Key: [SHORTCUTS_SECRET_KEY]
  Body: { events: [...] }

POST /api/shortcuts/reminders
  Header: X-Shortcut-Key: [SHORTCUTS_SECRET_KEY]
  Body: { user: "alex", reminders: [...] }
```

## Common Tasks

### Run locally
```bash
npm install
npm run dev
```

## Related Services
- **Vercel project:** family-hq-chat
- **Supabase:** Shared with giftstash
