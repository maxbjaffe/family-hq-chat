# Word Games Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Word Search, Anagrams, and Word Ladder games to the Breaktime section with easy/medium/hard difficulty.

**Architecture:** Three new game components following existing patterns (difficulty prop, onChangeDifficulty callback). Pre-computed puzzle data in lib files. Touch-optimized UI with large tap targets.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui Card/Button components

---

## Task 1: Word Search Word Lists

**Files:**
- Modify: `lib/game-words.ts`

**Step 1: Add word search words to game-words.ts**

Add after the existing `HANGMAN_WORDS` export (~line 272):

```typescript
// =============================================================================
// Word Search Words
// =============================================================================

/**
 * Word Search word lists by difficulty:
 * - Easy: 3-4 letter words, simple nouns
 * - Medium: 4-5 letter words, common vocabulary
 * - Hard: 5-7 letter words, challenging vocabulary
 */
export const WORD_SEARCH_WORDS: Record<Difficulty, string[]> = {
  easy: [
    'CAT', 'DOG', 'SUN', 'HAT', 'BED', 'CUP', 'RUN', 'FUN', 'MAP', 'PEN',
    'BAT', 'RAT', 'JAM', 'VAN', 'FAN', 'CAN', 'MAN', 'PAN', 'TAN', 'BUS',
    'BALL', 'TREE', 'BIRD', 'FISH', 'CAKE', 'MILK', 'BOOK', 'FROG', 'STAR', 'MOON',
    'BEAR', 'DUCK', 'KITE', 'RAIN', 'SNOW', 'LEAF', 'NEST', 'BOAT', 'SHIP', 'WAVE',
    'HAND', 'FOOT', 'NOSE', 'EYES', 'EARS', 'LIPS', 'TOES', 'HAIR', 'FACE', 'HEAD',
  ],
  medium: [
    'APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EARTH', 'FLAME', 'GRAPE', 'HOUSE', 'IGLOO', 'JELLY',
    'KOALA', 'LEMON', 'MANGO', 'NURSE', 'OCEAN', 'PIANO', 'QUEEN', 'RIVER', 'SNAKE', 'TIGER',
    'UNCLE', 'VOICE', 'WATER', 'YOUTH', 'ZEBRA', 'BREAD', 'CLOUD', 'DREAM', 'FAIRY', 'GHOST',
    'HEART', 'JUICE', 'LAUGH', 'MAGIC', 'NIGHT', 'PAINT', 'QUIET', 'SMILE', 'TRAIN', 'WORLD',
    'BRAIN', 'CROWN', 'FROST', 'GIANT', 'HORSE', 'JEWEL', 'LIGHT', 'MOUSE', 'PLANT', 'STORM',
  ],
  hard: [
    'PLANET', 'GARDEN', 'FROZEN', 'CASTLE', 'DRAGON', 'FOREST', 'ISLAND', 'JUNGLE', 'KNIGHT', 'LADDER',
    'MONKEY', 'NATURE', 'ORANGE', 'PARROT', 'RABBIT', 'SILVER', 'TURKEY', 'VALLEY', 'WINDOW', 'YELLOW',
    'ANCHOR', 'BRIDGE', 'CANDLE', 'DESERT', 'EMPIRE', 'FLIGHT', 'GLOBAL', 'HARBOR', 'INSECT', 'JIGSAW',
    'KITTEN', 'LIZARD', 'MARBLE', 'NAPKIN', 'OYSTER', 'PEPPER', 'QUIVER', 'ROCKET', 'SPHINX', 'TURTLE',
    'UMPIRE', 'VELVET', 'WALRUS', 'ZOMBIE', 'BRANCH', 'SPLASH', 'STREAM', 'THRONE', 'VOYAGE', 'WIZARD',
  ],
};

/**
 * Get random words for Word Search puzzle
 */
export function getWordSearchWords(difficulty: Difficulty, count: number): string[] {
  const words = [...WORD_SEARCH_WORDS[difficulty]];
  const selected: string[] = [];

  for (let i = 0; i < count && words.length > 0; i++) {
    const index = Math.floor(Math.random() * words.length);
    selected.push(words.splice(index, 1)[0]);
  }

  return selected;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/game-words.ts
git commit -m "feat(games): add word search word lists"
```

---

## Task 2: Word Search Grid Generator

**Files:**
- Create: `lib/word-search-generator.ts`

**Step 1: Create the grid generator**

```typescript
// lib/word-search-generator.ts

export type Direction = 'horizontal' | 'vertical' | 'diagonal' | 'horizontal-reverse' | 'vertical-reverse' | 'diagonal-reverse';

export interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
}

export interface WordSearchGrid {
  grid: string[][];
  placedWords: PlacedWord[];
  size: number;
}

const DIRECTION_DELTAS: Record<Direction, [number, number]> = {
  'horizontal': [0, 1],
  'vertical': [1, 0],
  'diagonal': [1, 1],
  'horizontal-reverse': [0, -1],
  'vertical-reverse': [-1, 0],
  'diagonal-reverse': [-1, -1],
};

function canPlaceWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction
): boolean {
  const [dRow, dCol] = DIRECTION_DELTAS[direction];
  const size = grid.length;

  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dRow;
    const col = startCol + i * dCol;

    if (row < 0 || row >= size || col < 0 || col >= size) {
      return false;
    }

    const cell = grid[row][col];
    if (cell !== '' && cell !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction
): void {
  const [dRow, dCol] = DIRECTION_DELTAS[direction];

  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dRow;
    const col = startCol + i * dCol;
    grid[row][col] = word[i];
  }
}

function getDirectionsForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Direction[] {
  switch (difficulty) {
    case 'easy':
      return ['horizontal', 'vertical'];
    case 'medium':
      return ['horizontal', 'vertical', 'diagonal'];
    case 'hard':
      return ['horizontal', 'vertical', 'diagonal', 'horizontal-reverse', 'vertical-reverse', 'diagonal-reverse'];
  }
}

export function generateWordSearchGrid(
  words: string[],
  size: number,
  difficulty: 'easy' | 'medium' | 'hard'
): WordSearchGrid {
  // Initialize empty grid
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
  const placedWords: PlacedWord[] = [];
  const directions = getDirectionsForDifficulty(difficulty);

  // Sort words by length (longest first) for better placement
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  for (const word of sortedWords) {
    let placed = false;
    const attempts = 100;

    for (let attempt = 0; attempt < attempts && !placed; attempt++) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * size);
      const startCol = Math.floor(Math.random() * size);

      if (canPlaceWord(grid, word, startRow, startCol, direction)) {
        placeWord(grid, word, startRow, startCol, direction);
        placedWords.push({ word, startRow, startCol, direction });
        placed = true;
      }
    }

    if (!placed) {
      console.warn(`Could not place word: ${word}`);
    }
  }

  // Fill remaining cells with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === '') {
        grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid, placedWords, size };
}

export function checkWordSelection(
  grid: string[][],
  placedWords: PlacedWord[],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): string | null {
  // Get selected letters
  const rowDiff = endRow - startRow;
  const colDiff = endCol - startCol;
  const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff)) + 1;

  const dRow = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
  const dCol = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);

  let selectedWord = '';
  for (let i = 0; i < length; i++) {
    const row = startRow + i * dRow;
    const col = startCol + i * dCol;
    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      selectedWord += grid[row][col];
    }
  }

  // Check if selected word matches any placed word (forward or reverse)
  for (const placed of placedWords) {
    if (placed.word === selectedWord || placed.word === selectedWord.split('').reverse().join('')) {
      return placed.word;
    }
  }

  return null;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/word-search-generator.ts
git commit -m "feat(games): add word search grid generator"
```

---

## Task 3: Word Search Game Component

**Files:**
- Create: `components/games/WordSearchGame.tsx`

**Step 1: Create the game component**

```typescript
// components/games/WordSearchGame.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, Settings, Check } from "lucide-react";
import { getWordSearchWords, type Difficulty } from "@/lib/game-words";
import { generateWordSearchGrid, checkWordSelection, type WordSearchGrid } from "@/lib/word-search-generator";

interface WordSearchGameProps {
  difficulty?: Difficulty;
  onChangeDifficulty?: () => void;
}

const GRID_CONFIG = {
  easy: { size: 8, wordCount: 5 },
  medium: { size: 10, wordCount: 7 },
  hard: { size: 12, wordCount: 10 },
};

export function WordSearchGame({ difficulty = 'easy', onChangeDifficulty }: WordSearchGameProps) {
  const [puzzle, setPuzzle] = useState<WordSearchGrid | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const [currentCell, setCurrentCell] = useState<{ row: number; col: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const startNewGame = useCallback(() => {
    const config = GRID_CONFIG[difficulty];
    const words = getWordSearchWords(difficulty, config.wordCount);
    const newPuzzle = generateWordSearchGrid(words, config.size, difficulty);
    setPuzzle(newPuzzle);
    setFoundWords(new Set());
    setGameOver(false);
    setSelecting(false);
    setStartCell(null);
    setCurrentCell(null);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const getCellFromTouch = (touch: React.Touch): { row: number; col: number } | null => {
    if (!gridRef.current || !puzzle) return null;

    const rect = gridRef.current.getBoundingClientRect();
    const cellSize = rect.width / puzzle.size;
    const col = Math.floor((touch.clientX - rect.left) / cellSize);
    const row = Math.floor((touch.clientY - rect.top) / cellSize);

    if (row >= 0 && row < puzzle.size && col >= 0 && col < puzzle.size) {
      return { row, col };
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameOver || !puzzle) return;
    const cell = getCellFromTouch(e.touches[0]);
    if (cell) {
      setSelecting(true);
      setStartCell(cell);
      setCurrentCell(cell);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!selecting || !puzzle) return;
    const cell = getCellFromTouch(e.touches[0]);
    if (cell) {
      setCurrentCell(cell);
    }
  };

  const handleTouchEnd = () => {
    if (!selecting || !startCell || !currentCell || !puzzle) {
      setSelecting(false);
      return;
    }

    const foundWord = checkWordSelection(
      puzzle.grid,
      puzzle.placedWords,
      startCell.row,
      startCell.col,
      currentCell.row,
      currentCell.col
    );

    if (foundWord && !foundWords.has(foundWord)) {
      const newFound = new Set(foundWords);
      newFound.add(foundWord);
      setFoundWords(newFound);

      if (newFound.size === puzzle.placedWords.length) {
        setGameOver(true);
      }
    }

    setSelecting(false);
    setStartCell(null);
    setCurrentCell(null);
  };

  const getSelectedCells = (): Set<string> => {
    const cells = new Set<string>();
    if (!selecting || !startCell || !currentCell) return cells;

    const rowDiff = currentCell.row - startCell.row;
    const colDiff = currentCell.col - startCell.col;
    const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff)) + 1;
    const dRow = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const dCol = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);

    for (let i = 0; i < length; i++) {
      const row = startCell.row + i * dRow;
      const col = startCell.col + i * dCol;
      cells.add(`${row}-${col}`);
    }

    return cells;
  };

  const getFoundCells = (): Set<string> => {
    const cells = new Set<string>();
    if (!puzzle) return cells;

    for (const placed of puzzle.placedWords) {
      if (foundWords.has(placed.word)) {
        const [dRow, dCol] = {
          'horizontal': [0, 1],
          'vertical': [1, 0],
          'diagonal': [1, 1],
          'horizontal-reverse': [0, -1],
          'vertical-reverse': [-1, 0],
          'diagonal-reverse': [-1, -1],
        }[placed.direction];

        for (let i = 0; i < placed.word.length; i++) {
          const row = placed.startRow + i * dRow;
          const col = placed.startCol + i * dCol;
          cells.add(`${row}-${col}`);
        }
      }
    }

    return cells;
  };

  if (!puzzle) return null;

  const selectedCells = getSelectedCells();
  const foundCells = getFoundCells();
  const cellSize = difficulty === 'hard' ? 'w-7 h-7 text-sm' : difficulty === 'medium' ? 'w-8 h-8 text-base' : 'w-10 h-10 text-lg';

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{foundWords.size} / {puzzle.placedWords.length}</span>
          <span className="text-slate-500">words found</span>
        </div>
        <div className="flex gap-2">
          {onChangeDifficulty && (
            <Button variant="outline" size="sm" onClick={onChangeDifficulty} className="min-h-[44px]">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={startNewGame} className="min-h-[44px]">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Word List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {puzzle.placedWords.map(({ word }) => (
          <span
            key={word}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              foundWords.has(word)
                ? 'bg-green-100 text-green-700 line-through'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="grid gap-0.5 mx-auto touch-none select-none"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`, maxWidth: difficulty === 'hard' ? '336px' : difficulty === 'medium' ? '320px' : '320px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => {
          const rect = gridRef.current?.getBoundingClientRect();
          if (!rect || !puzzle) return;
          const cellSize = rect.width / puzzle.size;
          const col = Math.floor((e.clientX - rect.left) / cellSize);
          const row = Math.floor((e.clientY - rect.top) / cellSize);
          if (row >= 0 && row < puzzle.size && col >= 0 && col < puzzle.size) {
            setSelecting(true);
            setStartCell({ row, col });
            setCurrentCell({ row, col });
          }
        }}
        onMouseMove={(e) => {
          if (!selecting || !gridRef.current || !puzzle) return;
          const rect = gridRef.current.getBoundingClientRect();
          const cellSize = rect.width / puzzle.size;
          const col = Math.floor((e.clientX - rect.left) / cellSize);
          const row = Math.floor((e.clientY - rect.top) / cellSize);
          if (row >= 0 && row < puzzle.size && col >= 0 && col < puzzle.size) {
            setCurrentCell({ row, col });
          }
        }}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => {
          if (selecting) {
            setSelecting(false);
            setStartCell(null);
            setCurrentCell(null);
          }
        }}
      >
        {puzzle.grid.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;
            const isSelected = selectedCells.has(key);
            const isFound = foundCells.has(key);

            return (
              <div
                key={key}
                className={`
                  ${cellSize} flex items-center justify-center font-bold rounded
                  transition-colors duration-100
                  ${isFound ? 'bg-green-200 text-green-800' : isSelected ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-700'}
                `}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>

      {/* Win State */}
      {gameOver && (
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600 mb-4">
            <Trophy className="h-8 w-8" />
            <span>All Words Found!</span>
          </div>
          <Button onClick={startNewGame} className="min-h-[48px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      )}
    </Card>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/games/WordSearchGame.tsx
git commit -m "feat(games): add Word Search game component"
```

---

## Task 4: Anagram Puzzles Data

**Files:**
- Create: `lib/anagram-puzzles.ts`

**Step 1: Create anagram puzzles data**

```typescript
// lib/anagram-puzzles.ts

import { Difficulty } from './game-words';

export interface AnagramPuzzle {
  letters: string;
  words: string[];
  minWords: number;
}

/**
 * Pre-computed anagram puzzles
 * Each puzzle has scrambled letters and all valid 3+ letter words
 */
export const ANAGRAM_PUZZLES: Record<Difficulty, AnagramPuzzle[]> = {
  easy: [
    { letters: 'RATES', words: ['RATES', 'STARE', 'TEARS', 'ASTER', 'STAR', 'RATS', 'EARS', 'EATS', 'SEAT', 'TEAS', 'ATE', 'EAT', 'ERA', 'EAR', 'SAT', 'SET', 'TAR', 'TEA', 'ARE', 'ART'], minWords: 3 },
    { letters: 'STONE', words: ['STONE', 'TONES', 'NOTES', 'ONSET', 'NOSE', 'ONES', 'TONE', 'NOTE', 'TENS', 'NETS', 'NEST', 'SENT', 'SET', 'SON', 'TON', 'TEN', 'NET', 'NOT', 'TOE'], minWords: 3 },
    { letters: 'BREAD', words: ['BREAD', 'BEARD', 'BARED', 'DEBAR', 'BARE', 'BEAR', 'READ', 'DEAR', 'DARE', 'BRED', 'BAR', 'BAD', 'BED', 'RED', 'ERA', 'EAR', 'ARE', 'DAB'], minWords: 3 },
    { letters: 'HEART', words: ['HEART', 'EARTH', 'HATER', 'HEAT', 'HATE', 'HEAR', 'RATE', 'TEAR', 'HARE', 'AREA', 'EAT', 'ATE', 'ERA', 'EAR', 'HAT', 'ART', 'TAR', 'TEA', 'THE', 'HER'], minWords: 3 },
    { letters: 'LOOPS', words: ['LOOPS', 'SPOOL', 'POOLS', 'POLO', 'POOL', 'LOOP', 'SOLO', 'OOPS', 'SLOP', 'LOO', 'SOP'], minWords: 3 },
    { letters: 'CLEAN', words: ['CLEAN', 'LANCE', 'LANE', 'LEAN', 'LACE', 'CLAN', 'CANE', 'ACNE', 'CAN', 'ACE', 'ALE'], minWords: 3 },
    { letters: 'SMILE', words: ['SMILE', 'SLIME', 'LIMES', 'MILES', 'LIME', 'MILE', 'SLIM', 'ELMS', 'ELM', 'LIE'], minWords: 3 },
    { letters: 'PAINT', words: ['PAINT', 'PINTA', 'INAPT', 'PINT', 'PAIN', 'PANT', 'ANTI', 'PITA', 'PIAN', 'TAN', 'TAP', 'TIN', 'TIP', 'PAN', 'PAT', 'PIN', 'PIT', 'NAP', 'NIT', 'ANT', 'APT', 'AIT'], minWords: 3 },
    { letters: 'MAPLE', words: ['MAPLE', 'AMPLE', 'PALM', 'PALE', 'MEAL', 'MALE', 'LAMP', 'LEAP', 'LAME', 'PLEA', 'ALE', 'APE', 'ELM', 'LAP', 'MAP', 'PAL', 'PEA'], minWords: 3 },
    { letters: 'SKATE', words: ['SKATE', 'STAKE', 'STEAK', 'TAKES', 'SAKE', 'TAKE', 'SEAT', 'EATS', 'TEAS', 'TASK', 'ATE', 'EAT', 'SAT', 'SET', 'TEA', 'ASK'], minWords: 3 },
  ],
  medium: [
    { letters: 'PLATES', words: ['PLATES', 'PETALS', 'STAPLE', 'PALEST', 'PASTEL', 'PLEATS', 'PLATE', 'PETAL', 'LEAPS', 'PASTE', 'TALES', 'STEAL', 'STALE', 'SLATE', 'LEAST', 'SPELT', 'SLEPT', 'LEAP', 'PALE', 'TALE', 'LATE', 'SALT', 'SEAL', 'SALE', 'SLAP', 'LAPS', 'PALS', 'TAPS', 'PAST', 'PETS', 'STEP', 'PEST'], minWords: 5 },
    { letters: 'STREAM', words: ['STREAM', 'MASTER', 'MATES', 'STEAM', 'MEATS', 'TEAMS', 'SMART', 'TRAMS', 'MARS', 'ARMS', 'RATS', 'STAR', 'MAST', 'MATE', 'MEAT', 'TEAM', 'TRAM', 'SEAM', 'SAME', 'MARE'], minWords: 5 },
    { letters: 'LISTEN', words: ['LISTEN', 'SILENT', 'TINSEL', 'ENLIST', 'INLETS', 'TILES', 'LINES', 'LIENS', 'ISLET', 'INLET', 'STILL', 'SLIT', 'LENS', 'LENT', 'LIST', 'LITE', 'LINE', 'TILE', 'TIES', 'SINE', 'NEST', 'NETS', 'TENS', 'SENT', 'SITE', 'SILT'], minWords: 5 },
    { letters: 'ORANGE', words: ['ORANGE', 'ONAGER', 'ANGER', 'RANGE', 'ORGAN', 'GROAN', 'ORANG', 'RAGE', 'RANG', 'GORE', 'GONE', 'GEAR', 'NEAR', 'EARN', 'OGRE', 'ARGO', 'AREA', 'AERO', 'RANG', 'RANG', 'AGE', 'AGO', 'ARE', 'EAR', 'ERA', 'ERG', 'GAG', 'NAG', 'NOR', 'OAR', 'ONE', 'ORE', 'RAG', 'RAN'], minWords: 5 },
    { letters: 'TRAVEL', words: ['TRAVEL', 'VARLET', 'LATER', 'ALTER', 'ALERT', 'RAVEL', 'LAVER', 'VALET', 'LATE', 'TALE', 'RATE', 'TEAR', 'RAVE', 'VALE', 'VEAL', 'VERT', 'TARE', 'EARL', 'LEAR', 'REAL', 'ATE', 'EAT', 'ERA', 'EAR', 'ART', 'TAR', 'TEA', 'VET', 'VAT', 'LET', 'ALE'], minWords: 5 },
    { letters: 'GARDEN', words: ['GARDEN', 'DANGER', 'GANDER', 'RANGED', 'GRANDE', 'GRADE', 'GRAND', 'ANGER', 'RANGE', 'RAGED', 'DANGLE', 'DEAR', 'READ', 'DARE', 'RANG', 'DRAG', 'GRAD', 'DEAR', 'NEAR', 'EARN', 'DEAN', 'DANE', 'DEN', 'END', 'AND', 'AGE', 'ARE', 'EAR', 'ERA', 'NAG', 'RAG', 'RAN', 'RED'], minWords: 5 },
    { letters: 'THINGS', words: ['THINGS', 'NIGHTS', 'NIGHTS', 'SIGHT', 'NIGHT', 'THING', 'HINTS', 'THINS', 'STING', 'TINGS', 'SHIN', 'THIS', 'THIN', 'HINT', 'SING', 'GINS', 'NITS', 'GIST', 'HITS', 'SIGH', 'NIGH', 'HIS', 'HIT', 'ITS', 'SIN', 'SIT', 'TIN', 'GIN', 'NIT'], minWords: 5 },
    { letters: 'DREAMS', words: ['DREAMS', 'MADRES', 'DREAM', 'ARMED', 'DRAMS', 'DAMES', 'READS', 'DEARS', 'RASED', 'SEARED', 'DEAR', 'READ', 'DARE', 'SEAM', 'SAME', 'MADE', 'DAME', 'MARS', 'ARMS', 'RAMS', 'REDS', 'MEAD', 'DRAM', 'MAD', 'DAM', 'RED', 'ARE', 'EAR', 'ERA', 'ARM', 'RAM', 'SAD', 'SEA'], minWords: 5 },
    { letters: 'BASKET', words: ['BASKET', 'BEASTS', 'BEAKS', 'BASTE', 'BEAST', 'BEATS', 'STAKE', 'STEAK', 'TAKES', 'BAKE', 'BEAK', 'BEAT', 'SAKE', 'TAKE', 'BASE', 'BEST', 'BETS', 'BATS', 'TASK', 'SEAT', 'EATS', 'TEAS', 'TABS', 'ASK', 'ATE', 'BAT', 'BET', 'EAT', 'SAT', 'SET', 'TAB', 'TEA'], minWords: 5 },
    { letters: 'PLANET', words: ['PLANET', 'PLATEN', 'PLANT', 'PLANE', 'PANEL', 'LEANT', 'LATENT', 'PLAN', 'PALE', 'PANE', 'LANE', 'LEAN', 'LATE', 'TALE', 'PELT', 'LENT', 'PANT', 'PLEA', 'LEAP', 'TAPE', 'PEAT', 'NEAT', 'ANTE', 'ALE', 'ANT', 'APE', 'APT', 'ATE', 'EAT', 'LET', 'NAP', 'NET', 'PAL', 'PAN', 'PAT', 'PEA', 'PEN', 'PET', 'TAN', 'TAP', 'TEA', 'TEN'], minWords: 5 },
  ],
  hard: [
    { letters: 'PAINTER', words: ['PAINTER', 'REPAINT', 'PERTAIN', 'PATRINE', 'TRAIN', 'PAINT', 'PRINT', 'INTER', 'INERT', 'TAPER', 'PRATE', 'PART', 'TRAP', 'RAPT', 'RAIN', 'PAIR', 'PINT', 'PIER', 'RIPE', 'PINE', 'TRIP', 'TIER', 'TIRE', 'RITE', 'REIN', 'RATE', 'TEAR', 'PEAR', 'REAP', 'RAPE', 'NEAR', 'EARN', 'PANE', 'NAPE', 'NEAP', 'PANT', 'ANTI', 'IRATE'], minWords: 7 },
    { letters: 'STORAGE', words: ['STORAGE', 'GAROTES', 'ORGEATS', 'TOGAS', 'GOATS', 'GROAT', 'GATOR', 'RAGOUT', 'TOGA', 'GOAT', 'GATOR', 'STAR', 'RATS', 'TARS', 'ARTS', 'OARS', 'SOAR', 'SORT', 'TOGS', 'GROT', 'GORE', 'OGRE', 'RAGE', 'SAGE', 'AGES', 'GATE', 'GRATE', 'GREAT', 'STORE', 'STARE', 'RATES', 'ASTER'], minWords: 7 },
    { letters: 'STRANGE', words: ['STRANGE', 'GARNETS', 'STRANGE', 'GRANTS', 'ANTS', 'RANT', 'RANTS', 'GRANT', 'ANGST', 'TANGS', 'GRANS', 'GNARS', 'STANG', 'RANG', 'RANG', 'SANG', 'TANG', 'TAGS', 'RAGS', 'GNAT', 'GENS', 'TENS', 'NETS', 'NEST', 'RENT', 'TERN', 'STERN', 'ANGER', 'RANGE', 'GRATE', 'GREAT', 'TEARS', 'STARE', 'RATES', 'ASTER', 'AGENT', 'STAGE', 'GATES'], minWords: 7 },
    { letters: 'WONDERS', words: ['WONDERS', 'DOWNERS', 'DROWNED', 'WONDER', 'DOWNER', 'OWNERS', 'WORDS', 'SWORD', 'DOWNS', 'ROWDS', 'SWORN', 'SOWN', 'WORN', 'OWNS', 'WOES', 'OWED', 'DOES', 'RODE', 'DOSE', 'RODS', 'WORDS', 'WORD', 'DONS', 'NODS', 'SNOW', 'SOWN', 'ROWS', 'WEDS', 'NEWS', 'SEWN', 'DENS', 'ENDS', 'SEND', 'REND', 'NODE', 'DONE'], minWords: 7 },
    { letters: 'CHAPTER', words: ['CHAPTER', 'PATCHER', 'REPATCH', 'CHATTER', 'CHARTER', 'CHEAP', 'CHEAT', 'REACH', 'TEACH', 'CHART', 'PARCH', 'PERCH', 'PATCH', 'CATCH', 'TRACE', 'CRATE', 'REACT', 'CREATE', 'HEART', 'EARTH', 'HATER', 'RATHE', 'CAPER', 'PACER', 'RECAP', 'CARE', 'RACE', 'ACRE', 'ARCH', 'CHAR', 'CHAT', 'EACH', 'ACHE', 'HARE', 'HEAR', 'HEAP', 'REAP', 'PEAR', 'RAPE', 'TAPE', 'PEAT', 'RATE', 'TEAR', 'TARE', 'HEAT', 'HATE', 'PATH', 'RAPT', 'TRAP', 'PART'], minWords: 7 },
    { letters: 'MONSTER', words: ['MONSTER', 'MENTORS', 'MENTOR', 'METROS', 'MONTES', 'STORE', 'TOMES', 'MOTES', 'MOTET', 'TORMENT', 'TOME', 'MOTE', 'MOST', 'STEM', 'TERM', 'METRO', 'STORE', 'STONER', 'TONER', 'TENOR', 'SNORE', 'STONE', 'TONES', 'NOTES', 'ONSET', 'STERN', 'TERNS', 'RENTS', 'MORE', 'SOME', 'OMEN', 'ORES', 'ROSE', 'SORE', 'TORE', 'ROTE', 'REST', 'NEST', 'TENS', 'NETS', 'SENT'], minWords: 7 },
    { letters: 'ISLANDS', words: ['ISLANDS', 'ISLAND', 'SNAILS', 'SLAIN', 'NAILS', 'SAILS', 'SNAIL', 'LANDS', 'SANDS', 'DIALS', 'SALAD', 'SLID', 'LIDS', 'LAND', 'SAND', 'SAIL', 'NAIL', 'DIAL', 'SAID', 'AIDS', 'LAID', 'LASS', 'SAILS', 'LADS', 'DAIS', 'DINS', 'AILS', 'LAIN', 'ANIL', 'ALSO', 'ALSO'], minWords: 7 },
    { letters: 'CREDITS', words: ['CREDITS', 'DIRECTS', 'CREDIT', 'DIRECT', 'CIDERS', 'DICERS', 'SCRIED', 'CRIED', 'DICES', 'CIDER', 'DICER', 'RICED', 'TRICE', 'RECIT', 'CITES', 'TIDES', 'EDITS', 'TRIED', 'TIRED', 'RIDES', 'SIRED', 'DRIES', 'RESID', 'DICE', 'ICED', 'TIDE', 'EDIT', 'DIET', 'TIED', 'RIDE', 'DIRE', 'CITE', 'RICE', 'REST', 'REDS', 'SECT', 'DISC', 'SIDE', 'DIES', 'IDES'], minWords: 7 },
    { letters: 'TOASTED', words: ['TOASTED', 'DOTIEST', 'TOAST', 'DATES', 'SATED', 'STADE', 'STEAD', 'TASTED', 'STATED', 'TASTE', 'STATE', 'TOTES', 'STOAT', 'TOAST', 'DATE', 'SATE', 'EATS', 'SEAT', 'TEAS', 'DOSE', 'DOES', 'DOTE', 'TOAD', 'DATO', 'DOAT', 'TOED', 'TODS', 'DOST', 'DOTS', 'OATS', 'TADS', 'OAST', 'ADOS', 'TOES', 'SODA', 'TOTE', 'TOAD'], minWords: 7 },
    { letters: 'SPARKLE', words: ['SPARKLE', 'SPARKLED', 'PARKES', 'SPEAKS', 'SPEAKS', 'LEAPS', 'LAPSE', 'PEALS', 'PALES', 'SEPAL', 'SPEAR', 'PEARS', 'REAPS', 'SPARE', 'PARSE', 'RAPES', 'PARES', 'ASKER', 'RAKES', 'SAKER', 'LAKES', 'LEAKS', 'SLAKE', 'KALES', 'LAKER', 'LEAKS', 'SAKE', 'RAKE', 'LAKE', 'LEAK', 'KALE', 'PALE', 'PEAL', 'LEAP', 'SALE', 'SEAL', 'REAL', 'EARL', 'LAPS', 'SLAP', 'PALS', 'ARKS', 'PARK', 'SPAR', 'RASP'], minWords: 7 },
  ],
};

/**
 * Get a random anagram puzzle for given difficulty
 */
export function getRandomAnagramPuzzle(difficulty: Difficulty): AnagramPuzzle {
  const puzzles = ANAGRAM_PUZZLES[difficulty];
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

/**
 * Scramble letters randomly
 */
export function scrambleLetters(letters: string): string {
  const arr = letters.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/anagram-puzzles.ts
git commit -m "feat(games): add anagram puzzles data"
```

---

## Task 5: Anagrams Game Component

**Files:**
- Create: `components/games/AnagramsGame.tsx`

**Step 1: Create the game component**

```typescript
// components/games/AnagramsGame.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, Settings, Shuffle, Check, X } from "lucide-react";
import { type Difficulty } from "@/lib/game-words";
import { getRandomAnagramPuzzle, scrambleLetters, type AnagramPuzzle } from "@/lib/anagram-puzzles";

interface AnagramsGameProps {
  difficulty?: Difficulty;
  onChangeDifficulty?: () => void;
}

const TARGET_WORDS = {
  easy: 3,
  medium: 5,
  hard: 7,
};

export function AnagramsGame({ difficulty = 'easy', onChangeDifficulty }: AnagramsGameProps) {
  const [puzzle, setPuzzle] = useState<AnagramPuzzle | null>(null);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [shake, setShake] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

  const targetCount = TARGET_WORDS[difficulty];

  const startNewGame = useCallback(() => {
    const newPuzzle = getRandomAnagramPuzzle(difficulty);
    setPuzzle(newPuzzle);
    setScrambled(scrambleLetters(newPuzzle.letters).split(''));
    setSelected([]);
    setFoundWords(new Set());
    setGameOver(false);
    setLastResult(null);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleLetterTap = (index: number) => {
    if (gameOver) return;

    if (selected.includes(index)) {
      // Remove from selection
      setSelected(selected.filter(i => i !== index));
    } else {
      // Add to selection
      setSelected([...selected, index]);
    }
    setLastResult(null);
  };

  const handleShuffle = () => {
    if (!puzzle) return;
    setScrambled(scrambleLetters(puzzle.letters).split(''));
    setSelected([]);
    setLastResult(null);
  };

  const handleSubmit = () => {
    if (!puzzle || selected.length < 3) return;

    const word = selected.map(i => scrambled[i]).join('');

    // Check if valid word and not already found
    const validWords = puzzle.words.map(w => w.toUpperCase());

    if (validWords.includes(word) && !foundWords.has(word)) {
      const newFound = new Set(foundWords);
      newFound.add(word);
      setFoundWords(newFound);
      setSelected([]);
      setLastResult('correct');

      if (newFound.size >= targetCount) {
        setGameOver(true);
      }
    } else {
      // Invalid or already found
      setShake(true);
      setLastResult('wrong');
      setTimeout(() => {
        setShake(false);
        setSelected([]);
      }, 500);
    }
  };

  const handleClear = () => {
    setSelected([]);
    setLastResult(null);
  };

  if (!puzzle) return null;

  const currentWord = selected.map(i => scrambled[i]).join('');

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{foundWords.size} / {targetCount}</span>
          <span className="text-slate-500">words found</span>
        </div>
        <div className="flex gap-2">
          {onChangeDifficulty && (
            <Button variant="outline" size="sm" onClick={onChangeDifficulty} className="min-h-[44px]">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={startNewGame} className="min-h-[44px]">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(foundWords.size / targetCount) * 100}%` }}
        />
      </div>

      {/* Found Words */}
      {foundWords.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from(foundWords).map(word => (
            <span
              key={word}
              className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
            >
              {word}
            </span>
          ))}
        </div>
      )}

      {/* Current Word Display */}
      <div className={`h-16 flex items-center justify-center mb-4 rounded-lg bg-slate-100 ${shake ? 'animate-shake' : ''}`}>
        <span className="text-2xl font-bold tracking-widest text-slate-700">
          {currentWord || '_ _ _'}
        </span>
      </div>

      {/* Letter Tiles */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {scrambled.map((letter, index) => {
          const isSelected = selected.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleLetterTap(index)}
              disabled={gameOver}
              className={`
                w-14 h-14 rounded-xl text-2xl font-bold
                transition-all duration-150 transform
                ${isSelected
                  ? 'bg-blue-500 text-white scale-90 opacity-50'
                  : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg hover:scale-105 active:scale-95'
                }
                disabled:opacity-50
              `}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mb-4">
        <Button
          variant="outline"
          onClick={handleShuffle}
          disabled={gameOver}
          className="min-h-[48px]"
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Shuffle
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={gameOver || selected.length === 0}
          className="min-h-[48px]"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={gameOver || selected.length < 3}
          className="min-h-[48px] bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Submit
        </Button>
      </div>

      {/* Feedback */}
      {lastResult && !gameOver && (
        <div className={`text-center text-sm font-medium ${lastResult === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
          {lastResult === 'correct' ? 'Nice! Keep going!' : 'Not a valid word or already found'}
        </div>
      )}

      {/* Win State */}
      {gameOver && (
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600 mb-4">
            <Trophy className="h-8 w-8" />
            <span>Great Job!</span>
          </div>
          <p className="text-slate-600 mb-4">You found {foundWords.size} words!</p>
          <Button onClick={startNewGame} className="min-h-[48px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      )}

      {/* Add shake animation styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </Card>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/games/AnagramsGame.tsx
git commit -m "feat(games): add Anagrams game component"
```

---

## Task 6: Word Ladder Puzzles Data

**Files:**
- Create: `lib/word-ladder-puzzles.ts`

**Step 1: Create word ladder puzzles data**

```typescript
// lib/word-ladder-puzzles.ts

import { Difficulty } from './game-words';

export interface WordLadderPuzzle {
  start: string;
  end: string;
  par: number;
}

/**
 * Pre-computed word ladder puzzles
 * Each puzzle has start word, end word, and par (minimum steps)
 */
export const WORD_LADDER_PUZZLES: Record<Difficulty, WordLadderPuzzle[]> = {
  easy: [
    // 3-letter words, 3-4 steps
    { start: 'CAT', end: 'DOG', par: 3 },  // CAT -> COT -> COG -> DOG
    { start: 'PIG', end: 'STY', par: 3 },  // PIG -> WIG -> WAG -> WAY -> SAY -> STY (or shorter)
    { start: 'HOT', end: 'ICE', par: 4 },  // HOT -> HIT -> SIT -> SIC -> ICE
    { start: 'WET', end: 'DRY', par: 4 },  // WET -> SET -> SAT -> SAY -> DAY -> DRY
    { start: 'OLD', end: 'NEW', par: 4 },  // OLD -> OWL -> OWE -> AWE -> AWN -> NEW
    { start: 'BIG', end: 'WEE', par: 4 },  // BIG -> BAG -> WAG -> WAE -> WEE
    { start: 'SUN', end: 'TAN', par: 3 },  // SUN -> SAN -> TAN
    { start: 'RED', end: 'TAN', par: 3 },  // RED -> RAD -> RAN -> TAN
    { start: 'BED', end: 'COT', par: 3 },  // BED -> BAD -> CAD -> COT
    { start: 'HAT', end: 'TOP', par: 3 },  // HAT -> HOT -> HOP -> TOP
    { start: 'PEN', end: 'INK', par: 3 },  // PEN -> PIN -> IN -> INK
    { start: 'DAY', end: 'SUN', par: 3 },  // DAY -> SAY -> SAN -> SUN
    { start: 'BOY', end: 'MAN', par: 3 },  // BOY -> BAY -> BAN -> MAN
    { start: 'CRY', end: 'JOY', par: 3 },  // CRY -> COY -> JOY
    { start: 'FLY', end: 'ANT', par: 4 },  // FLY -> FLT -> FAT -> AAT -> ANT
  ],
  medium: [
    // 4-letter words, 4-5 steps
    { start: 'COLD', end: 'WARM', par: 4 },  // COLD -> CORD -> CARD -> WARD -> WARM
    { start: 'HEAD', end: 'TAIL', par: 5 },  // HEAD -> HEAL -> TEAL -> TELL -> TALL -> TAIL
    { start: 'SICK', end: 'WELL', par: 4 },  // SICK -> SILK -> SILL -> WILL -> WELL
    { start: 'LOVE', end: 'HATE', par: 4 },  // LOVE -> LAVE -> LATE -> HATE
    { start: 'SLOW', end: 'FAST', par: 5 },  // SLOW -> SLOT -> SOOT -> FOOT -> FAST
    { start: 'WORK', end: 'PLAY', par: 5 },  // WORK -> WORD -> WARD -> WARY -> PRAY -> PLAY
    { start: 'POOR', end: 'RICH', par: 5 },  // POOR -> BOOR -> BOOK -> ROOK -> RICK -> RICH
    { start: 'HIDE', end: 'SEEK', par: 4 },  // HIDE -> HIKE -> HAKE -> SAKE -> SEEK
    { start: 'LOST', end: 'FIND', par: 4 },  // LOST -> LOFT -> LIFT -> LINT -> FIND
    { start: 'SOFT', end: 'HARD', par: 4 },  // SOFT -> SORT -> SORE -> HARE -> HARD
    { start: 'FIRE', end: 'COLD', par: 4 },  // FIRE -> FORE -> FORD -> CORD -> COLD
    { start: 'DARK', end: 'DAWN', par: 3 },  // DARK -> DARN -> DAWN
    { start: 'FOOL', end: 'SAGE', par: 5 },  // FOOL -> FOOD -> FOLD -> SOLD -> SOLE -> SAGE
    { start: 'KING', end: 'PAWN', par: 4 },  // KING -> KIND -> KINO -> PAWN
    { start: 'LEAD', end: 'GOLD', par: 4 },  // LEAD -> LOAD -> GOAD -> GOLD
  ],
  hard: [
    // 5-letter words, 5-6 steps
    { start: 'BRAIN', end: 'BRAWN', par: 2 },  // BRAIN -> BRAN -> BRAWN (short but 5 letters)
    { start: 'FLOUR', end: 'BREAD', par: 5 },  // FLOUR -> FLOOR -> FLOOD -> BLOOD -> BROOD -> BROAD -> BREAD
    { start: 'SMILE', end: 'FROWN', par: 5 },  // SMILE -> STILE -> STILE -> STYLE -> STOLE -> STONE -> STORE -> SHORE -> SHOWN -> FROWN
    { start: 'ANGEL', end: 'DEVIL', par: 6 },  // Complex path
    { start: 'BLACK', end: 'WHITE', par: 6 },  // BLACK -> BLANK -> BLINK -> CLINK -> CHINK -> CHINE -> WHINE -> WHITE
    { start: 'STORM', end: 'PEACE', par: 6 },  // Complex path
    { start: 'SWORD', end: 'PEACE', par: 6 },  // Complex path
    { start: 'SLEEP', end: 'DREAM', par: 5 },  // SLEEP -> STEEP -> STEER -> STEAR -> STEAM -> DREAM
    { start: 'WITCH', end: 'FAIRY', par: 5 },  // Complex path
    { start: 'STONE', end: 'MONEY', par: 5 },  // STONE -> STORE -> STORY -> GLORY -> GORY -> GONEY -> MONEY
    { start: 'WORLD', end: 'PEACE', par: 5 },  // WORLD -> WOULD -> COULD -> COALD -> COAL -> PEACE
    { start: 'CHAOS', end: 'ORDER', par: 6 },  // Complex path
    { start: 'RIVER', end: 'SHORE', par: 4 },  // RIVER -> RISER -> RISER -> SHIER -> SHORE
    { start: 'HOUSE', end: 'HOMES', par: 2 },  // HOUSE -> HOSE -> HOMES
    { start: 'FROST', end: 'THAWS', par: 5 },  // FROST -> FROGS -> FLOGS -> FLOWS -> SHOWS -> SHAWS -> THAWS
  ],
};

/**
 * Get a random word ladder puzzle for given difficulty
 */
export function getRandomWordLadderPuzzle(difficulty: Difficulty): WordLadderPuzzle {
  const puzzles = WORD_LADDER_PUZZLES[difficulty];
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

/**
 * Check if two words differ by exactly one letter
 */
export function differsByOneLetter(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) return false;

  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
      if (differences > 1) return false;
    }
  }

  return differences === 1;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/word-ladder-puzzles.ts
git commit -m "feat(games): add word ladder puzzles data"
```

---

## Task 7: Word Ladder Game Component

**Files:**
- Create: `components/games/WordLadderGame.tsx`

**Step 1: Create the game component**

```typescript
// components/games/WordLadderGame.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, Settings, ArrowDown, Check, X } from "lucide-react";
import { type Difficulty } from "@/lib/game-words";
import { getRandomWordLadderPuzzle, differsByOneLetter, type WordLadderPuzzle } from "@/lib/word-ladder-puzzles";
import { isValidWord } from "@/lib/valid-words";

interface WordLadderGameProps {
  difficulty?: Difficulty;
  onChangeDifficulty?: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function WordLadderGame({ difficulty = 'easy', onChangeDifficulty }: WordLadderGameProps) {
  const [puzzle, setPuzzle] = useState<WordLadderPuzzle | null>(null);
  const [ladder, setLadder] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const startNewGame = useCallback(() => {
    const newPuzzle = getRandomWordLadderPuzzle(difficulty);
    setPuzzle(newPuzzle);
    setLadder([newPuzzle.start]);
    setCurrentInput('');
    setMoves(0);
    setGameOver(false);
    setError(null);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleKeyPress = (key: string) => {
    if (gameOver || !puzzle) return;

    setError(null);

    if (key === 'BACKSPACE') {
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      handleSubmit();
    } else if (currentInput.length < puzzle.start.length) {
      setCurrentInput(prev => prev + key);
    }
  };

  const handleSubmit = () => {
    if (!puzzle || currentInput.length !== puzzle.start.length) return;

    const lastWord = ladder[ladder.length - 1];
    const inputUpper = currentInput.toUpperCase();

    // Check if differs by exactly one letter
    if (!differsByOneLetter(lastWord, inputUpper)) {
      setError('Must change exactly one letter');
      triggerShake();
      return;
    }

    // Check if valid word
    if (!isValidWord(inputUpper)) {
      setError('Not a valid word');
      triggerShake();
      return;
    }

    // Valid move
    const newLadder = [...ladder, inputUpper];
    setLadder(newLadder);
    setMoves(moves + 1);
    setCurrentInput('');

    // Check if reached the end
    if (inputUpper === puzzle.end) {
      setGameOver(true);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setCurrentInput('');
    }, 500);
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentInput, gameOver, puzzle, ladder]);

  if (!puzzle) return null;

  const wordLength = puzzle.start.length;
  const beatPar = gameOver && moves <= puzzle.par;

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-2xl font-bold">{moves}</span>
            <span className="text-slate-500 text-sm block">Moves</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-purple-600">{puzzle.par}</span>
            <span className="text-slate-500 text-sm block">Par</span>
          </div>
        </div>
        <div className="flex gap-2">
          {onChangeDifficulty && (
            <Button variant="outline" size="sm" onClick={onChangeDifficulty} className="min-h-[44px]">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={startNewGame} className="min-h-[44px]">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ladder Display */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {/* Start Word */}
        <div className="flex gap-1">
          {puzzle.start.split('').map((letter, i) => (
            <div
              key={i}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-green-500 text-white text-xl font-bold rounded"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Completed Rungs */}
        {ladder.slice(1).map((word, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <ArrowDown className="h-4 w-4 text-slate-400" />
            <div className="flex gap-1">
              {word.split('').map((letter, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl font-bold rounded ${
                    word === puzzle.end
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Current Input (if not won) */}
        {!gameOver && (
          <>
            <ArrowDown className="h-4 w-4 text-slate-400" />
            <div className={`flex gap-1 ${shake ? 'animate-shake' : ''}`}>
              {Array(wordLength).fill(null).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-100 border-2 border-slate-300 text-xl font-bold rounded"
                >
                  {currentInput[i] || ''}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Target Word (shown dimmed if not reached) */}
        {!gameOver && (
          <>
            <div className="text-slate-400 text-sm my-2">↓ Target ↓</div>
            <div className="flex gap-1 opacity-50">
              {puzzle.end.split('').map((letter, i) => (
                <div
                  key={i}
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-amber-100 text-amber-800 text-xl font-bold rounded"
                >
                  {letter}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-center text-red-600 font-medium mb-4">
          {error}
        </div>
      )}

      {/* Keyboard */}
      {!gameOver && (
        <div className="flex flex-col items-center gap-1">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {rowIndex === 2 && (
                <button
                  onClick={() => handleKeyPress('BACKSPACE')}
                  className="px-3 h-12 bg-slate-200 rounded font-bold text-sm hover:bg-slate-300 active:bg-slate-400"
                >
                  ←
                </button>
              )}
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="w-8 h-12 sm:w-10 bg-slate-200 rounded font-bold hover:bg-slate-300 active:bg-slate-400"
                >
                  {key}
                </button>
              ))}
              {rowIndex === 2 && (
                <button
                  onClick={() => handleKeyPress('ENTER')}
                  className="px-3 h-12 bg-green-500 text-white rounded font-bold text-sm hover:bg-green-600 active:bg-green-700"
                >
                  ↵
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Win State */}
      {gameOver && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600 mb-2">
            <Trophy className="h-8 w-8" />
            <span>Complete!</span>
          </div>
          {beatPar ? (
            <p className="text-purple-600 font-bold mb-4">
              Amazing! You beat par! ({moves} moves vs {puzzle.par} par)
            </p>
          ) : (
            <p className="text-slate-600 mb-4">
              Solved in {moves} moves (par: {puzzle.par})
            </p>
          )}
          <Button onClick={startNewGame} className="min-h-[48px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      )}

      {/* Add shake animation styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </Card>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/games/WordLadderGame.tsx
git commit -m "feat(games): add Word Ladder game component"
```

---

## Task 8: Update Games Page

**Files:**
- Modify: `app/games/page.tsx`

**Step 1: Add imports for new games**

At top of file, add:

```typescript
import { WordSearchGame } from "@/components/games/WordSearchGame";
import { AnagramsGame } from "@/components/games/AnagramsGame";
import { WordLadderGame } from "@/components/games/WordLadderGame";
import {
  Gamepad2,
  Paintbrush,
  Type,
  Grid3X3,
  ArrowLeft,
  Search,
  Shuffle,
  GitBranch,
} from "lucide-react";
```

**Step 2: Update GameType and games array**

```typescript
type GameType = "menu" | "doodle" | "wordle" | "hangman" | "tictactoe" | "wordsearch" | "anagrams" | "wordladder";

const games = [
  {
    id: "doodle" as const,
    name: "Doodle",
    description: "Draw and create art!",
    icon: Paintbrush,
    color: "from-pink-500 to-purple-500",
    bgColor: "from-pink-50 to-purple-50",
  },
  {
    id: "wordle" as const,
    name: "Word Guess",
    description: "Guess the 5-letter word!",
    icon: Type,
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-50 to-emerald-50",
  },
  {
    id: "hangman" as const,
    name: "Hangman",
    description: "Guess letters to save the stickman!",
    icon: Type,
    color: "from-orange-500 to-amber-500",
    bgColor: "from-orange-50 to-amber-50",
  },
  {
    id: "tictactoe" as const,
    name: "Tic-Tac-Toe",
    description: "Classic X's and O's!",
    icon: Grid3X3,
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-50 to-cyan-50",
  },
  {
    id: "wordsearch" as const,
    name: "Word Search",
    description: "Find hidden words in the grid!",
    icon: Search,
    color: "from-violet-500 to-purple-500",
    bgColor: "from-violet-50 to-purple-50",
  },
  {
    id: "anagrams" as const,
    name: "Anagrams",
    description: "Unscramble letters to make words!",
    icon: Shuffle,
    color: "from-rose-500 to-pink-500",
    bgColor: "from-rose-50 to-pink-50",
  },
  {
    id: "wordladder" as const,
    name: "Word Ladder",
    description: "Change one letter at a time!",
    icon: GitBranch,
    color: "from-teal-500 to-cyan-500",
    bgColor: "from-teal-50 to-cyan-50",
  },
];
```

**Step 3: Add difficulty state for new games**

```typescript
const [wordSearchDifficulty, setWordSearchDifficulty] = useState<Difficulty | null>(null);
const [anagramsDifficulty, setAnagramsDifficulty] = useState<Difficulty | null>(null);
const [wordLadderDifficulty, setWordLadderDifficulty] = useState<Difficulty | null>(null);
```

**Step 4: Update back button to reset new game difficulties**

```typescript
onClick={() => {
  setActiveGame("menu");
  if (activeGame === "wordle") setWordleDifficulty(null);
  if (activeGame === "hangman") setHangmanDifficulty(null);
  if (activeGame === "wordsearch") setWordSearchDifficulty(null);
  if (activeGame === "anagrams") setAnagramsDifficulty(null);
  if (activeGame === "wordladder") setWordLadderDifficulty(null);
}}
```

**Step 5: Add game rendering for new games**

After the existing game renders, add:

```typescript
{activeGame === "wordsearch" && (
  wordSearchDifficulty === null ? (
    <DifficultySelect
      gameName="Word Search"
      onSelect={(difficulty) => setWordSearchDifficulty(difficulty)}
    />
  ) : (
    <WordSearchGame
      difficulty={wordSearchDifficulty}
      onChangeDifficulty={() => setWordSearchDifficulty(null)}
    />
  )
)}
{activeGame === "anagrams" && (
  anagramsDifficulty === null ? (
    <DifficultySelect
      gameName="Anagrams"
      onSelect={(difficulty) => setAnagramsDifficulty(difficulty)}
    />
  ) : (
    <AnagramsGame
      difficulty={anagramsDifficulty}
      onChangeDifficulty={() => setAnagramsDifficulty(null)}
    />
  )
)}
{activeGame === "wordladder" && (
  wordLadderDifficulty === null ? (
    <DifficultySelect
      gameName="Word Ladder"
      onSelect={(difficulty) => setWordLadderDifficulty(difficulty)}
    />
  ) : (
    <WordLadderGame
      difficulty={wordLadderDifficulty}
      onChangeDifficulty={() => setWordLadderDifficulty(null)}
    />
  )
)}
```

**Step 6: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add app/games/page.tsx
git commit -m "feat(games): add Word Search, Anagrams, Word Ladder to games menu"
```

---

## Task 9: Manual Testing

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test Word Search**

1. Navigate to `/games`
2. Click "Word Search"
3. Select each difficulty level and verify:
   - Easy: 8×8 grid, 5 words, horizontal/vertical only
   - Medium: 10×10 grid, 7 words, includes diagonal
   - Hard: 12×12 grid, 10 words, includes reverse
4. Verify drag selection works on both touch and mouse
5. Verify found words highlight green
6. Verify win state shows when all words found

**Step 3: Test Anagrams**

1. Click "Anagrams"
2. Select each difficulty level and verify:
   - Easy: 5 letters, find 3 words
   - Medium: 6 letters, find 5 words
   - Hard: 7 letters, find 7 words
3. Verify letter tapping builds word
4. Verify shuffle randomizes letters
5. Verify invalid words show error
6. Verify win state shows when target reached

**Step 4: Test Word Ladder**

1. Click "Word Ladder"
2. Select each difficulty level and verify:
   - Easy: 3-letter words
   - Medium: 4-letter words
   - Hard: 5-letter words
3. Verify keyboard input works
4. Verify invalid words show error
5. Verify "must change one letter" validation
6. Verify win state shows with par comparison

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(games): address testing feedback"
```

---

## Task 10: Final Verification and Push

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Push to remote**

```bash
git push
```

**Step 4: Verify deployment**

Check Vercel deployment succeeds and test games on production URL.
