# Nutrition Tracker — Family HQ Module

## Overview

A nutrition tracking module where each girl (Riley, Parker, Devin) has a character avatar whose appearance shifts based on daily nutrition across 5 categories. Kids log food via one-tap visual preset cards. The family dashboard shows all three avatars side-by-side. Feedback is gentle and forward-looking — kids see the impact of what they're about to eat, not just what they already had.

## Core Experience Loop

Two modes kids naturally flow between:

**Logging mode** (what I already ate): Tap your avatar on the `/nutrition` kiosk screen → pick meal tab → tap food card → see preview of impact → confirm. Each confirmed log updates meters and avatar state instantly.

**Explorer mode** (what should I eat next): Tap any food card to see a preview panel showing how it would affect all 5 meters and the avatar state. A persistent "Power-Up Suggestion" strip at the top highlights 2-3 foods the avatar is "asking for" based on current meter levels. Every interaction is both a log and a decision-making moment.

## Avatar State System

### The 5 States

| State | Visual | Trigger |
|-------|--------|---------|
| Sunbeam | Glowing aura, floating, bright colors | All meters >60%, sugar <70% |
| Glow | Green sparkles, standing tall | All meters >25%, not all >60% |
| Flicker | Slightly muted, one area fading | Exactly one meter <25% |
| Pebble | Muted colors, sitting, thought bubble | Two or more meters <25% |
| Fizzy | Jittery, neon sparks, spinning energy | Sugar meter >70% (overrides all) |

### Priority Cascade

Evaluated top-to-bottom on every log. First match wins:

1. **Fizzy** — Sugar >70% of daily budget
2. **Pebble** — 2+ meters below 25%
3. **Flicker** — Exactly 1 meter below 25%
4. **Glow** — All meters >25%, not all >60%
5. **Sunbeam** — All meters >60% AND sugar <70%

### Needs Bubble

In Fizzy, Flicker, or Pebble states, a thought bubble appears next to the avatar showing an icon of what would help (water drop, broccoli, drumstick). Purely visual — no reading required for younger kids.

### Sunbeam Reward

Hitting Sunbeam unlocks a small daily reward — a fun fact, silly avatar animation, or collectible star. Light enough that missing it doesn't feel like punishment.

### Avatar Images

Pre-generated Gemini images, 5 per kid, stored at:
```
public/Images/Avatars/states/{kid}/{kid}_state{n}_{name}.png
```

Character designs:
- **Riley:** Older girl, long brown hair, teal and yellow outfit
- **Parker:** Middle girl, auburn wavy hair, purple and orange outfit
- **Devin:** Youngest girl, short red-orange hair, pink and green outfit

## The 5 Nutrient Meters

| Meter | Color | Direction | What It Tracks |
|-------|-------|-----------|----------------|
| Protein | Blue | Higher = better | Grams per serving |
| Veggies/Fiber | Green | Higher = better | Fiber grams + veggie servings |
| Sugar | Orange | Higher = worse | Added sugars per serving |
| Water | Light Blue | Higher = better | Hydration contribution |
| Vitamins | Yellow | Higher = better | Micronutrient density (A, C, iron, calcium) |

Sugar is the only "inverse" meter — the bar fills up as sugar is consumed, color shifts green → yellow → orange → red. The other four bars filling up is good.

## Nutrition Scoring Methodology

Each food item scored 0-3 on all five meters, derived from USDA FoodData Central and Dietary Guidelines for Americans (ages 4-13).

**Protein (grams per serving):**
- 0 = <2g | 1 = 2-7g | 2 = 8-15g | 3 = 16g+

**Veggies/Fiber (fiber grams + veggie content):**
- 0 = <1g, no veggie | 1 = 1-2g or partial veggie | 2 = 2-4g or full serving | 3 = 4g+ and vegetable-forward

**Sugar (added sugars per serving):**
- 0 = <2g | 1 = 2-6g | 2 = 7-15g | 3 = 16g+

**Water (hydration contribution):**
- 0 = negligible | 1 = some moisture | 2 = high water content | 3 = primarily hydrating

**Vitamins (micronutrient density composite):**
- 0 = minimal | 1 = 1-2 notable | 2 = good variety | 3 = micronutrient-dense

## Food Database (~120 items)

Organized across 5 meal tabs:

**Breakfast (~25):** Pancakes, waffles, French toast, eggs (scrambled/fried), oatmeal, cereal (sugary), cereal (healthy), toast, bagel, bagel with cream cheese, muffin, yogurt, yogurt parfait, breakfast burrito, bacon, sausage, hash browns, fruit salad, banana, smoothie bowl, granola bar, Pop-Tart, donut, acai bowl, overnight oats.

**Lunch (~25):** PB&J, grilled cheese, turkey sandwich, ham sandwich, chicken nuggets, mac & cheese, pizza (cheese), pizza (pepperoni), hot dog, burger, quesadilla, wrap/burrito, soup, salad, pasta with sauce, rice & beans, fish sticks, sushi/rice roll, hummus & pita, lunchable, corn dog, taco, BLT, chicken salad, sub sandwich.

**Dinner (~25):** Chicken breast/thigh, steak, salmon/fish, pork chop, meatballs, pasta with meatballs, stir fry, fried rice, roast chicken, tacos, burritos, lasagna, casserole, roasted vegetables, mashed potatoes, corn on the cob, broccoli, green beans, rice, bread roll, baked potato, curry, ramen, ribs, grilled shrimp.

**Snacks + Desserts (~25):** Apple, banana, grapes, strawberries, orange, carrots & ranch, celery & PB, cheese stick, crackers, goldfish, pretzels, trail mix, popcorn, chips, cookies, ice cream, candy, brownie, cake/cupcake, fruit snacks, rice krispie treat, popsicle, pudding, Jello, granola bar.

**Drinks (~20):** Water, milk, chocolate milk, orange juice, apple juice, lemonade, smoothie, sports drink, soda, hot chocolate, iced tea, sparkling water, coconut water, milkshake, juice box, Capri Sun, protein shake, herbal tea, lemon water, chocolate shake.

## Food Logging UI

### Kiosk Screen (`/nutrition`)

Three avatars side-by-side (mirrors the checklist kiosk pattern). Each kid taps their avatar to enter their personal logging view.

### Personal Logging View

**Top strip:** Current avatar state (~120px) on the left. Five mini meter bars on the right. Power-Up Suggestion strip below showing 2-3 recommended food cards with a one-liner like "Your character is looking for protein power."

**Meal tabs:** Five tabs — Breakfast, Lunch, Dinner, Snacks, Drinks. Grid of food cards (4 columns tablet, 3 phone). Water glass button persistent in top-right with daily counter.

**Food cards:** ~80px square. Large emoji/photo on top, short name below (max 2 words). Cards matching Power-Up Suggestions get a subtle colored border.

**Tap → Preview → Confirm flow:**
1. Tap a food card
2. Preview panel slides up from bottom: food name, its 5 nutrient contribution dots, before/after meter comparison with arrows, avatar preview morph if state would change
3. "Log it" button to confirm, "Back" to cancel

## Family Dashboard Integration

### FamilyAvatarRow Toggle

The existing `FamilyAvatarRow` on `/` gets a pill-shaped toggle (checkmark icon / fork icon):

- **Checklist mode** (morning default): Current behavior — static photos, progress rings
- **Nutrition mode** (afternoon default): State-based avatar images, five tiny colored dots below each showing meter levels at a glance

Auto-switches at noon. Manual override persists until page refresh. Tapping a kid's avatar in nutrition mode navigates to `/nutrition`.

### Parent Summary (`/parents`)

A "Nutrition" card showing per-kid data:
- Five meter bars with percentages
- Scrollable log of everything they've eaten today
- Avatar state label
- **Edit mode:** Tap "Edit" to show red X on each log entry for deletion. Deleting recomputes daily state instantly.

### Historical View (Parent)

The `nutrition_logs` table with timestamps supports roll-ups by day, week, or month for trend visibility in the parent dashboard.

## Gentle Feedback Principles

- **Never say "bad" or "too much."** Every state is framed as what the avatar *wants*.
- **Needs bubble is visual, not text.** Younger kids read the picture.
- **Daily reset is absolute.** Yesterday's Pebble is gone. No streaks that break.
- **No kid-facing history.** Parent view has trends, kids only see "today, right now, what's next."
- **Sunbeam reward is light.** Fun enough to aim for, not so valuable that missing it stings.

### State Language

| State | Message |
|-------|---------|
| Fizzy | "Whoa, your character has the zoomies! Maybe some protein to balance out?" |
| Pebble | "Your character is sleepy — they're looking for fuel!" |
| Flicker | "Almost there — your character could use some [meter icon]" |
| Glow | "Nice! Your character is growing strong today" |
| Sunbeam | "Full power! Your character is glowing!" |

## Data Model

### `nutrition_foods`
The ~120 item catalog, pre-seeded.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Display name ("PB&J") |
| emoji | text | Visual identifier |
| image_url | text | Optional photo |
| meal_categories | text[] | Array: breakfast, lunch, dinner, snack, drink |
| protein_score | int (0-3) | Protein contribution |
| veggie_score | int (0-3) | Veggie/fiber contribution |
| sugar_score | int (0-3) | Added sugar content |
| water_score | int (0-3) | Hydration contribution |
| vitamin_score | int (0-3) | Micronutrient density |

### `nutrition_logs`
One row per food item logged.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| member_id | uuid | FK to family_members |
| food_id | uuid | FK to nutrition_foods |
| meal_category | text | Which tab it was logged from |
| logged_at | timestamptz | When it was logged |

### `nutrition_daily_state`
Computed daily summary, recomputed on every log.

| Column | Type | Description |
|--------|------|-------------|
| member_id | uuid | FK to family_members |
| date | date | The day |
| protein_total | int | Sum of protein scores |
| veggie_total | int | Sum of veggie scores |
| sugar_total | int | Sum of sugar scores |
| water_total | int | Sum of water scores (includes water logs) |
| vitamin_total | int | Sum of vitamin scores |
| avatar_state | text | sunbeam/glow/flicker/pebble/fizzy |

### `nutrition_water_logs`
Separate from food — one tap = one glass.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| member_id | uuid | FK to family_members |
| logged_at | timestamptz | When the glass was logged |

## Technical Architecture

### New Routes
- `/nutrition` — Kiosk-style shared screen
- `/api/nutrition/log` — POST log food item, returns updated daily state
- `/api/nutrition/delete` — DELETE for parent edit mode
- `/api/nutrition/water` — POST log water glass
- `/api/nutrition/state/[memberId]` — GET current daily state + meters
- `/api/nutrition/history/[memberId]` — GET historical data for parent view

### New Components
- `NutritionKiosk` — Main kiosk layout, 3 avatars side-by-side
- `NutritionLogger` — Personal logging view (meal tabs, food grid, water button)
- `FoodCard` — Individual food card (emoji/image + name)
- `FoodPreview` — Bottom sheet with meter impact preview + confirm/back
- `NutritionAvatar` — State-based avatar with needs bubble overlay
- `NutritionMeters` — 5 colored bars (full in logger, mini dots on dashboard)
- `PowerUpSuggestion` — Recommended foods strip based on current meters
- `ParentNutritionCard` — Full data view for `/parents` with edit/delete

### Modified Components
- `FamilyAvatarRow` — Add checklist/nutrition toggle with time-aware default
- `Avatar` — Extend with optional `nutritionState` prop for state-based images

### No New External Dependencies
Everything is Supabase queries, CSS transitions, and static image serving.
