# Comprehensive Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 bugs (Alex profile, Todoist filtering, jokes) and implement 4 features (profile visibility, avatar sizes, 2am reset, day-of-week selection)

**Architecture:** Bug fixes are direct code changes. Features require database migrations first, then TypeScript types, API updates, and UI changes.

**Tech Stack:** Next.js 16, TypeScript, Supabase (PostgreSQL), Tailwind CSS

---

## Task 1: Database Migrations

**Files:**
- Create: `scripts/migrate-comprehensive-fixes.sql`

**Step 1: Create migration file**

```sql
-- scripts/migrate-comprehensive-fixes.sql
-- Run in Supabase SQL Editor

-- 1. Profile visibility column
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

-- 2. Day-of-week selection column
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS active_days TEXT DEFAULT '["mon","tue","wed","thu","fri"]';

-- 3. Migrate existing weekdays_only data to active_days
UPDATE checklist_items
SET active_days = CASE
  WHEN weekdays_only = true THEN '["mon","tue","wed","thu","fri"]'
  WHEN weekdays_only = false THEN '["mon","tue","wed","thu","fri","sat","sun"]'
  ELSE '["mon","tue","wed","thu","fri"]'
END
WHERE active_days = '["mon","tue","wed","thu","fri"]' OR active_days IS NULL;
```

**Step 2: User runs migration in Supabase SQL Editor**

Tell user: "Please run this SQL in your Supabase SQL Editor, then confirm."

**Step 3: Commit**

```bash
git add scripts/migrate-comprehensive-fixes.sql
git commit -m "Add migration for profile_visibility and active_days columns"
```

---

## Task 2: Fix Alex Profile Matching

**Files:**
- Modify: `app/family/[name]/page.tsx:115-122`

**Step 1: Update name matching logic**

Find this code (around line 115-122):
```typescript
          // Match by first name to support both "parker" and "Parker Jaffe"
          const found = data.members?.find(
            (m: FamilyMember) => {
              const memberFirstName = m.name.toLowerCase().split(' ')[0];
              const searchName = name.toLowerCase();
              return m.name.toLowerCase() === searchName || memberFirstName === searchName;
            }
          );
```

Replace with:
```typescript
          // Match by any word in name to support "alex" matching "S Alex Jaffe"
          const found = data.members?.find(
            (m: FamilyMember) => {
              const nameParts = m.name.toLowerCase().split(' ');
              const searchName = name.toLowerCase();
              return m.name.toLowerCase() === searchName || nameParts.some(part => part === searchName);
            }
          );
```

**Step 2: Verify fix**

Run: `curl -s http://localhost:3000/family/alex -o /dev/null -w "%{http_code}"`
Expected: `200`

**Step 3: Commit**

```bash
git add app/family/\[name\]/page.tsx
git commit -m "Fix profile matching to support any word in name (Alex)"
```

---

## Task 3: Fix Todoist Filtering

**Files:**
- Modify: `lib/tool-executor.ts:26-52`

**Step 1: Update filtering logic**

Find this code (around line 26):
```typescript
// Projects that are private to Max only
const MAX_ONLY_PROJECTS = ['Personal'];
```

Replace with:
```typescript
// Only these projects are visible to non-Max users
const SHARED_PROJECTS = ['House Tasks'];
```

Find this code (around line 45-52):
```typescript
        // Filter tasks based on user
        // Max sees everything, others don't see Max's personal projects
        const isMax = userContext?.name?.toLowerCase() === 'max';
        if (!isMax) {
          enrichedTasks = enrichedTasks.filter(
            task => !MAX_ONLY_PROJECTS.includes(task.project_name)
          );
        }
```

Replace with:
```typescript
        // Filter tasks based on user
        // Max sees everything, others only see shared projects
        const isMax = userContext?.name?.toLowerCase() === 'max';
        if (!isMax) {
          enrichedTasks = enrichedTasks.filter(
            task => SHARED_PROJECTS.includes(task.project_name)
          );
        }
```

**Step 2: Commit**

```bash
git add lib/tool-executor.ts
git commit -m "Invert Todoist filtering - only House Tasks shared with non-Max users"
```

---

## Task 4: Fix Jokes/Fun Facts Rotation

**Files:**
- Modify: `app/api/content/route.ts:25-35`

**Step 1: Expand fallback jokes array**

Find `FALLBACK_JOKES` (around line 25) and replace entire array with:
```typescript
const FALLBACK_JOKES = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh!" },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems." },
  { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
  { setup: "Why can't your nose be 12 inches long?", punchline: "Because then it would be a foot!" },
  { setup: "What do you call a dinosaur that crashes their car?", punchline: "Tyrannosaurus Wrecks!" },
  { setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field!" },
  { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore!" },
  { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved!" },
  { setup: "Why did the golfer bring two pairs of pants?", punchline: "In case he got a hole in one!" },
  { setup: "What do you call a fake noodle?", punchline: "An impasta!" },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
  { setup: "What do you call a boomerang that doesn't come back?", punchline: "A stick!" },
  { setup: "Why did the cookie go to the doctor?", punchline: "Because it felt crummy!" },
  { setup: "What do you call a pig that does karate?", punchline: "A pork chop!" },
  { setup: "Why can't you give Elsa a balloon?", punchline: "Because she will let it go!" },
  { setup: "What do you call a cow with no legs?", punchline: "Ground beef!" },
  { setup: "Why did the banana go to the doctor?", punchline: "Because it wasn't peeling well!" },
  { setup: "What do you call a dog that does magic?", punchline: "A Labracadabrador!" },
  { setup: "Why did the teddy bear say no to dessert?", punchline: "She was already stuffed!" },
  { setup: "What do you call a snowman with a six-pack?", punchline: "An abdominal snowman!" },
  { setup: "Why did the student eat his homework?", punchline: "Because the teacher told him it was a piece of cake!" },
  { setup: "What do you call a train carrying bubblegum?", punchline: "A chew-chew train!" },
  { setup: "Why are ghosts bad at lying?", punchline: "Because you can see right through them!" },
];
```

**Step 2: Expand fallback facts array**

Find `FALLBACK_FACTS` (around line 31) and replace entire array with:
```typescript
const FALLBACK_FACTS = [
  { fact: "Did you know honey never spoils? Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still perfectly good to eat!", topic: "science" },
  { fact: "Did you know octopuses have three hearts? Two pump blood to the gills, and one pumps it to the rest of the body.", topic: "animals" },
  { fact: "Did you know the shortest war in history lasted only 38 minutes? It was between Britain and Zanzibar in 1896.", topic: "history" },
  { fact: "Did you know a group of flamingos is called a 'flamboyance'? They also eat with their heads upside down!", topic: "animals" },
  { fact: "Did you know that bananas are berries, but strawberries aren't? In botany, berries must have seeds inside!", topic: "science" },
  { fact: "Did you know the Eiffel Tower can grow by 6 inches in summer? The iron expands when heated by the sun!", topic: "science" },
  { fact: "Did you know dolphins sleep with one eye open? Half their brain stays awake to watch for danger!", topic: "animals" },
  { fact: "Did you know there are more stars in the universe than grains of sand on Earth? Scientists estimate about 70 sextillion stars!", topic: "space" },
  { fact: "Did you know a day on Venus is longer than its year? It takes 243 Earth days to rotate but only 225 to orbit the sun!", topic: "space" },
  { fact: "Did you know butterflies taste with their feet? They have sensors that help them find the best plants!", topic: "animals" },
  { fact: "Did you know lightning strikes Earth about 8 million times per day? That's about 100 times per second!", topic: "weather" },
  { fact: "Did you know the Great Wall of China is not visible from space with the naked eye? It's a common myth!", topic: "history" },
  { fact: "Did you know a cloud can weigh over a million pounds? They float because the water droplets are spread out!", topic: "weather" },
  { fact: "Did you know koalas sleep up to 22 hours a day? Digesting eucalyptus leaves takes a lot of energy!", topic: "animals" },
  { fact: "Did you know the ocean produces over 50% of the world's oxygen? Tiny plants called phytoplankton are the heroes!", topic: "ocean" },
  { fact: "Did you know T-Rex lived closer in time to us than to Stegosaurus? About 80 million years separated them!", topic: "dinosaurs" },
  { fact: "Did you know a jiffy is an actual unit of time? It's 1/100th of a second in computing!", topic: "science" },
  { fact: "Did you know the moon has moonquakes? They can last for hours because there's no water to dampen vibrations!", topic: "space" },
  { fact: "Did you know sea otters hold hands while sleeping? They do it so they don't drift apart!", topic: "animals" },
  { fact: "Did you know rainbows are actually full circles? We only see half because the ground gets in the way!", topic: "weather" },
  { fact: "Did you know elephants are the only animals that can't jump? Their legs are designed for strength, not bouncing!", topic: "animals" },
  { fact: "Did you know the inventor of the Pringles can is buried in one? His ashes were placed in a Pringles can!", topic: "history" },
  { fact: "Did you know a sneeze travels about 100 miles per hour? That's faster than most cars on the highway!", topic: "science" },
  { fact: "Did you know sharks have been around longer than trees? Sharks are about 400 million years old!", topic: "animals" },
  { fact: "Did you know the hottest planet isn't the closest to the sun? Venus is hotter than Mercury because of its thick atmosphere!", topic: "space" },
];
```

**Step 3: Add logging when fallback is used**

Find `catch` block in `generateJoke` (around line 55) and update:
```typescript
  } catch (e) {
    console.warn('Joke generation failed, using fallback:', e);
    return FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
  }
```

Find `catch` block in `generateFunFact` (around line 82) and update:
```typescript
  } catch (e) {
    console.warn('Fun fact generation failed, using fallback:', e);
    return FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
  }
```

**Step 4: Commit**

```bash
git add app/api/content/route.ts
git commit -m "Expand joke/fact fallbacks to 25 each with logging"
```

---

## Task 5: Add 2xl Avatar Size

**Files:**
- Modify: `components/Avatar.tsx:41-47`

**Step 1: Update AvatarSize type**

Find (around line 14):
```typescript
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

Replace with:
```typescript
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
```

**Step 2: Update SIZE_CLASSES**

Find (around line 41-47):
```typescript
const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-24 h-24 text-4xl',
  xl: 'w-32 h-32 text-5xl',
};
```

Replace with:
```typescript
const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-24 h-24 text-4xl',
  xl: 'w-32 h-32 text-5xl',
  '2xl': 'w-44 h-44 text-6xl',
};
```

**Step 3: Update Image sizes prop**

Find (around line 70):
```typescript
          sizes={size === 'xl' ? '128px' : size === 'lg' ? '96px' : size === 'md' ? '64px' : size === 'sm' ? '48px' : '32px'}
```

Replace with:
```typescript
          sizes={size === '2xl' ? '176px' : size === 'xl' ? '128px' : size === 'lg' ? '96px' : size === 'md' ? '64px' : size === 'sm' ? '48px' : '32px'}
```

**Step 4: Commit**

```bash
git add components/Avatar.tsx
git commit -m "Add 2xl avatar size (176px)"
```

---

## Task 6: Update Avatar Sizes Across App

**Files:**
- Modify: `components/FamilyCards.tsx:75,85`
- Modify: `app/kiosk/page.tsx` (Avatar usage)
- Modify: `app/family/[name]/page.tsx:175` (use Avatar component)

**Step 1: Update FamilyCards**

Find in `components/FamilyCards.tsx` (around line 75):
```typescript
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
```

Replace with:
```typescript
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
```

Find (around line 85):
```typescript
                <Avatar member={member} size="lg" className="ring-4 ring-white shadow-md" />
```

Replace with:
```typescript
                <Avatar member={member} size="xl" className="ring-4 ring-white shadow-lg" />
```

**Step 2: Update Kiosk page**

In `app/kiosk/page.tsx`, find Avatar usage and change to `size="2xl"`.

**Step 3: Commit**

```bash
git add components/FamilyCards.tsx app/kiosk/page.tsx
git commit -m "Increase avatar sizes: FamilyCards xl, Kiosk 2xl"
```

---

## Task 7: Update TypeScript Types for New Columns

**Files:**
- Modify: `lib/supabase.ts:12-20`

**Step 1: Update FamilyMember interface**

Find (around line 12-20):
```typescript
export interface FamilyMember {
  id: string;
  name: string;
  role: 'admin' | 'adult' | 'kid' | 'pet';
  pin_hash?: string | null;
  avatar_url?: string | null;
  has_checklist: boolean;
  created_at?: string;
}
```

Replace with:
```typescript
export interface ProfileVisibility {
  birthday: boolean;
  age: boolean;
  bloodType: boolean;
  allergies: boolean;
  medications: boolean;
  conditions: boolean;
  emergencyNotes: boolean;
  doctors: boolean;
  patientPortal: boolean;
  school: boolean;
  teachers: boolean;
  activities: boolean;
}

export const DEFAULT_PROFILE_VISIBILITY: ProfileVisibility = {
  birthday: true,
  age: true,
  bloodType: true,
  allergies: true,
  medications: true,
  conditions: true,
  emergencyNotes: true,
  doctors: true,
  patientPortal: true,
  school: true,
  teachers: true,
  activities: true,
};

export interface FamilyMember {
  id: string;
  name: string;
  role: 'admin' | 'adult' | 'kid' | 'pet';
  pin_hash?: string | null;
  avatar_url?: string | null;
  has_checklist: boolean;
  profile_visibility?: ProfileVisibility;
  created_at?: string;
}
```

**Step 2: Update ChecklistItem interface**

Find ChecklistItem interface and add `active_days`:
```typescript
export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  display_order: number;
  weekdays_only: boolean;
  active_days?: string; // JSON array: ["mon","tue","wed","thu","fri","sat","sun"]
  is_active: boolean;
}
```

**Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "Add TypeScript types for profile_visibility and active_days"
```

---

## Task 8: Implement 2am EST Reset Logic

**Files:**
- Modify: `lib/supabase.ts:73-88`

**Step 1: Update getLocalDateString function**

Find (around line 73-88):
```typescript
function getLocalDateString(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}
```

Replace with:
```typescript
// Get today's date in EST, treating 12am-1:59am as previous day (2am reset)
function getLocalDateString(): string {
  const now = new Date();

  // Get current hour in EST
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(hourFormatter.format(now));

  // Get date parts in EST
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // If before 2am, use yesterday's date
  let targetDate = now;
  if (hour < 2) {
    targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const parts = dateFormatter.formatToParts(targetDate);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}
```

**Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "Implement 2am EST checklist reset"
```

---

## Task 9: Add Day-of-Week Helper and Update Checklist Query

**Files:**
- Modify: `lib/supabase.ts` (add helper, update getChecklistForMember)

**Step 1: Add getLocalDayAbbrev helper after getLocalDayOfWeek**

Add after `getLocalDayOfWeek` function:
```typescript
// Get day abbreviation in EST (mon, tue, wed, thu, fri, sat, sun)
function getLocalDayAbbrev(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York",
    weekday: "short",
  };
  const dayName = new Intl.DateTimeFormat("en-US", options).format(now).toLowerCase();
  return dayName; // Returns "mon", "tue", etc.
}
```

**Step 2: Update getChecklistForMember to use active_days**

Find the query section in `getChecklistForMember` (around line 266-276):
```typescript
  let query = supabase
    .from("checklist_items")
    .select("*")
    .eq("member_id", memberId)
    .eq("is_active", true)
    .order("display_order");

  if (isWeekend) {
    query = query.eq("weekdays_only", false);
  }
```

Replace with:
```typescript
  const todayAbbrev = getLocalDayAbbrev();

  const { data: allItems, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("member_id", memberId)
    .eq("is_active", true)
    .order("display_order");

  if (itemsError) {
    console.error("Error fetching checklist items for member:", itemsError);
    return { items: [], stats: { total: 0, completed: 0, remaining: 0, isComplete: false } };
  }

  // Filter items by active_days (fallback to weekdays_only for backwards compatibility)
  const items = (allItems || []).filter(item => {
    if (item.active_days) {
      try {
        const activeDays = JSON.parse(item.active_days);
        return activeDays.includes(todayAbbrev);
      } catch {
        return true; // If parse fails, show item
      }
    }
    // Fallback to old weekdays_only logic
    if (item.weekdays_only && isWeekend) {
      return false;
    }
    return true;
  });
```

Also remove the old query execution that follows and update the rest to use `items` instead of the query result.

**Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "Implement day-of-week filtering for checklist items"
```

---

## Task 10: Update Admin API for Profile Visibility

**Files:**
- Modify: `app/api/admin/family/route.ts`

**Step 1: Update GET to include profile_visibility**

Find the select statement in GET (around line 15-17):
```typescript
      .select("id, name, role, pin_hash, avatar_url, has_checklist, created_at")
```

Replace with:
```typescript
      .select("id, name, role, pin_hash, avatar_url, has_checklist, profile_visibility, created_at")
```

**Step 2: Update PUT to handle profile_visibility**

Find the updates object building section in PUT (around line 125-139) and add after `has_checklist`:
```typescript
    if (profile_visibility !== undefined) updates.profile_visibility = profile_visibility;
```

Also update the destructuring at the top of PUT:
```typescript
    const { id, name, role, pin, avatar_url, has_checklist, profile_visibility } = body;
```

**Step 3: Commit**

```bash
git add app/api/admin/family/route.ts
git commit -m "Add profile_visibility to admin family API"
```

---

## Task 11: Update Admin API for Checklist active_days

**Files:**
- Modify: `app/api/admin/checklist/route.ts`

**Step 1: Update POST to accept active_days**

Find where new item is created and add `active_days` field with default:
```typescript
active_days: body.active_days || '["mon","tue","wed","thu","fri"]',
```

**Step 2: Update PUT to handle active_days**

Add to the updates object:
```typescript
if (body.active_days !== undefined) updates.active_days = body.active_days;
```

**Step 3: Commit**

```bash
git add app/api/admin/checklist/route.ts
git commit -m "Add active_days to checklist admin API"
```

---

## Task 12: Add Profile Visibility UI in Admin

**Files:**
- Modify: `app/admin/page.tsx`

**Step 1: Update FamilyMember interface in admin page**

Add to the interface (around line 42-51):
```typescript
  profile_visibility?: {
    birthday: boolean;
    age: boolean;
    bloodType: boolean;
    allergies: boolean;
    medications: boolean;
    conditions: boolean;
    emergencyNotes: boolean;
    doctors: boolean;
    patientPortal: boolean;
    school: boolean;
    teachers: boolean;
    activities: boolean;
  };
```

**Step 2: Add visibility toggle UI in the member editing section**

After the "Enable morning checklist" toggle, add a new section:
```tsx
{/* Profile Visibility */}
<div className="border-t pt-4 mt-4">
  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
    <Eye className="h-4 w-4" />
    Profile Visibility
  </h4>
  <p className="text-sm text-slate-500 mb-3">Choose which fields appear on this person's profile page</p>
  <div className="grid grid-cols-2 gap-2">
    {[
      { key: 'birthday', label: 'Birthday' },
      { key: 'age', label: 'Age' },
      { key: 'bloodType', label: 'Blood Type' },
      { key: 'allergies', label: 'Allergies' },
      { key: 'medications', label: 'Medications' },
      { key: 'conditions', label: 'Conditions' },
      { key: 'emergencyNotes', label: 'Emergency Notes' },
      { key: 'doctors', label: 'Doctors' },
      { key: 'patientPortal', label: 'Patient Portal' },
      { key: 'school', label: 'School' },
      { key: 'teachers', label: 'Teachers' },
      { key: 'activities', label: 'Activities' },
    ].map(({ key, label }) => (
      <label key={key} className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={member.profile_visibility?.[key as keyof typeof member.profile_visibility] ?? true}
          onChange={(e) => updateProfileVisibility(member.id, key, e.target.checked)}
          className="rounded border-slate-300"
        />
        {label}
      </label>
    ))}
  </div>
</div>
```

**Step 3: Add updateProfileVisibility function**

```typescript
async function updateProfileVisibility(memberId: string, field: string, value: boolean) {
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  const newVisibility = {
    ...(member.profile_visibility || {
      birthday: true, age: true, bloodType: true, allergies: true,
      medications: true, conditions: true, emergencyNotes: true,
      doctors: true, patientPortal: true, school: true, teachers: true, activities: true,
    }),
    [field]: value,
  };

  try {
    const res = await fetch('/api/admin/family', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: memberId, profile_visibility: newVisibility }),
    });
    if (res.ok) {
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, profile_visibility: newVisibility } : m
      ));
    }
  } catch (error) {
    console.error('Failed to update visibility:', error);
    toast.error('Failed to update visibility');
  }
}
```

**Step 4: Add Eye icon import**

Add to imports:
```typescript
import { Eye } from "lucide-react";
```

**Step 5: Commit**

```bash
git add app/admin/page.tsx
git commit -m "Add profile visibility checkboxes to admin UI"
```

---

## Task 13: Add Day-of-Week UI in Admin

**Files:**
- Modify: `app/admin/page.tsx`

**Step 1: Update ChecklistItem interface**

Add to ChecklistItem interface:
```typescript
  active_days?: string;
```

**Step 2: Add DaySelector component inside admin page**

Add this component before the main export:
```tsx
const DAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

function DaySelector({
  activeDays,
  onChange
}: {
  activeDays: string[];
  onChange: (days: string[]) => void;
}) {
  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      onChange(activeDays.filter(d => d !== day));
    } else {
      onChange([...activeDays, day]);
    }
  };

  return (
    <div className="flex gap-1">
      {DAYS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => toggleDay(key)}
          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
            activeDays.includes(key)
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

**Step 3: Add DaySelector to checklist item editing**

In the checklist item row, after the title/icon, add:
```tsx
<DaySelector
  activeDays={JSON.parse(item.active_days || '["mon","tue","wed","thu","fri"]')}
  onChange={(days) => updateItemDays(item.id, days)}
/>
```

**Step 4: Add updateItemDays function**

```typescript
async function updateItemDays(itemId: string, days: string[]) {
  try {
    const res = await fetch('/api/admin/checklist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, active_days: JSON.stringify(days) }),
    });
    if (res.ok) {
      loadMembers(); // Refresh data
    }
  } catch (error) {
    console.error('Failed to update days:', error);
    toast.error('Failed to update days');
  }
}
```

**Step 5: Add default days to new item creation**

When creating a new item, include:
```typescript
active_days: '["mon","tue","wed","thu","fri"]',
```

**Step 6: Commit**

```bash
git add app/admin/page.tsx
git commit -m "Add day-of-week selector for checklist items in admin"
```

---

## Task 14: Update Profile Page to Respect Visibility

**Files:**
- Modify: `app/family/[name]/page.tsx`

**Step 1: Fetch visibility from Supabase**

Add state for visibility:
```typescript
const [visibility, setVisibility] = useState<Record<string, boolean>>({});
```

Add fetch after loading Notion data:
```typescript
// Fetch visibility settings from Supabase
const visRes = await fetch('/api/admin/family');
if (visRes.ok) {
  const visData = await visRes.json();
  const supabaseMember = visData.members?.find(
    (m: any) => m.name.toLowerCase().split(' ').some((part: string) => part === name.toLowerCase())
  );
  if (supabaseMember?.profile_visibility) {
    setVisibility(supabaseMember.profile_visibility);
  }
}
```

**Step 2: Create conditional render helper**

```typescript
const isVisible = (field: string) => visibility[field] !== false;
```

**Step 3: Wrap InfoCards with visibility checks**

Change each InfoCard to conditionally render:
```tsx
{isVisible('birthday') && (
  <InfoCard icon={Cake} label="Birthday" value={formatBirthday(member.birthday)} />
)}
{isVisible('bloodType') && (
  <InfoCard icon={Droplets} label="Blood Type" value={member.bloodType} valueClassName="text-red-600 font-bold text-lg" />
)}
// ... etc for all fields
```

**Step 4: Commit**

```bash
git add app/family/\[name\]/page.tsx
git commit -m "Respect profile visibility settings on profile pages"
```

---

## Task 15: Final Testing and Deployment

**Step 1: Run local dev server**

```bash
npm run dev
```

**Step 2: Test each fix**

- [ ] Visit `/family/alex` - should show Alex's profile
- [ ] Login as Alex, check chat - should only see House Tasks
- [ ] Refresh homepage multiple times - jokes should vary
- [ ] Check `/dashboard` - avatars should be larger
- [ ] Check admin - profile visibility checkboxes present
- [ ] Check admin - day selector on checklist items
- [ ] Check kiosk between 12am-2am EST - should show previous day

**Step 3: Push to production**

```bash
git push origin main
```

**Step 4: Verify on production**

Check live site for all fixes working.
