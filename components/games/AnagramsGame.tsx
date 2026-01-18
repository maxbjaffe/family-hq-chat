// components/games/AnagramsGame.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Trophy, Settings, Shuffle, Check, X } from "lucide-react";
import { getRandomAnagramPuzzle, scrambleLetters, type AnagramPuzzle } from "@/lib/anagram-puzzles";
import { type Difficulty } from "@/lib/game-words";

interface AnagramsGameProps {
  difficulty?: Difficulty;
  onChangeDifficulty?: () => void;
}

const WORD_TARGETS: Record<Difficulty, number> = {
  easy: 3,
  medium: 5,
  hard: 7,
};

export function AnagramsGame({ difficulty = 'easy', onChangeDifficulty }: AnagramsGameProps) {
  const [puzzle, setPuzzle] = useState<AnagramPuzzle | null>(null);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [lastResult, setLastResult] = useState<'valid' | 'invalid' | null>(null);

  const targetWords = WORD_TARGETS[difficulty];

  const startNewGame = useCallback(() => {
    const newPuzzle = getRandomAnagramPuzzle(difficulty);
    setPuzzle(newPuzzle);
    setScrambled(scrambleLetters(newPuzzle.letters).split(''));
    setSelected([]);
    setFoundWords(new Set());
    setGameOver(false);
    setShaking(false);
    setLastResult(null);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleTileClick = (index: number) => {
    if (gameOver) return;

    // If this tile is already selected, remove it and all tiles after it
    const selectedIndex = selected.indexOf(index);
    if (selectedIndex !== -1) {
      setSelected(selected.slice(0, selectedIndex));
      setLastResult(null);
      return;
    }

    // Add tile to selection
    setSelected([...selected, index]);
    setLastResult(null);
  };

  const handleShuffle = () => {
    if (!puzzle) return;
    setScrambled(scrambleLetters(puzzle.letters).split(''));
    setSelected([]);
    setLastResult(null);
  };

  const getCurrentWord = (): string => {
    return selected.map(i => scrambled[i]).join('');
  };

  const handleSubmit = () => {
    if (!puzzle || selected.length < 3) return;

    const word = getCurrentWord().toUpperCase();

    // Check if word is valid and not already found
    if (puzzle.words.includes(word) && !foundWords.has(word)) {
      // Valid new word
      const newFound = new Set(foundWords);
      newFound.add(word);
      setFoundWords(newFound);
      setSelected([]);
      setLastResult('valid');

      // Check for win
      if (newFound.size >= targetWords) {
        setGameOver(true);
      }
    } else {
      // Invalid word - shake and reset
      setShaking(true);
      setLastResult('invalid');
      setTimeout(() => {
        setShaking(false);
        setSelected([]);
      }, 500);
    }
  };

  const handleClear = () => {
    setSelected([]);
    setLastResult(null);
  };

  if (!puzzle) return null;

  const progress = (foundWords.size / targetWords) * 100;
  const currentWord = getCurrentWord();

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{foundWords.size} / {targetWords}</span>
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
      <Progress value={progress} className="mb-4 h-3" />

      {/* Found Words */}
      {foundWords.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from(foundWords).map((word) => (
            <span
              key={word}
              className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
            >
              {word}
            </span>
          ))}
        </div>
      )}

      {/* Answer Area */}
      <div className={`
        min-h-[60px] mb-4 p-3 rounded-xl border-2 border-dashed
        flex items-center justify-center gap-1
        ${shaking ? 'animate-shake border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}
        ${lastResult === 'valid' ? 'border-green-300 bg-green-50' : ''}
      `}>
        {selected.length === 0 ? (
          <span className="text-slate-400 text-lg">Tap letters to build a word</span>
        ) : (
          selected.map((letterIndex, i) => (
            <button
              key={`answer-${i}`}
              onClick={() => handleTileClick(letterIndex)}
              className="w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-xl flex items-center justify-center shadow-md hover:bg-blue-600 active:scale-95 transition-all"
            >
              {scrambled[letterIndex]}
            </button>
          ))
        )}
      </div>

      {/* Letter Tiles */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {scrambled.map((letter, index) => {
          const isSelected = selected.includes(index);
          return (
            <button
              key={`tile-${index}`}
              onClick={() => handleTileClick(index)}
              disabled={isSelected || gameOver}
              className={`
                w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold text-xl sm:text-2xl
                flex items-center justify-center shadow-lg
                transition-all duration-150
                ${isSelected
                  ? 'bg-slate-200 text-slate-400 scale-90 shadow-none'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95'
                }
                ${gameOver ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      {!gameOver && (
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={handleShuffle}
            className="min-h-[48px] min-w-[48px]"
          >
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={selected.length === 0}
            className="min-h-[48px] min-w-[48px]"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.length < 3}
            className="min-h-[48px] px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Check className="h-5 w-5 mr-2" />
            Submit
          </Button>
        </div>
      )}

      {/* Win State */}
      {gameOver && (
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600 mb-4">
            <Trophy className="h-8 w-8" />
            <span>You Found {targetWords} Words!</span>
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

      {/* Shake Animation Keyframes */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </Card>
  );
}
