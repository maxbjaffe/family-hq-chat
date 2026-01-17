# Comprehensive Fixes & Features Design

**Date:** 2025-01-17
**Status:** Approved

## Overview

This design covers bug fixes and new features for Family HQ:
- 3 bug fixes (Alex profile, Todoist filtering, jokes rotation)
- 4 features (profile visibility, bigger avatars, checklist reset, day-of-week selection)

---

## Bug Fixes

### 1. Alex's Profile Matching

**Problem:** Notion has "S Alex Jaffe" - first-name match gets "S" not "Alex"

**Solution:** Match against any word in the name, not just first word.

```typescript
// Before
const memberFirstName = m.name.toLowerCase().split(' ')[0];
return m.name.toLowerCase() === searchName || memberFirstName === searchName;

// After
const nameParts = m.name.toLowerCase().split(' ');
return nameParts.some(part => part === searchName) || m.name.toLowerCase() === searchName;
```

**Files:** `app/family/[name]/page.tsx`

---

### 2. Todoist Filtering (Inverted Logic)

**Problem:** Alex can see Max's todos. Current logic excludes "Personal" project for non-Max users, but other projects should also be private.

**Solution:** Invert the logic - define shared projects, everything else is Max-only.

```typescript
// Before
const MAX_ONLY_PROJECTS = ['Personal'];
if (!isMax) {
  enrichedTasks = enrichedTasks.filter(
    task => !MAX_ONLY_PROJECTS.includes(task.project_name)
  );
}

// After
const SHARED_PROJECTS = ['House Tasks'];
if (!isMax) {
  enrichedTasks = enrichedTasks.filter(
    task => SHARED_PROJECTS.includes(task.project_name)
  );
}
```

**Files:** `lib/tool-executor.ts`

---

### 3. Jokes/Fun Facts Rotation

**Problem:** Only 3 fallback jokes, API may be failing silently.

**Solution:**
1. Expand fallbacks from 3 to 25+ jokes and facts
2. Add console logging when fallback is used
3. Verify `ANTHROPIC_API_KEY` is set in production

**Files:** `app/api/content/route.ts`

---

## New Features

### 4. Profile Data Visibility Controls

**Database Change:**
Add `profile_visibility` JSONB column to `family_members` table.

```sql
ALTER TABLE family_members
ADD COLUMN profile_visibility JSONB DEFAULT '{
  "birthday": true,
  "age": true,
  "bloodType": true,
  "allergies": true,
  "medications": true,
  "conditions": true,
  "emergencyNotes": true,
  "doctors": true,
  "patientPortal": true,
  "school": true,
  "teachers": true,
  "activities": true
}'::jsonb;
```

**Admin UI:**
- New "Profile Visibility" section when editing a family member
- 12 checkboxes in two columns:
  - Health: birthday, age, bloodType, allergies, medications, conditions, emergencyNotes, doctors, patientPortal
  - Personal: school, teachers, activities
- Changes save on toggle

**Profile Page:**
- Fetch visibility settings from Supabase
- Only render InfoCards where visibility is `true`

**Files:**
- `app/api/admin/family/route.ts` - handle visibility in GET/PUT
- `app/admin/page.tsx` - visibility checkboxes UI
- `app/family/[name]/page.tsx` - filter displayed fields
- `lib/supabase.ts` - update FamilyMember type

---

### 5. Context-Dependent Avatar Sizes

**New Size Tier:**
Add `2xl` size to Avatar component: `w-44 h-44 text-6xl` (176px)

**Size Mapping:**

| Context | Size | Pixels |
|---------|------|--------|
| Homepage kid cards | Custom (keep) | 144-176px |
| Dashboard FamilyCards | xl | 128px |
| Kiosk member select | 2xl | 176px |
| Profile page header | 2xl | 176px |
| Admin member list | md (keep) | 64px |

**FamilyCards Updates:**
- Change from `size="lg"` to `size="xl"`
- 4-column grid on desktop (was 6)
- Increase padding and gap

**Files:**
- `components/Avatar.tsx` - add 2xl size
- `components/FamilyCards.tsx` - use xl, adjust grid
- `app/kiosk/page.tsx` - use 2xl
- `app/family/[name]/page.tsx` - use Avatar component with 2xl

---

### 6. Checklist 2am EST Reset

**Problem:** Need checklist to reset at 2am EST, not midnight.

**Solution:** Modify date calculation to treat 12am-1:59am as previous day.

```typescript
function getLocalDateString(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
  };
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "12");

  let date = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

  // If before 2am, treat as previous day
  if (hour < 2) {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().split('T')[0];
}
```

**Files:** `lib/supabase.ts`

---

### 7. Day-of-Week Selection for Checklist Items

**Database Change:**
Replace `weekdays_only` boolean with `active_days` text column.

```sql
-- Add new column
ALTER TABLE checklist_items ADD COLUMN active_days TEXT;

-- Migrate existing data
UPDATE checklist_items
SET active_days = CASE
  WHEN weekdays_only = true THEN '["mon","tue","wed","thu","fri"]'
  ELSE '["mon","tue","wed","thu","fri","sat","sun"]'
END;

-- Set default for new items
ALTER TABLE checklist_items
ALTER COLUMN active_days SET DEFAULT '["mon","tue","wed","thu","fri"]';

-- Remove old column (after verification)
ALTER TABLE checklist_items DROP COLUMN weekdays_only;
```

**Admin UI:**
- 7 compact toggle buttons: M T W T F S S
- Filled = active day, outline = inactive
- Default new items: weekdays checked

**Checklist Query:**
```typescript
function getLocalDayAbbrev(): string {
  // Returns "mon", "tue", etc. in EST
}

// Filter items where today is in active_days
const today = getLocalDayAbbrev();
items.filter(item => {
  const activeDays = JSON.parse(item.active_days || '[]');
  return activeDays.includes(today);
});
```

**Files:**
- `lib/supabase.ts` - update types and query logic
- `app/api/admin/checklist/route.ts` - handle active_days
- `app/admin/page.tsx` - day toggle UI

---

## Implementation Order

1. Database migrations (profile_visibility, active_days)
2. Bug fixes (quick wins)
3. Avatar component + sizes
4. Profile visibility feature
5. Checklist day-of-week feature
6. Checklist 2am reset

---

## Migration SQL

```sql
-- Run in Supabase SQL Editor

-- 1. Profile visibility
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS profile_visibility JSONB DEFAULT '{
  "birthday": true,
  "age": true,
  "bloodType": true,
  "allergies": true,
  "medications": true,
  "conditions": true,
  "emergencyNotes": true,
  "doctors": true,
  "patientPortal": true,
  "school": true,
  "teachers": true,
  "activities": true
}'::jsonb;

-- 2. Day-of-week selection
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS active_days TEXT DEFAULT '["mon","tue","wed","thu","fri"]';

-- Migrate weekdays_only data
UPDATE checklist_items
SET active_days = CASE
  WHEN weekdays_only = true THEN '["mon","tue","wed","thu","fri"]'
  WHEN weekdays_only = false THEN '["mon","tue","wed","thu","fri","sat","sun"]'
  ELSE '["mon","tue","wed","thu","fri"]'
END
WHERE active_days IS NULL OR active_days = '["mon","tue","wed","thu","fri"]';
```
