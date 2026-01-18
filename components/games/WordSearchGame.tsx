// components/games/WordSearchGame.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, Settings } from "lucide-react";
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
          const cellWidth = rect.width / puzzle.size;
          const col = Math.floor((e.clientX - rect.left) / cellWidth);
          const row = Math.floor((e.clientY - rect.top) / cellWidth);
          if (row >= 0 && row < puzzle.size && col >= 0 && col < puzzle.size) {
            setSelecting(true);
            setStartCell({ row, col });
            setCurrentCell({ row, col });
          }
        }}
        onMouseMove={(e) => {
          if (!selecting || !gridRef.current || !puzzle) return;
          const rect = gridRef.current.getBoundingClientRect();
          const cellWidth = rect.width / puzzle.size;
          const col = Math.floor((e.clientX - rect.left) / cellWidth);
          const row = Math.floor((e.clientY - rect.top) / cellWidth);
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

      {/* Change Difficulty */}
      {onChangeDifficulty && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onChangeDifficulty}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            <Settings className="h-4 w-4" />
            Change Difficulty
          </button>
        </div>
      )}
    </Card>
  );
}
