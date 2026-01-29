# Kid Profile Dashboard Redesign

## Goal
Replace the current kid profile page with a card grid dashboard showing personal info, to-dos, checklist, school info, and calendar - all in a kid-friendly, glanceable format.

## Design

```
┌─────────────────────────────────────────┐
│  [Avatar]  Riley Jaffe                  │
│            Age 10 • 5th Grade           │
│            Bronxville Elementary        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✅ My To-Dos                            │
│ ○ Practice piano 20 min                 │
│ ○ Read chapter 5                        │
│ ○ Clean room                            │
│                        [+ Add] [Done]   │
└─────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ 🎂 Birthday     │  │ 📋 Checklist    │
│ March 15        │  │ ████░░░░ 4/7    │
│ 46 days away!   │  │ [tap to expand] │
│ ♓ Pisces -      │  │                 │
│ Creative soul   │  │                 │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ 🏫 School       │  │ 📅 Coming Up    │
│ Mrs. Cottle     │  │ Today: Soccer   │
│ Mrs. Williams   │  │ Fri: Field trip │
│ Mr. Brennan     │  │                 │
└─────────────────┘  └─────────────────┘
```

## Data Sources

| Card | Source | API |
|------|--------|-----|
| Header | Notion + family_members | /api/family + /api/admin/family |
| My To-Dos | Todoist project (Riley/Parker/Devin) | NEW: /api/kid-tasks/[name] |
| Birthday | Notion | /api/family (already has birthday) |
| Checklist | Supabase checklist_items + completions | /api/checklist |
| School | Notion | /api/family (already has school, teachers) |
| Coming Up | cached_calendar_events | /api/calendar (filtered by member) |

## Implementation Tasks

### Phase 1: Kid Tasks API (Todoist Integration)

**Task 1.1: Create kid tasks API endpoint**
- File: `app/api/kid-tasks/[name]/route.ts`
- GET: Fetch tasks from Todoist project matching kid name
- POST: Complete task by taskId
- Pattern: Copy from `/api/house-tasks/route.ts`

### Phase 2: Dashboard Components

**Task 2.1: Create KidProfileHeader component**
- File: `components/kid-profile/KidProfileHeader.tsx`
- Display: Avatar (large), name, age, grade, school
- Data: From existing Notion fetch

**Task 2.2: Create KidTodosCard component**
- File: `components/kid-profile/KidTodosCard.tsx`
- Features:
  - List tasks from Todoist
  - Checkbox to complete (optimistic update)
  - Priority color coding (red/orange/blue)
  - Loading states
- Pattern: Adapt from HouseTasks.tsx

**Task 2.3: Create BirthdayCard component**
- File: `components/kid-profile/BirthdayCard.tsx`
- Display: Birthday date, countdown ("X days!"), zodiac sign + trait
- Reuse: `getZodiacFromBirthday()` from lib/zodiac.ts
- Reuse: `getBirthdayCountdown()` from page.tsx

**Task 2.4: Create ChecklistCard component**
- File: `components/kid-profile/ChecklistCard.tsx`
- Features:
  - Collapsed: Progress bar (4/7) with percentage
  - Expanded: Full checklist items (toggleable)
  - Sync with /api/checklist (same as kiosk)
  - Celebration confetti when complete
- Pattern: Extract logic from kiosk/page.tsx

**Task 2.5: Create SchoolCard component**
- File: `components/kid-profile/SchoolCard.tsx`
- Display: School name, grade, list of teachers
- Data: From Notion (school, teachers fields)

**Task 2.6: Create ComingUpCard component**
- File: `components/kid-profile/ComingUpCard.tsx`
- Display: Next 5 calendar events for this kid
- Reuse: Logic from FamilyCalendarSection
- Simplified: No expand/collapse, just list

### Phase 3: Assemble Dashboard

**Task 3.1: Create KidProfileDashboard component**
- File: `components/kid-profile/KidProfileDashboard.tsx`
- Layout: CSS Grid (responsive)
  - Header: full width
  - To-Dos: full width
  - Birthday + Checklist: 2-column
  - School + Coming Up: 2-column
- Props: `childName`, `memberData` (from Notion)

**Task 3.2: Update profile page to use dashboard**
- File: `app/family/[name]/page.tsx`
- Replace kid-specific content with `<KidProfileDashboard />`
- Keep adult/pet logic unchanged

### Phase 4: Polish

**Task 4.1: Add touch-friendly interactions**
- 48px+ tap targets for all interactive elements
- Hover/active states for cards
- Loading skeletons

**Task 4.2: Mobile responsiveness**
- Stack cards vertically on small screens
- Adjust font sizes for readability

## File Structure

```
components/kid-profile/
├── KidProfileDashboard.tsx   # Main container with grid layout
├── KidProfileHeader.tsx      # Avatar, name, age, grade, school
├── KidTodosCard.tsx          # Todoist integration
├── BirthdayCard.tsx          # Birthday countdown + zodiac
├── ChecklistCard.tsx         # Expandable morning checklist
├── SchoolCard.tsx            # Teachers list
└── ComingUpCard.tsx          # Calendar events

app/api/kid-tasks/[name]/
└── route.ts                  # GET/POST for kid's Todoist project
```

## Key Patterns to Follow

1. **Optimistic Updates**: Complete tasks immediately, revert on error (see HouseTasks.tsx)
2. **Loading States**: Show spinner while fetching, skeleton for initial load
3. **Error Handling**: Graceful fallback if API fails (show empty state, not error)
4. **Touch Targets**: Min 48px for all buttons/checkboxes
5. **Card Consistency**: Use shadcn Card component with consistent padding/borders

## Dependencies

- Todoist projects must exist: "Riley", "Parker", "Devin"
- Existing APIs: /api/family, /api/checklist, /api/calendar
- Existing libs: lib/todoist.ts, lib/zodiac.ts, lib/calendar-colors.ts

## Verification

1. Load each kid's profile - should see all 6 cards
2. Complete a to-do item - should update in Todoist
3. Toggle checklist item - should sync with /kiosk view
4. Birthday countdown should be accurate
5. Calendar should show only that kid's events
6. Mobile view should stack cards properly
