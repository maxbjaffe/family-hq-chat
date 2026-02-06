# Checklist Persistence QA Debug Guide

## Issue
Kids check off items but they don't persist when navigating away and back.

---

## Step 1: Verify Database Schema

Run in Supabase SQL Editor:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'checklist_completions'
ORDER BY ordinal_position;

-- Check for any constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'checklist_completions';
```

**Expected columns:**
- `id` (uuid)
- `member_id` (uuid)
- `item_id` (uuid)
- `completion_date` (date or text)
- `user_id` (uuid)
- `created_at` (timestamp)

**Red flags:**
- Missing `member_id` column
- Both `child_id` AND `member_id` columns exist
- Unique constraint on (member_id, item_id, completion_date)

---

## Step 2: Check Recent Completions

```sql
-- See all completions from today
SELECT * FROM checklist_completions
WHERE completion_date = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 20;

-- See completions from last 7 days
SELECT completion_date, COUNT(*) as count
FROM checklist_completions
WHERE completion_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY completion_date
ORDER BY completion_date DESC;
```

**What to look for:**
- Are records being created at all?
- Is `member_id` populated or NULL?
- What format is `completion_date`? (YYYY-MM-DD expected)

---

## Step 3: Test Toggle Flow Manually

1. Open browser DevTools → Network tab
2. Go to https://family.maxjaffe.ai/kiosk
3. Check off an item
4. Look for POST request to `/api/checklist`
5. Check response:
   - Status 200 with `{"success": true}` = good
   - Status 500 = server error
   - Check response body for error details

---

## Step 4: Check Vercel Logs

1. Go to https://vercel.com/maxbjaffe/family-hq-chat/logs
2. Filter by "Checklist" or look for recent function invocations
3. Look for log entries:
   - `[Checklist API] Toggle request:` - shows incoming request
   - `[toggleMemberChecklistItem] Insert success:` - DB write worked
   - `[toggleMemberChecklistItem] Insert error:` - DB write failed
   - `[getChecklistForMember] Fetched completions:` - what's being read

**Common issues revealed:**
- `Insert error: duplicate key` = unique constraint violation
- `Insert error: null value in column "user_id"` = missing required field
- `Fetched completions: count: 0` but items were just checked = date mismatch

---

## Step 5: Test Date Consistency

```sql
-- Check what dates exist in completions
SELECT DISTINCT completion_date,
       LENGTH(completion_date::text) as date_length
FROM checklist_completions
ORDER BY completion_date DESC
LIMIT 10;
```

**What to verify:**
- All dates are in `YYYY-MM-DD` format
- No timezone-shifted dates (e.g., `2026-02-05` vs `2026-02-06`)

---

## Step 6: Test Member ID Validity

```sql
-- Check if member_ids in completions exist in family_members
SELECT cc.member_id, fm.name
FROM checklist_completions cc
LEFT JOIN family_members fm ON cc.member_id = fm.id
WHERE cc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
LIMIT 20;
```

**Red flag:** Any rows where `name` is NULL = orphaned completion records

---

## Step 7: Reproduce and Capture

1. Open two browser tabs:
   - Tab 1: https://family.maxjaffe.ai/kiosk
   - Tab 2: Supabase → checklist_completions table

2. In Tab 1: Check off "Make Bed" for Riley

3. In Tab 2: Refresh and look for new row with:
   - `member_id` = Riley's ID
   - `completion_date` = today's date
   - `item_id` = Make Bed's ID

4. In Tab 1: Navigate to home (`/`) then back to `/kiosk`

5. Is "Make Bed" still checked?
   - YES = works correctly
   - NO = something deleted it or date mismatch

6. In Tab 2: Is the row still there?
   - YES = frontend fetch issue
   - NO = something deleted it

---

## Step 8: Check for RLS Policies

```sql
-- Check Row Level Security policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'checklist_completions';
```

**Issue:** RLS policies might be blocking reads/writes for the service key.

---

## Quick Fixes to Try

### A. Disable RLS temporarily (for testing)
```sql
ALTER TABLE checklist_completions DISABLE ROW LEVEL SECURITY;
```

### B. Check user_id requirement
```sql
-- See if user_id has a NOT NULL constraint
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'checklist_completions' AND column_name = 'user_id';
```

### C. Verify the FAMILY_USER_ID is valid
```sql
-- Check if the hardcoded user ID exists
SELECT * FROM users WHERE id = '00879c1b-a586-4d52-96be-8f4b7ddf7257';
```

---

## Resolution Checklist

- [ ] Verified table has `member_id` column (not just `child_id`)
- [ ] Verified no RLS blocking service key
- [ ] Verified `user_id` column accepts the FAMILY_USER_ID
- [ ] Verified date format matches between insert and select
- [ ] Verified no unique constraint causing silent failures
- [ ] Tested in production with network tab open
- [ ] Checked Vercel logs for errors
