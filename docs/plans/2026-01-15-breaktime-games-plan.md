# Break Time Games Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add difficulty levels to Wordle and Hangman, expand word lists, add word validation to Wordle, and redesign Hangman with rotating character types.

**Architecture:** Centralize word lists in lib/, create shared DifficultySelect component, add character components for Hangman visual variants. Games page manages difficulty state and passes to game components.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui

---

## Task 1: Create Word Lists

**Files:**
- Create: `lib/game-words.ts`

**Steps:**
1. Create file with `WORDLE_WORDS` object containing `easy`, `medium`, `hard` arrays (~100-150 words each)
2. Add `HANGMAN_WORDS` object with difficulty levels, each containing categorized words
3. Export TypeScript types for difficulties
4. Verify file compiles: `npx tsc lib/game-words.ts --noEmit`
5. Commit: "Add game word lists with difficulty levels"

---

## Task 2: Create Valid Words Dictionary

**Files:**
- Create: `lib/valid-words.ts`

**Steps:**
1. Create file exporting `VALID_FIVE_LETTER_WORDS` as a Set of ~5000 common 5-letter words
2. Export helper function `isValidWord(word: string): boolean`
3. Verify: `npx tsc lib/valid-words.ts --noEmit`
4. Commit: "Add valid words dictionary for Wordle validation"

---

## Task 3: Create DifficultySelect Component

**Files:**
- Create: `components/games/DifficultySelect.tsx`

**Steps:**
1. Create component accepting `onSelect: (difficulty: 'easy' | 'medium' | 'hard') => void` and `gameName: string`
2. Render three large buttons with colors (green/yellow/red) and subtitles
3. Style with Tailwind, match existing game card aesthetics
4. Verify renders: check in browser
5. Commit: "Add DifficultySelect component for games"

---

## Task 4: Update WordleGame with Difficulty and Validation

**Files:**
- Modify: `components/games/WordleGame.tsx`

**Steps:**
1. Add `difficulty` prop, import word lists from `lib/game-words.ts`
2. Replace hardcoded WORDS array with difficulty-based selection
3. Import `isValidWord` from `lib/valid-words.ts`
4. Add validation in `submitGuess` - show toast if invalid word
5. Add "Change Difficulty" button that calls new `onChangeDifficulty` prop
6. Test all three difficulties in browser
7. Commit: "Add difficulty levels and word validation to Wordle"

---

## Task 5: Create Hangman Character - Animal

**Files:**
- Create: `components/games/hangman-characters/AnimalCharacter.tsx`

**Steps:**
1. Create component accepting `wrongGuesses: number` and `won: boolean`
2. Draw SVG bunny with warm color palette (oranges, pinks)
3. Implement 6 stages: happy → ears droop → sleepy → yawns → sits → lies down → asleep
4. Add win state animation (sparkles/jump)
5. Commit: "Add Animal character for Hangman"

---

## Task 6: Create Hangman Character - Robot

**Files:**
- Create: `components/games/hangman-characters/RobotCharacter.tsx`

**Steps:**
1. Create component with same props interface
2. Draw SVG robot with metallic palette (silvers, blues, teals)
3. Implement 6 stages: powered → antenna dims → screen flickers → arms droop → legs buckle → powered down
4. Add win state animation (lights flash)
5. Commit: "Add Robot character for Hangman"

---

## Task 7: Create Hangman Character - Monster

**Files:**
- Create: `components/games/hangman-characters/MonsterCharacter.tsx`

**Steps:**
1. Create component with same props interface
2. Draw SVG blob monster with playful palette (purples, greens, magentas)
3. Implement 6 stages: big happy → shrinks progressively → tiny and pouty
4. Add win state animation (grows back with grin)
5. Commit: "Add Monster character for Hangman"

---

## Task 8: Update HangmanGame with Difficulty and Characters

**Files:**
- Modify: `components/games/HangmanGame.tsx`
- Create: `components/games/hangman-characters/index.ts`

**Steps:**
1. Create index.ts barrel export for character components
2. Add `difficulty` prop, import word lists from `lib/game-words.ts`
3. Replace hardcoded WORD_CATEGORIES with difficulty-based selection
4. Add state for random character type selection on game start
5. Replace HangmanFigure SVG with dynamic character component
6. Add "Change Difficulty" button/prop
7. Test all difficulties and character rotations
8. Commit: "Add difficulty levels and character rotation to Hangman"

---

## Task 9: Wire Up Games Page

**Files:**
- Modify: `app/games/page.tsx`

**Steps:**
1. Add difficulty state for each game type
2. Show DifficultySelect when game selected but no difficulty chosen
3. Pass difficulty to game components
4. Handle "Change Difficulty" callbacks to reset to selection
5. Test full flow for both games
6. Commit: "Integrate difficulty selection into games page"

---

## Task 10: Final Testing and Cleanup

**Steps:**
1. Run `npm run build` to verify no TypeScript errors
2. Test Wordle: all difficulties, word validation (try invalid words)
3. Test Hangman: all difficulties, verify all 3 character types appear
4. Check responsive design on mobile sizes
5. Commit any fixes needed
