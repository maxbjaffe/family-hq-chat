# Pet Profile Content Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dog facts, animal jokes, and rotating AI media to Jaffe's profile page with admin regeneration.

**Architecture:** Supabase table stores Claude-generated content. Public API returns random fact/joke. Admin API regenerates content. Profile page displays cards for pets only. Media files served from `/public/jaffe/`.

**Tech Stack:** Next.js API routes, Supabase, Claude API, Next.js Image component

---

## Task 1: Create Supabase Table

**Files:**
- Create: `supabase/migrations/20260202_pet_content.sql` (for reference, run manually)

**Step 1: Create the table in Supabase**

Run this SQL in Supabase SQL Editor:

```sql
create table pet_content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('fact', 'joke')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Index for faster random queries by type
create index pet_content_type_idx on pet_content(type);
```

**Step 2: Verify table exists**

Run in Supabase SQL Editor:
```sql
select count(*) from pet_content;
```
Expected: Returns 0 rows (empty table)

**Step 3: Commit migration file**

```bash
git add supabase/migrations/20260202_pet_content.sql
git commit -m "feat: add pet_content table migration"
```

---

## Task 2: Create Public API Endpoint

**Files:**
- Create: `app/api/pet-content/route.ts`

**Step 1: Create the API route**

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    // Get random fact
    const { data: facts, error: factError } = await supabase
      .from('pet_content')
      .select('content')
      .eq('type', 'fact')
      .limit(1)
      .order('random()');

    if (factError) throw factError;

    // Get random joke
    const { data: jokes, error: jokeError } = await supabase
      .from('pet_content')
      .select('content')
      .eq('type', 'joke')
      .limit(1)
      .order('random()');

    if (jokeError) throw jokeError;

    return NextResponse.json({
      fact: facts?.[0]?.content || null,
      joke: jokes?.[0]?.content || null,
    });
  } catch (error) {
    console.error('Error fetching pet content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pet content' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test the endpoint**

```bash
curl http://localhost:3000/api/pet-content
```
Expected: `{"fact":null,"joke":null}` (empty until content generated)

**Step 3: Commit**

```bash
git add app/api/pet-content/route.ts
git commit -m "feat: add public pet content API endpoint"
```

---

## Task 3: Create Admin Generate Endpoint

**Files:**
- Create: `app/api/admin/pet-content/route.ts`

**Step 1: Create the admin API route**

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

// GET: Return current content stats
export async function GET() {
  try {
    const { data: facts, error: factError } = await supabase
      .from('pet_content')
      .select('id')
      .eq('type', 'fact');

    const { data: jokes, error: jokeError } = await supabase
      .from('pet_content')
      .select('id')
      .eq('type', 'joke');

    if (factError || jokeError) {
      throw factError || jokeError;
    }

    return NextResponse.json({
      facts: facts?.length || 0,
      jokes: jokes?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching pet content stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

// POST: Generate new content via Claude
export async function POST() {
  try {
    const prompt = `Generate content for a family app featuring a Golden Labrador named Jaffe.

Return a JSON object with exactly this structure:
{
  "facts": ["fact1", "fact2", ...],
  "jokes": ["joke1", "joke2", ...]
}

Requirements:
- Generate exactly 50 fun facts about dogs (especially Golden Labradors/Retrievers)
- Generate exactly 50 family-friendly animal jokes (dog jokes, cat jokes, animal puns)
- Facts should be interesting, educational, and suitable for all ages
- Jokes should be clean, silly, and make kids laugh
- Keep each fact/joke to 1-2 sentences max
- No markdown, just plain text

Return ONLY the JSON object, no other text.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const parsed = JSON.parse(content.text);

    if (!Array.isArray(parsed.facts) || !Array.isArray(parsed.jokes)) {
      throw new Error('Invalid response structure');
    }

    // Delete existing content
    await supabase.from('pet_content').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new facts
    const factRows = parsed.facts.map((content: string) => ({
      type: 'fact',
      content,
    }));

    const { error: factInsertError } = await supabase
      .from('pet_content')
      .insert(factRows);

    if (factInsertError) throw factInsertError;

    // Insert new jokes
    const jokeRows = parsed.jokes.map((content: string) => ({
      type: 'joke',
      content,
    }));

    const { error: jokeInsertError } = await supabase
      .from('pet_content')
      .insert(jokeRows);

    if (jokeInsertError) throw jokeInsertError;

    return NextResponse.json({
      success: true,
      facts: parsed.facts.length,
      jokes: parsed.jokes.length,
    });
  } catch (error) {
    console.error('Error generating pet content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
```

**Step 2: Test stats endpoint**

```bash
curl http://localhost:3000/api/admin/pet-content
```
Expected: `{"facts":0,"jokes":0}`

**Step 3: Commit**

```bash
git add app/api/admin/pet-content/route.ts
git commit -m "feat: add admin pet content generation endpoint"
```

---

## Task 4: Copy and Optimize Media Files

**Files:**
- Create: `public/jaffe/` directory with media files

**Step 1: Create directory and copy files**

```bash
mkdir -p public/jaffe
```

**Step 2: Convert PNGs to WebP and copy**

```bash
# Install cwebp if needed: brew install webp
cd "/Users/max/Downloads/Jaffe Jaffe Content"

# Convert PNGs to WebP
cwebp -q 85 "Gemini_Generated_Image_4mvfl44mvfl44mvf.png" -o jaffe-1.webp
cwebp -q 85 "Gemini_Generated_Image_m9gjqdm9gjqdm9gj.png" -o jaffe-2.webp
cwebp -q 85 "Gemini_Generated_Image_q3zcc3q3zcc3q3zc.png" -o jaffe-3.webp
cwebp -q 85 "Gemini_Generated_Image_y6vm8ny6vm8ny6vm.png" -o jaffe-4.webp

# Copy to project
cp jaffe-*.webp /Users/max/Developer/active/family-hq-chat/public/jaffe/
cp "Dog_Gets_Dressed_For_School.mp4" /Users/max/Developer/active/family-hq-chat/public/jaffe/dressed-for-school.mp4
cp "Dog_Tricks_and_Dance_Video_Generation.mp4" /Users/max/Developer/active/family-hq-chat/public/jaffe/tricks-dance.mp4
```

**Step 3: Verify files**

```bash
ls -la /Users/max/Developer/active/family-hq-chat/public/jaffe/
```
Expected: 4 WebP files + 2 MP4 files

**Step 4: Commit**

```bash
git add public/jaffe/
git commit -m "feat: add Jaffe media files for pet profile"
```

---

## Task 5: Create Pet Content Cards Component

**Files:**
- Create: `components/PetContentCards.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb, Smile } from 'lucide-react';
import Image from 'next/image';

const JAFFE_MEDIA = [
  { type: 'image', src: '/jaffe/jaffe-1.webp' },
  { type: 'image', src: '/jaffe/jaffe-2.webp' },
  { type: 'image', src: '/jaffe/jaffe-3.webp' },
  { type: 'image', src: '/jaffe/jaffe-4.webp' },
  { type: 'video', src: '/jaffe/dressed-for-school.mp4' },
  { type: 'video', src: '/jaffe/tricks-dance.mp4' },
];

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className || ''}`} />
  );
}

export function PetContentCards() {
  const [fact, setFact] = useState<string | null>(null);
  const [joke, setJoke] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [media] = useState(() =>
    JAFFE_MEDIA[Math.floor(Math.random() * JAFFE_MEDIA.length)]
  );

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch('/api/pet-content');
        if (res.ok) {
          const data = await res.json();
          setFact(data.fact);
          setJoke(data.joke);
        }
      } catch (error) {
        console.error('Failed to fetch pet content:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  return (
    <div className="space-y-4 mb-6">
      {/* Fact and Joke Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fun Fact Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">Fun Fact</p>
              {loading ? (
                <Skeleton className="h-12 w-full" />
              ) : fact ? (
                <p className="font-medium text-slate-800">{fact}</p>
              ) : (
                <p className="text-slate-400 italic">No facts loaded yet</p>
              )}
            </div>
          </div>
        </Card>

        {/* Joke Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Smile className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">Joke</p>
              {loading ? (
                <Skeleton className="h-12 w-full" />
              ) : joke ? (
                <p className="font-medium text-slate-800">{joke}</p>
              ) : (
                <p className="text-slate-400 italic">No jokes loaded yet</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Media Card */}
      <Card className="p-4 overflow-hidden">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
          {media.type === 'video' ? (
            <video
              src={media.src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={media.src}
              alt="Jaffe the dog"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          )}
        </div>
      </Card>
    </div>
  );
}
```

**Step 2: Verify component compiles**

```bash
npm run build 2>&1 | grep -i "petcontent" || echo "No errors"
```

**Step 3: Commit**

```bash
git add components/PetContentCards.tsx
git commit -m "feat: add PetContentCards component for pet profiles"
```

---

## Task 6: Integrate Cards into Profile Page

**Files:**
- Modify: `app/family/[name]/page.tsx`

**Step 1: Add import at top of file**

After existing imports, add:
```typescript
import { PetContentCards } from '@/components/PetContentCards';
```

**Step 2: Add pet content cards to the profile**

Find the section around line 320-343 that handles the non-kid profile header. After the closing `</Card>` for the profile header (around line 343), add the pet content cards:

```typescript
        {/* Pet Content - Facts, Jokes, Media */}
        {avatarInfo?.role === 'pet' && (
          <PetContentCards />
        )}
```

This should be placed just after the profile header Card and before the `{/* Non-Kid View: Full Profile */}` comment.

**Step 3: Verify locally**

```bash
npm run dev
# Visit http://localhost:3000/family/jaffe
```
Expected: See fact/joke cards (with "No content" messages) and media card

**Step 4: Commit**

```bash
git add app/family/[name]/page.tsx
git commit -m "feat: integrate PetContentCards into pet profile pages"
```

---

## Task 7: Add Admin UI Section

**Files:**
- Modify: `app/admin/page.tsx`

**Step 1: Add Dog icon import**

Find the lucide-react imports (around line 6-28) and add `Dog` to the import:

```typescript
import {
  // ... existing imports
  Dog,
} from "lucide-react";
```

**Step 2: Update Tab type**

Find the type definition (around line 85):
```typescript
type Tab = "family" | "media" | "analytics";
```

Change to:
```typescript
type Tab = "family" | "media" | "analytics" | "pet-content";
```

**Step 3: Add pet content state**

After the existing state declarations (around line 201), add:

```typescript
  // Pet content state
  const [petContentStats, setPetContentStats] = useState<{ facts: number; jokes: number } | null>(null);
  const [generatingPetContent, setGeneratingPetContent] = useState(false);
  const [showPetContentConfirm, setShowPetContentConfirm] = useState(false);
```

**Step 4: Add loadPetContentStats function**

After the existing load functions (around line 410), add:

```typescript
  async function loadPetContentStats() {
    try {
      const res = await fetch('/api/admin/pet-content');
      if (res.ok) {
        const data = await res.json();
        setPetContentStats(data);
      }
    } catch (error) {
      console.error('Error loading pet content stats:', error);
    }
  }

  async function generatePetContent() {
    setGeneratingPetContent(true);
    setShowPetContentConfirm(false);
    try {
      const res = await fetch('/api/admin/pet-content', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Generated ${data.facts} facts and ${data.jokes} jokes!`);
        loadPetContentStats();
      } else {
        toast.error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating pet content:', error);
      toast.error('Failed to generate content');
    } finally {
      setGeneratingPetContent(false);
    }
  }
```

**Step 5: Load pet content stats on mount**

Find the useEffect that calls loadData() (around line 218-220). Modify it to also load pet content:

```typescript
  useEffect(() => {
    loadData();
    loadPetContentStats();
  }, []);
```

**Step 6: Add tab button**

Find the tabs section (around line 824-846). After the Analytics button, add:

```typescript
          <Button
            variant={tab === "pet-content" ? "default" : "outline"}
            onClick={() => setTab("pet-content")}
          >
            <Dog className="h-4 w-4 mr-2" />
            Pet Content
          </Button>
```

**Step 7: Add pet content tab content**

After the Analytics tab section (around line 1600), before the closing `</div>` of the container, add:

```typescript
        {/* Pet Content Tab */}
        {tab === "pet-content" && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Dog className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Pet Content</h2>
            </div>

            <p className="text-slate-600 mb-4">
              Manage fun facts and jokes displayed on Jaffe&apos;s profile page.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-700">Dog Facts</p>
                <p className="text-2xl font-bold text-amber-800">
                  {petContentStats?.facts ?? '—'}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-700">Animal Jokes</p>
                <p className="text-2xl font-bold text-purple-800">
                  {petContentStats?.jokes ?? '—'}
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={() => setShowPetContentConfirm(true)}
              disabled={generatingPetContent}
              className="w-full"
            >
              {generatingPetContent ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating... (this takes ~15 seconds)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate Content
                </>
              )}
            </Button>

            <p className="text-sm text-slate-500 mt-2">
              Uses Claude to generate 50 fresh dog facts and 50 animal jokes.
            </p>
          </Card>
        )}
```

**Step 8: Add confirmation dialog**

Find the confirmation dialogs section (around line 1606-1669). Add a new one:

```typescript
      <ConfirmDialog
        isOpen={showPetContentConfirm}
        title="Regenerate Pet Content"
        message="This will replace all existing dog facts and animal jokes with fresh content generated by Claude. This may take 10-15 seconds."
        confirmLabel="Generate"
        variant="default"
        isLoading={generatingPetContent}
        onConfirm={generatePetContent}
        onCancel={() => setShowPetContentConfirm(false)}
      />
```

**Step 9: Verify locally**

```bash
npm run dev
# Visit http://localhost:3000/admin
# Click "Pet Content" tab
```
Expected: See stats (0/0) and Generate button

**Step 10: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add Pet Content admin section"
```

---

## Task 8: Test Full Flow

**Step 1: Generate content via admin**

1. Go to http://localhost:3000/admin
2. Click "Pet Content" tab
3. Click "Regenerate Content"
4. Wait ~15 seconds for Claude to generate content
5. Verify stats show 50/50

**Step 2: Verify profile page**

1. Go to http://localhost:3000/family/jaffe
2. Verify fact card shows a random dog fact
3. Verify joke card shows a random animal joke
4. Verify media card shows an image or video
5. Refresh page - content should change

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete pet profile content feature"
```

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/20260202_pet_content.sql` | Created (reference) |
| `app/api/pet-content/route.ts` | Created |
| `app/api/admin/pet-content/route.ts` | Created |
| `public/jaffe/*.webp` | Created (4 files) |
| `public/jaffe/*.mp4` | Created (2 files) |
| `components/PetContentCards.tsx` | Created |
| `app/family/[name]/page.tsx` | Modified |
| `app/admin/page.tsx` | Modified |
