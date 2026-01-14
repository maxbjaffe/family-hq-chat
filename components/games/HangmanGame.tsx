"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, X } from "lucide-react";

// Kid-friendly words with categories
const WORD_CATEGORIES = {
  Animals: [
    "ELEPHANT", "GIRAFFE", "DOLPHIN", "PENGUIN", "BUTTERFLY", "KANGAROO",
    "OCTOPUS", "TIGER", "MONKEY", "RABBIT", "TURTLE", "PARROT",
  ],
  Food: [
    "PIZZA", "BANANA", "CHOCOLATE", "PANCAKE", "SANDWICH", "STRAWBERRY",
    "POPCORN", "MUFFIN", "COOKIE", "PRETZEL", "WAFFLE", "CUPCAKE",
  ],
  Places: [
    "BEACH", "CASTLE", "LIBRARY", "PLAYGROUND", "MOUNTAIN", "FOREST",
    "MUSEUM", "GARDEN", "SCHOOL", "AIRPORT", "ISLAND", "STADIUM",
  ],
  Things: [
    "RAINBOW", "SKATEBOARD", "UMBRELLA", "TELESCOPE", "KEYBOARD", "BACKPACK",
    "TREASURE", "BALLOON", "CAMPFIRE", "SPACESHIP", "DINOSAUR", "FIREWORK",
  ],
};

const MAX_WRONG = 6;

export function HangmanGame() {
  const [word, setWord] = useState("");
  const [category, setCategory] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const startNewGame = useCallback(() => {
    const categories = Object.keys(WORD_CATEGORIES);
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const words =
      WORD_CATEGORIES[randomCategory as keyof typeof WORD_CATEGORIES];
    const randomWord = words[Math.floor(Math.random() * words.length)];

    setWord(randomWord);
    setCategory(randomCategory);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const guessLetter = useCallback(
    (letter: string) => {
      if (gameOver || guessedLetters.has(letter)) return;

      const newGuessed = new Set(guessedLetters);
      newGuessed.add(letter);
      setGuessedLetters(newGuessed);

      if (!word.includes(letter)) {
        const newWrong = wrongGuesses + 1;
        setWrongGuesses(newWrong);
        if (newWrong >= MAX_WRONG) {
          setGameOver(true);
          setWon(false);
        }
      } else {
        // Check if won
        const wordLetters = new Set(word.split(""));
        const allGuessed = [...wordLetters].every((l) => newGuessed.has(l));
        if (allGuessed) {
          setGameOver(true);
          setWon(true);
        }
      }
    },
    [gameOver, guessedLetters, word, wrongGuesses]
  );

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key.length === 1 && key.match(/[A-Z]/)) {
        guessLetter(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [guessLetter]);

  const displayWord = word
    .split("")
    .map((letter) => (guessedLetters.has(letter) ? letter : "_"))
    .join(" ");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // SVG Hangman figure
  const HangmanFigure = () => (
    <svg viewBox="0 0 200 250" className="w-full h-48 md:h-64">
      {/* Gallows */}
      <line
        x1="20"
        y1="230"
        x2="100"
        y2="230"
        stroke="#4B5563"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="230"
        x2="60"
        y2="20"
        stroke="#4B5563"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="20"
        x2="140"
        y2="20"
        stroke="#4B5563"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="140"
        y1="20"
        x2="140"
        y2="50"
        stroke="#4B5563"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Head */}
      {wrongGuesses >= 1 && (
        <circle
          cx="140"
          cy="70"
          r="20"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="4"
        />
      )}

      {/* Body */}
      {wrongGuesses >= 2 && (
        <line
          x1="140"
          y1="90"
          x2="140"
          y2="150"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* Left Arm */}
      {wrongGuesses >= 3 && (
        <line
          x1="140"
          y1="110"
          x2="110"
          y2="130"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* Right Arm */}
      {wrongGuesses >= 4 && (
        <line
          x1="140"
          y1="110"
          x2="170"
          y2="130"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* Left Leg */}
      {wrongGuesses >= 5 && (
        <line
          x1="140"
          y1="150"
          x2="110"
          y2="190"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* Right Leg */}
      {wrongGuesses >= 6 && (
        <line
          x1="140"
          y1="150"
          x2="170"
          y2="190"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* Face when lost */}
      {wrongGuesses >= 6 && (
        <>
          <text x="132" y="68" fontSize="10" fill="#EF4444">
            X
          </text>
          <text x="142" y="68" fontSize="10" fill="#EF4444">
            X
          </text>
          <path
            d="M 132 78 Q 140 72 148 78"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
          />
        </>
      )}

      {/* Face when won */}
      {won && (
        <>
          <circle cx="132" cy="65" r="3" fill="#10B981" />
          <circle cx="148" cy="65" r="3" fill="#10B981" />
          <path
            d="M 132 76 Q 140 84 148 76"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );

  return (
    <Card className="p-6">
      <div className="text-center mb-4">
        <h2
          className="text-3xl font-black text-slate-800 mb-1"
          style={{
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
          }}
        >
          Hangman
        </h2>
        <p className="text-slate-600">
          Category: <span className="font-bold text-orange-600">{category}</span>
        </p>
      </div>

      {/* Hangman Figure */}
      <div className="flex justify-center mb-4">
        <HangmanFigure />
      </div>

      {/* Wrong Guesses Counter */}
      <div className="text-center mb-4">
        <span className="text-slate-600">
          Wrong guesses: {wrongGuesses} / {MAX_WRONG}
        </span>
      </div>

      {/* Word Display */}
      <div className="text-center mb-6">
        <div
          className="text-3xl md:text-4xl font-mono font-bold tracking-widest text-slate-800"
          style={{ letterSpacing: "0.5em" }}
        >
          {displayWord}
        </div>
      </div>

      {/* Game Over Message */}
      {gameOver && (
        <div className="text-center mb-6">
          {won ? (
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <Trophy className="h-8 w-8" />
              <span className="text-2xl font-bold">You saved them!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
              <X className="h-8 w-8" />
              <span className="text-2xl font-bold">The word was: {word}</span>
            </div>
          )}
          <Button
            onClick={startNewGame}
            className="min-h-[48px] bg-gradient-to-r from-orange-500 to-amber-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Play Again
          </Button>
        </div>
      )}

      {/* Alphabet Keyboard */}
      {!gameOver && (
        <div className="flex flex-wrap justify-center gap-2">
          {alphabet.map((letter) => {
            const isGuessed = guessedLetters.has(letter);
            const isCorrect = isGuessed && word.includes(letter);
            const isWrong = isGuessed && !word.includes(letter);

            return (
              <button
                key={letter}
                onClick={() => guessLetter(letter)}
                disabled={isGuessed}
                className={`w-9 h-10 md:w-10 md:h-12 rounded-lg font-bold text-lg transition-all ${
                  isCorrect
                    ? "bg-green-500 text-white"
                    : isWrong
                      ? "bg-red-400 text-white"
                      : "bg-slate-200 hover:bg-slate-300 active:scale-95"
                } ${isGuessed ? "opacity-60" : ""}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
