# Word Games Design: Word Search, Anagrams, Word Ladder

## Overview

Three new word games for the Breaktime section, each with easy/medium/hard difficulty. Touch-optimized for family kiosk use.

---

## Word Search

**Grid Configuration:**
| Difficulty | Grid | Words | Word Length | Directions |
|------------|------|-------|-------------|------------|
| Easy | 8×8 | 5 words | 3-4 letters | Horizontal, Vertical |
| Medium | 10×10 | 7 words | 4-5 letters | + Diagonal |
| Hard | 12×12 | 10 words | 5-7 letters | + Reverse |

**Touch Interaction:**
- Drag finger across letters to select
- Line snaps to valid directions
- Found words highlight green and cross off list

**UI Layout:**
- Word list above grid (scrollable on mobile)
- Grid cells minimum 44px for touch targets
- Progress: "3 of 7 words found"
- Celebration animation on completion

---

## Anagrams

**Configuration:**
| Difficulty | Letters | Target Words |
|------------|---------|--------------|
| Easy | 5 letters | Find 3 words |
| Medium | 6 letters | Find 5 words |
| Hard | 7 letters | Find 7 words |

**Mechanics:**
- Tap letter tiles to build word in answer area
- Tap placed tiles to return to pool
- Submit checks validity and uniqueness
- Invalid: shake animation, tiles return
- Valid: word added to found list, tiles reset

**UI Layout:**
- Letter tiles: ~60px circular buttons
- Answer area: horizontal slots
- Found words list with checkmarks
- Shuffle button to rearrange letters (unlimited)
- Only count words 3+ letters

---

## Word Ladder

**Configuration:**
| Difficulty | Word Length | Par (steps) | Example |
|------------|-------------|-------------|---------|
| Easy | 3 letters | 3-4 | CAT → COT → COG → DOG |
| Medium | 4 letters | 4-5 | COLD → CORD → CARD → WARD → WARM |
| Hard | 5 letters | 5-6 | BRAIN → TRAIN → TRAIT → TREAT → GREAT |

**Mechanics:**
- START word locked at top, END word at bottom
- Player fills middle rungs
- Each word must differ by exactly one letter
- Immediate validation on submit
- Any valid path accepted (not just optimal)

**UI Layout:**
- Vertical ladder visualization
- On-screen keyboard (reuse Wordle pattern)
- Move counter: "Moves: 4 | Par: 4"
- Celebrate if at or under par

---

## Data Structure

**lib/game-words.ts** - Add word search words:
```typescript
export const WORD_SEARCH_WORDS: Record<Difficulty, string[]> = {
  easy: ['CAT', 'DOG', 'SUN', ...],      // 3-4 letters, 50+
  medium: ['APPLE', 'HOUSE', ...],        // 4-5 letters, 50+
  hard: ['PLANET', 'GARDEN', ...],        // 5-7 letters, 50+
};
```

**lib/anagram-puzzles.ts** - Pre-computed puzzles:
```typescript
interface AnagramPuzzle {
  letters: string;
  words: string[];  // All valid words 3+ letters
}
export const ANAGRAM_PUZZLES: Record<Difficulty, AnagramPuzzle[]>;
```

**lib/word-ladder-puzzles.ts** - Pre-computed ladders:
```typescript
interface LadderPuzzle {
  start: string;
  end: string;
  par: number;
}
export const WORD_LADDER_PUZZLES: Record<Difficulty, LadderPuzzle[]>;
```

---

## Files

**New:**
- `components/games/WordSearchGame.tsx`
- `components/games/AnagramsGame.tsx`
- `components/games/WordLadderGame.tsx`
- `lib/word-search-generator.ts`
- `lib/anagram-puzzles.ts`
- `lib/word-ladder-puzzles.ts`

**Modified:**
- `app/games/page.tsx` - Add 3 games to menu
- `lib/game-words.ts` - Add WORD_SEARCH_WORDS

---

## Implementation Order

1. Word lists and puzzle data (foundation)
2. Word Search (most visual, good first win)
3. Anagrams (simpler logic)
4. Word Ladder (most complex validation)
5. Update games page menu
