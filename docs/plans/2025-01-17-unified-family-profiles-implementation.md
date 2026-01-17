# Unified Family Profiles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate `children` and `users` tables into unified `family_members` table with consistent avatars and admin UI.

**Architecture:** Single `family_members` table in Supabase replaces both `children` and `users`. Shared `<Avatar>` component for consistent display. Admin page gets unified "Family" tab. Notion remains read-only for health data.

**Tech Stack:** Next.js 16, Supabase, TypeScript, Tailwind CSS

---

## Task 1: Create Database Migration SQL

**Files:**
- Create: `scripts/migrate-to-family-members.sql`

**Step 1: Write the migration SQL**

```sql
-- scripts/migrate-to-family-members.sql

-- 1. Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'adult', 'kid', 'pet')),
  pin_hash TEXT,
  avatar_url TEXT,
  has_checklist BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add reset_daily column to checklist_items
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS reset_daily BOOLEAN DEFAULT true;

-- 3. Add member_id column to checklist_items (will replace child_id)
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES family_members(id);

-- 4. Add member_id column to checklist_completions
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES family_members(id);

-- 5. Migrate users to family_members (adults with PINs)
INSERT INTO family_members (id, name, role, pin_hash, avatar_url, has_checklist, created_at)
SELECT
  id,
  name,
  role,
  pin_hash,
  NULL as avatar_url,
  false as has_checklist,
  created_at
FROM users
ON CONFLICT (id) DO NOTHING;

-- 6. Migrate children to family_members
INSERT INTO family_members (id, name, role, pin_hash, avatar_url, has_checklist, created_at)
SELECT
  id,
  name,
  'kid' as role,
  NULL as pin_hash,
  avatar_data as avatar_url,
  true as has_checklist,
  created_at
FROM children
ON CONFLICT (id) DO NOTHING;

-- 7. Update checklist_items.member_id from child_id
UPDATE checklist_items
SET member_id = child_id
WHERE child_id IS NOT NULL AND member_id IS NULL;

-- 8. Update checklist_completions.member_id from child_id
UPDATE checklist_completions
SET member_id = child_id
WHERE child_id IS NOT NULL AND member_id IS NULL;

-- 9. Add Jaffe (pet) - use a generated UUID
INSERT INTO family_members (name, role, pin_hash, avatar_url, has_checklist)
VALUES ('Jaffe', 'pet', NULL, '/Images/Avatars/Jaffe.PNG', false)
ON CONFLICT DO NOTHING;

-- NOTE: After verifying migration, run cleanup:
-- ALTER TABLE checklist_items DROP COLUMN child_id;
-- ALTER TABLE checklist_completions DROP COLUMN child_id;
-- DROP TABLE children;
-- (Keep users table for now as backup)
```

**Step 2: Commit**

```bash
git add scripts/migrate-to-family-members.sql
git commit -m "Add database migration script for family_members table"
```

---

## Task 2: Create Shared Avatar Component

**Files:**
- Create: `components/Avatar.tsx`

**Step 1: Create the Avatar component**

```tsx
// components/Avatar.tsx
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  admin: 'from-blue-500 to-indigo-600',
  adult: 'from-pink-500 to-rose-600',
  kid: 'from-purple-500 to-violet-600',
  pet: 'from-amber-500 to-orange-600',
  default: 'from-slate-500 to-slate-600',
};

const ROLE_EMOJI: Record<string, string> = {
  admin: '👨',
  adult: '👩',
  kid: '👧',
  pet: '🐕',
  default: '👤',
};

interface AvatarProps {
  member: {
    name: string;
    role: string;
    avatar_url?: string | null;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-24 h-24 text-4xl',
  xl: 'w-32 h-32 text-5xl',
};

export function Avatar({ member, size = 'md', className }: AvatarProps) {
  const gradient = ROLE_COLORS[member.role] || ROLE_COLORS.default;
  const emoji = ROLE_EMOJI[member.role] || ROLE_EMOJI.default;
  const sizeClass = sizeClasses[size];

  if (member.avatar_url) {
    return (
      <div className={cn('rounded-full overflow-hidden', sizeClass, className)}>
        <img
          src={member.avatar_url}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center bg-gradient-to-br',
        gradient,
        sizeClass,
        className
      )}
    >
      {emoji}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/Avatar.tsx
git commit -m "Add shared Avatar component with photo/emoji fallback"
```

---

## Task 3: Add FamilyMember Types to Supabase Lib

**Files:**
- Modify: `lib/supabase.ts`

**Step 1: Add FamilyMember interface and functions**

Add after the existing `User` interface (around line 10):

```typescript
// Family member types (unified from children + users)
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

Add after `getAllUsers()` function (around line 306):

```typescript
// Family member functions
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching family members:', error);
    return [];
  }

  return (data || []) as FamilyMember[];
}

export async function getFamilyMembersWithChecklists(): Promise<FamilyMember[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('has_checklist', true)
    .order('name');

  if (error) {
    console.error('Error fetching family members with checklists:', error);
    return [];
  }

  return (data || []) as FamilyMember[];
}

export async function getFamilyMemberByPin(pin: string): Promise<FamilyMember | null> {
  const supabase = getFamilyDataClient();
  const pinHash = hashPin(pin);

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('pin_hash', pinHash)
    .single();

  if (error || !data) return null;
  return data as FamilyMember;
}

export async function getChecklistForMember(memberId: string): Promise<{
  items: (ChecklistItem & { isCompleted: boolean })[];
  stats: { total: number; completed: number; remaining: number; isComplete: boolean };
}> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();
  const dayOfWeek = getLocalDayOfWeek();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let query = supabase
    .from('checklist_items')
    .select('*')
    .eq('member_id', memberId)
    .eq('is_active', true)
    .order('display_order');

  if (isWeekend) {
    query = query.eq('weekdays_only', false);
  }

  const { data: items, error: itemsError } = await query;

  if (itemsError) {
    console.error('Error fetching checklist items:', itemsError);
    return { items: [], stats: { total: 0, completed: 0, remaining: 0, isComplete: false } };
  }

  const { data: completions } = await supabase
    .from('checklist_completions')
    .select('item_id')
    .eq('member_id', memberId)
    .eq('completion_date', today);

  const completedItemIds = new Set(completions?.map((c) => c.item_id) || []);

  const enrichedItems = (items || []).map((item) => ({
    ...item,
    isCompleted: completedItemIds.has(item.id),
  }));

  const stats = {
    total: enrichedItems.length,
    completed: enrichedItems.filter((item) => item.isCompleted).length,
    remaining: enrichedItems.filter((item) => !item.isCompleted).length,
    isComplete: enrichedItems.length > 0 && enrichedItems.every((item) => item.isCompleted),
  };

  return { items: enrichedItems, stats };
}

export async function toggleMemberChecklistItem(
  memberId: string,
  itemId: string,
  isCurrentlyCompleted: boolean
): Promise<boolean> {
  const supabase = getFamilyDataClient();
  const today = getLocalDateString();

  if (isCurrentlyCompleted) {
    const { error } = await supabase
      .from('checklist_completions')
      .delete()
      .eq('member_id', memberId)
      .eq('item_id', itemId)
      .eq('completion_date', today);

    return !error;
  } else {
    const { error } = await supabase.from('checklist_completions').insert({
      member_id: memberId,
      item_id: itemId,
      completion_date: today,
      user_id: FAMILY_USER_ID,
    });

    return !error;
  }
}
```

**Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "Add FamilyMember types and functions to supabase lib"
```

---

## Task 4: Create Family Admin API

**Files:**
- Create: `app/api/admin/family/route.ts`

**Step 1: Create the API route**

```typescript
// app/api/admin/family/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';
import { createHash } from 'crypto';

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

// GET - Fetch all family members with their checklist items
export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching family members:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch checklist items for members with checklists
    const membersWithItems = await Promise.all(
      (members || []).map(async (member) => {
        if (!member.has_checklist) {
          return { ...member, checklist_items: [] };
        }

        const { data: items } = await supabase
          .from('checklist_items')
          .select('id, title, icon, display_order, weekdays_only, is_active, reset_daily')
          .eq('member_id', member.id)
          .order('display_order');

        return { ...member, checklist_items: items || [] };
      })
    );

    return NextResponse.json({ members: membersWithItems });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new family member
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { name, role, pin, avatar_url, has_checklist } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    // Validate PIN for non-pet roles
    if (role !== 'pet' && pin) {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('family_members')
      .insert({
        name,
        role,
        pin_hash: pin ? hashPin(pin) : null,
        avatar_url: avatar_url || null,
        has_checklist: has_checklist || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating family member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a family member
export async function PUT(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { id, name, role, pin, avatar_url, has_checklist } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (has_checklist !== undefined) updates.has_checklist = has_checklist;

    // Handle PIN update
    if (pin !== undefined) {
      if (pin === null || pin === '') {
        updates.pin_hash = null;
      } else {
        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
          return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
        }
        updates.pin_hash = hashPin(pin);
      }
    }

    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating family member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a family member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Delete associated checklist items first
    await supabase.from('checklist_completions').delete().eq('member_id', id);
    await supabase.from('checklist_items').delete().eq('member_id', id);

    const { error } = await supabase.from('family_members').delete().eq('id', id);

    if (error) {
      console.error('Error deleting family member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/family/route.ts
git commit -m "Add unified family admin API endpoint"
```

---

## Task 5: Update Checklist API to Use Family Members

**Files:**
- Modify: `app/api/checklist/route.ts`

**Step 1: Update the API to use family_members**

Replace the entire file:

```typescript
// app/api/checklist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFamilyMembersWithChecklists, getChecklistForMember, toggleMemberChecklistItem } from '@/lib/supabase';

export async function GET() {
  try {
    const members = await getFamilyMembersWithChecklists();

    // Fetch checklist data for each member
    const membersWithChecklists = await Promise.all(
      members.map(async (member) => {
        const { items, stats } = await getChecklistForMember(member.id);
        return {
          id: member.id,
          name: member.name,
          role: member.role,
          avatar_url: member.avatar_url,
          checklist: items,
          stats,
        };
      })
    );

    return NextResponse.json({ members: membersWithChecklists });
  } catch (error) {
    console.error('Error fetching checklist data:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { memberId, itemId, isCompleted } = await request.json();

    if (!memberId || !itemId || typeof isCompleted !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await toggleMemberChecklistItem(memberId, itemId, isCompleted);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling checklist item:', error);
    return NextResponse.json({ error: 'Failed to toggle checklist item' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/checklist/route.ts
git commit -m "Update checklist API to use family_members table"
```

---

## Task 6: Update Checklist Admin API for reset_daily

**Files:**
- Modify: `app/api/admin/checklist/route.ts`

**Step 1: Update POST to include reset_daily and use member_id**

Find the POST handler and update the insert to include `reset_daily` and use `member_id`:

```typescript
// In POST handler, update the insert object:
const { data, error } = await supabase
  .from('checklist_items')
  .insert({
    member_id: member_id || child_id, // Support both during transition
    title: title.trim(),
    icon: icon || null,
    weekdays_only: weekdays_only || false,
    reset_daily: reset_daily !== false, // Default to true
    display_order: maxOrder + 1,
    is_active: true,
  })
  .select()
  .single();
```

**Step 2: Update PUT to include reset_daily**

```typescript
// In PUT handler, add reset_daily to updates:
if (reset_daily !== undefined) updates.reset_daily = reset_daily;
```

**Step 3: Commit**

```bash
git add app/api/admin/checklist/route.ts
git commit -m "Add reset_daily support to checklist admin API"
```

---

## Task 7: Update Kiosk Page to Use Family Members

**Files:**
- Modify: `app/kiosk/page.tsx`

**Step 1: Update the interface**

Replace `ChildData` interface with:

```typescript
interface MemberData {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  checklist: ChecklistItem[];
  stats: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}
```

**Step 2: Update state and data loading**

Replace `children` state with `members`:

```typescript
const [members, setMembers] = useState<MemberData[]>([]);
```

Update `loadData`:

```typescript
const loadData = useCallback(async () => {
  startSync();
  try {
    const response = await fetch('/api/checklist');
    if (response.ok) {
      const data = await response.json();
      setMembers(data.members || []);
      endSync(true);
    } else {
      endSync(false);
    }
  } catch (error) {
    console.error('Error loading checklist data:', error);
    endSync(false);
  } finally {
    setLoading(false);
  }
}, []);
```

**Step 3: Update toggleItem to use memberId**

```typescript
async function toggleItem(memberId: string, itemId: string, isCurrentlyCompleted: boolean) {
  // ... update all references from childId to memberId
  // ... update API call body to use memberId instead of childId
  body: JSON.stringify({ memberId, itemId, isCompleted: isCurrentlyCompleted }),
}
```

**Step 4: Update the render to use members and Avatar component**

Import Avatar component and update the map to use `members` instead of `children`, using `<Avatar>` for display.

**Step 5: Commit**

```bash
git add app/kiosk/page.tsx
git commit -m "Update kiosk to use family_members and Avatar component"
```

---

## Task 8: Update FamilyCards to Use Supabase

**Files:**
- Modify: `components/FamilyCards.tsx`

**Step 1: Update to fetch from Supabase API**

Replace the fetch URL and update to use family members:

```typescript
const res = await fetch('/api/admin/family');
if (res.ok) {
  const data = await res.json();
  setMembers(data.members || []);
}
```

**Step 2: Import and use Avatar component**

```typescript
import { Avatar } from '@/components/Avatar';

// In render, replace emoji avatar with:
<Avatar member={member} size="md" />
```

**Step 3: Commit**

```bash
git add components/FamilyCards.tsx
git commit -m "Update FamilyCards to use Supabase family_members"
```

---

## Task 9: Update Admin Page with Unified Family Tab

**Files:**
- Modify: `app/admin/page.tsx`

This is a large refactor. Key changes:

**Step 1: Update Tab type**

```typescript
type Tab = 'family' | 'media' | 'analytics';
```

**Step 2: Consolidate state**

Remove separate `children` and `users` state, use single `members` state.

**Step 3: Update loadData to use family API**

```typescript
const response = await fetch('/api/admin/family');
const data = await response.json();
setMembers(data.members || []);
```

**Step 4: Create unified Family tab UI**

- Member selector grid with Avatar component
- Profile settings section (name, role, avatar, PIN for non-pets)
- Checklist toggle and items section
- Add reset_daily toggle to checklist item editor

**Step 5: Commit**

```bash
git add app/admin/page.tsx
git commit -m "Consolidate admin page to unified Family tab"
```

---

## Task 10: Update Auth to Use Family Members

**Files:**
- Modify: `app/api/auth/verify-pin/route.ts`
- Modify: `lib/supabase.ts`

**Step 1: Update getUserByPin to use family_members**

In `lib/supabase.ts`, update or add:

```typescript
export async function getUserByPin(pin: string): Promise<User | null> {
  const member = await getFamilyMemberByPin(pin);
  if (!member) return null;

  return {
    id: member.id,
    name: member.name,
    role: member.role as 'admin' | 'adult' | 'kid',
    integrations: {},
  };
}
```

**Step 2: Commit**

```bash
git add lib/supabase.ts app/api/auth/verify-pin/route.ts
git commit -m "Update auth to use family_members table"
```

---

## Task 11: Run Migration and Test

**Step 1: Run migration in Supabase**

Copy contents of `scripts/migrate-to-family-members.sql` and run in Supabase SQL editor.

**Step 2: Verify data migrated**

```sql
SELECT * FROM family_members;
SELECT * FROM checklist_items WHERE member_id IS NOT NULL;
```

**Step 3: Test the app locally**

```bash
npm run dev
```

Test:
- Admin → Family tab shows all members
- Kiosk shows kids with checklists
- Dashboard FamilyCards shows all members
- PIN login works
- Checklist completion works

**Step 4: Commit any fixes**

---

## Task 12: Cleanup Deprecated Code

**Files:**
- Delete: `app/api/admin/children/route.ts`
- Delete: `app/api/admin/users/route.ts`

**Step 1: Delete old API routes**

```bash
rm app/api/admin/children/route.ts
rm app/api/admin/users/route.ts
```

**Step 2: Remove old functions from supabase.ts**

Remove `getChildren()` function (replaced by `getFamilyMembersWithChecklists`).

**Step 3: Commit**

```bash
git add -A
git commit -m "Remove deprecated children and users API routes"
```

---

## Task 13: Deploy and Verify

**Step 1: Push to deploy**

```bash
git push
```

**Step 2: Verify on production**

- Check admin panel
- Check kiosk
- Check dashboard
- Test PIN login
- Test checklist completion

---

## Summary

| Task | Description | Est. Complexity |
|------|-------------|-----------------|
| 1 | Create migration SQL | Low |
| 2 | Create Avatar component | Low |
| 3 | Add FamilyMember types | Medium |
| 4 | Create family admin API | Medium |
| 5 | Update checklist API | Low |
| 6 | Add reset_daily support | Low |
| 7 | Update kiosk page | Medium |
| 8 | Update FamilyCards | Low |
| 9 | Update admin page | High |
| 10 | Update auth | Low |
| 11 | Run migration & test | Medium |
| 12 | Cleanup deprecated code | Low |
| 13 | Deploy & verify | Low |
