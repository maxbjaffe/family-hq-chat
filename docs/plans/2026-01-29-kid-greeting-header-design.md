# Kid Greeting Header Design

## Goal
Replace the plain profile header for kids with a whimsical, fun greeting card featuring:
- Personalized time-of-day greeting ("Good morning, Riley!")
- Rotating positivity quotes from curated lists
- Playful decorative elements (confetti, hearts, lightning, smileys)
- Random color palette each visit
- Larger avatar with rounded corners (not circular crop)

## Design

```
┌─────────────────────────────────────────────────────┐
│  ⚡        ✨                               💖     │
│        ┌────────────┐                              │
│        │            │   Good morning, Riley!       │
│        │   Avatar   │                              │
│        │  (large)   │   "You've got the power to   │
│  🎊    └────────────┘    make today amazing!"  ⚡  │
│                                               😊   │
└─────────────────────────────────────────────────────┘
```

## Specifications

### Time-of-Day Greetings
| Time Range | Greeting |
|------------|----------|
| 5am - 12pm | "Good morning, [Name]!" |
| 12pm - 5pm | "Hey [Name]!" |
| 5pm - 9pm | "Good evening, [Name]!" |
| 9pm - 5am | "Hey there, [Name]!" |

### Quote Categories
- Morning quotes (~20): Energizing, start-the-day messages
- Afternoon quotes (~20): Keep-going, encouragement messages
- Evening quotes (~20): Wind-down, reflection messages

Selection: Random from time-appropriate array on each page load.

### Color Palettes (Random Rotation)
| Name | Background | Accent | Vibe |
|------|------------|--------|------|
| Sunset | #FFF5E6 | #FF6B6B | Warm, energetic |
| Ocean | #E6F7FF | #4ECDC4 | Cool, calm |
| Berry | #F5E6FF | #9B59B6 | Playful, creative |
| Citrus | #FFFBE6 | #F39C12 | Bright, cheerful |
| Mint | #E6FFF5 | #2ECC71 | Fresh, lively |

### Decorative Elements
- Icons: ⚡ 💖 🎊 😊 ✨
- Count: 6-8 elements per card
- Sizes: 16px (small), 20px (medium), 24px (large)
- Positioning: Absolute, scattered around card edges
- Style: Slight rotation for playful feel

### Avatar Changes
- Shape: Rounded rectangle (`rounded-2xl`) instead of circle
- Size: ~100-120px (larger than current 80px)
- Full image visible, no cropping

## Implementation

### New Files

**`lib/kid-quotes.ts`**
- `morningQuotes`, `afternoonQuotes`, `eveningQuotes` arrays
- `getTimeOfDay()` → 'morning' | 'afternoon' | 'evening' | 'night'
- `getGreeting(name: string)` → time-appropriate greeting
- `getRandomQuote()` → random quote for current time

**`components/kid-profile/KidGreetingHeader.tsx`**
- Props: `name`, `avatarInfo`, `age`
- Random palette selection on mount
- Renders decorated card with avatar, greeting, quote

### Modified Files

**`components/Avatar.tsx`**
- Add `shape?: 'circle' | 'rounded'` prop
- Default: `'circle'` (no breaking changes)
- `'rounded'` uses `rounded-2xl`

**`app/family/[name]/page.tsx`**
- Import `KidGreetingHeader`
- For kids: use `KidGreetingHeader` instead of plain Card (lines 309-331)
- Non-kids: unchanged

## Verification
1. Load each kid's profile (Riley, Parker, Devin)
2. Verify greeting matches time of day
3. Refresh page — quote should change randomly
4. Refresh page — color palette should occasionally change
5. Avatar displays full image with rounded corners
6. Decorative elements visible around card edges
7. Mobile view looks good (responsive)
