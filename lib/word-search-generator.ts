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
