# Unified Family Profiles Design

## Overview

Consolidate profiles, avatars, and admin settings into a unified system. Currently fragmented across:
- `children` table (kids with checklists)
- `users` table (PIN authentication)
- Notion Family Profiles (health/school data)
- Multiple avatar approaches (photos, emojis, uploads)

## Design Decisions

| Decision | Choice |
|----------|--------|
| Data source | Hybrid: Supabase for app settings, Notion for health/reference |
| Profile table | Unified `family_members` (replaces `children` + `users`) |
| Avatars | Photos for everyone, emoji fallback if none set |
| Admin UI | Single "Family" tab for all member management |
| Checklists | Independent per-person, with daily reset option |
| Notion sync | None - independent management, Notion is read-only lookup |
| Pets | Included with role='pet', no PIN/checklist |

## Data Model

### New `family_members` Table

```sql
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'adult', 'kid', 'pet')),
  pin_hash TEXT,  -- NULL for pets
  avatar_url TEXT,  -- photo path or NULL (falls back to emoji)
  has_checklist BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Updated `checklist_items` Table

Add column:
```sql
ALTER TABLE checklist_items ADD COLUMN reset_daily BOOLEAN DEFAULT true;
```

Update foreign key:
```sql
-- Change child_id to member_id referencing family_members
ALTER TABLE checklist_items RENAME COLUMN child_id TO member_id;
```

### Migration Steps

1. Create `family_members` table
2. Insert data from `users` table (Max, Alex with PINs)
3. Insert data from `children` table (Riley, Parker, Devin with avatars, has_checklist=true)
4. Insert Jaffe (role='pet', no PIN, no checklist)
5. Add `reset_daily` column to `checklist_items`
6. Update `checklist_items.child_id` → `member_id`, update foreign key
7. Update `checklist_completions` foreign key
8. Drop `children` table (after verifying migration)

### Initial Data

| Name | Role | PIN | Avatar | Has Checklist |
|------|------|-----|--------|---------------|
| Max | admin | **** | /Images/Avatars/Max.PNG | false |
| Alex | adult | **** | /Images/Avatars/Alex.PNG | false |
| Riley | kid | - | /Images/Avatars/Riley.PNG | true |
| Parker | kid | - | /Images/Avatars/Parker.PNG | true |
| Devin | kid | - | /Images/Avatars/Devin.PNG | true |
| Jaffe | pet | - | /Images/Avatars/Jaffe.PNG | false |

## Admin UI

### Tab Structure

- **Family** (new) - member management + checklists
- **Media Library** - unchanged
- **Analytics** - unchanged

Remove separate "Children & Checklists" and "Users & PINs" tabs.

### Family Tab Layout

```
┌─────────────────────────────────────────────────────────┐
│ Family Members                          [+ Add Member]  │
├─────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │ Max │ │Alex │ │Riley│ │Park.│ │Devin│ │Jaffe│       │
│ │ 👔  │ │ 👔  │ │ ✓   │ │ ✓   │ │ ✓   │ │ 🐕  │       │
│ └──┬──┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
│    │ selected                                           │
├────┴────────────────────────────────────────────────────┤
│ Profile Settings                                        │
│ ┌──────────────┐                                       │
│ │   [photo]    │  Name: [Max          ]                │
│ │  Change ▾    │  Role: [admin ▾]                      │
│ └──────────────┘  PIN:  [****] [****] (confirm)        │
│                                                         │
│ ☐ Enable checklist for this member                     │
├─────────────────────────────────────────────────────────┤
│ (Checklist section hidden if not enabled)              │
└─────────────────────────────────────────────────────────┘
```

### Checklist Item Fields

- Icon (emoji or custom image)
- Title
- Weekdays only (toggle)
- Reset daily (toggle) - NEW
- Active (toggle)
- Display order (up/down arrows)

## Components

### Shared `<Avatar>` Component

```tsx
interface AvatarProps {
  member: { name: string; role: string; avatar_url: string | null };
  size: 'sm' | 'md' | 'lg';
  className?: string;
}

// Usage
<Avatar member={member} size="md" />
```

Renders:
- Photo from `avatar_url` if set
- Role-based emoji fallback: admin/adult→👨/👩, kid→👧/👦, pet→🐕

### Component Updates

| Component | Change |
|-----------|--------|
| `FamilyCards` | Use Supabase `family_members` for avatar/role, Notion for health only |
| `KidCard` (kiosk) | Query `family_members` where `has_checklist=true` |
| `AdminPage` | Replace Children/Users tabs with unified Family tab |
| Profile page | Header from Supabase, health data from Notion |

## API Changes

### New Endpoints

**`/api/admin/family`**
- `GET` - List all family members
- `POST` - Create member
- `PUT` - Update member (name, role, avatar, PIN, has_checklist)
- `DELETE` - Remove member

### Updated Endpoints

**`/api/admin/checklist`**
- Add `reset_daily` field support

**`/api/checklist`**
- Query `family_members` instead of `children`
- Respect `reset_daily` flag for completion reset logic

### Deprecated Endpoints

- `/api/admin/children` → merge into `/api/admin/family`
- `/api/admin/users` → merge into `/api/admin/family`

## File Changes

### New Files
- `components/Avatar.tsx` - shared avatar component
- `app/api/admin/family/route.ts` - unified family CRUD

### Modified Files
- `app/admin/page.tsx` - new Family tab UI
- `components/FamilyCards.tsx` - use Supabase for member data
- `app/kiosk/page.tsx` - query family_members
- `app/api/checklist/route.ts` - use family_members
- `lib/supabase.ts` - add family member types/functions

### Files to Remove (after migration)
- `app/api/admin/children/route.ts`
- `app/api/admin/users/route.ts`

## Consistency Rules

1. **Avatars**: Always use `<Avatar>` component, never inline emoji/photo logic
2. **Member data**: Supabase is source of truth for identity, role, avatar, PIN
3. **Health data**: Always fetch from Notion by name match, never duplicate in Supabase
4. **Checklists**: Only show for members with `has_checklist=true`

## Not Changing

- Notion integration (read-only for health/school data)
- Media Library functionality
- Analytics
- PIN authentication flow
- Chat/tools system
