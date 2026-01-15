"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, X, Settings } from "lucide-react";
import { getRandomWordleWord, type Difficulty } from "@/lib/game-words";
import { isValidWord } from "@/lib/valid-words";

interface WordleGameProps {
  difficulty?: Difficulty;
  onChangeDifficulty?: () => void;
}

type LetterStatus = "correct" | "present" | "absent" | "empty";

interface Letter {
  char: string;
  status: LetterStatus;
}

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

export function WordleGame({ difficulty = 'easy', onChangeDifficulty }: WordleGameProps) {
  const [targetWord, setTargetWord] = useState("");
  const [guesses, setGuesses] = useState<Letter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [usedLetters, setUsedLetters] = useState<Record<string, LetterStatus>>({});
  const [invalidWordMessage, setInvalidWordMessage] = useState("");

  const startNewGame = useCallback(() => {
    const word = getRandomWordleWord(difficulty);
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess("");
    setGameOver(false);
    setWon(false);
    setUsedLetters({});
    setInvalidWordMessage("");
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const checkGuess = useCallback(
    (guess: string): Letter[] => {
      const result: Letter[] = [];
      const targetChars = targetWord.split("");
      const guessChars = guess.split("");

      // First pass: mark correct letters
      const remainingTarget: (string | null)[] = [...targetChars];
      guessChars.forEach((char, i) => {
        if (char === targetChars[i]) {
          result[i] = { char, status: "correct" };
          remainingTarget[i] = null;
        }
      });

      // Second pass: mark present and absent letters
      guessChars.forEach((char, i) => {
        if (result[i]) return;

        const targetIndex = remainingTarget.indexOf(char);
        if (targetIndex !== -1) {
          result[i] = { char, status: "present" };
          remainingTarget[targetIndex] = null;
        } else {
          result[i] = { char, status: "absent" };
        }
      });

      return result;
    },
    [targetWord]
  );

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Validate that the word is a real word
    if (!isValidWord(currentGuess)) {
      setShake(true);
      setInvalidWordMessage("Hmm, try a real word!");
      setTimeout(() => {
        setShake(false);
        setInvalidWordMessage("");
      }, 2000);
      return;
    }

    const result = checkGuess(currentGuess.toUpperCase());
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);

    // Update used letters
    const newUsedLetters = { ...usedLetters };
    result.forEach((letter) => {
      const current = newUsedLetters[letter.char];
      if (letter.status === "correct") {
        newUsedLetters[letter.char] = "correct";
      } else if (letter.status === "present" && current !== "correct") {
        newUsedLetters[letter.char] = "present";
      } else if (!current) {
        newUsedLetters[letter.char] = letter.status;
      }
    });
    setUsedLetters(newUsedLetters);

    // Check win/lose
    if (currentGuess.toUpperCase() === targetWord) {
      setWon(true);
      setGameOver(true);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
    }

    setCurrentGuess("");
  }, [currentGuess, guesses, checkGuess, usedLetters, targetWord]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameOver) return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (
        key.length === 1 &&
        key.match(/[A-Z]/i) &&
        currentGuess.length < WORD_LENGTH
      ) {
        setCurrentGuess((prev) => prev + key.toUpperCase());
      }
    },
    [gameOver, currentGuess, submitGuess]
  );

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  const getStatusColor = (status: LetterStatus) => {
    switch (status) {
      case "correct":
        return "bg-green-500 text-white border-green-600";
      case "present":
        return "bg-yellow-500 text-white border-yellow-600";
      case "absent":
        return "bg-slate-400 text-white border-slate-500";
      default:
        return "bg-white border-slate-300";
    }
  };

  const keyboard = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  // Build display grid
  const displayGrid: Letter[][] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      displayGrid.push(guesses[i]);
    } else if (i === guesses.length) {
      // Current guess row
      const row: Letter[] = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        row.push({
          char: currentGuess[j] || "",
          status: "empty",
        });
      }
      displayGrid.push(row);
    } else {
      // Empty row
      displayGrid.push(
        Array(WORD_LENGTH).fill({ char: "", status: "empty" as LetterStatus })
      );
    }
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h2
          className="text-3xl font-black text-slate-800 mb-1"
          style={{
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
          }}
        >
          Word Guess
        </h2>
        <p className="text-slate-600">Guess the 5-letter word in 6 tries!</p>
      </div>

      {/* Game Grid */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {displayGrid.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex gap-2 ${shake && rowIndex === guesses.length ? "animate-shake" : ""}`}
          >
            {row.map((letter, colIndex) => (
              <div
                key={colIndex}
                className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all ${getStatusColor(letter.status)} ${letter.char ? "scale-100" : "scale-95"}`}
              >
                {letter.char}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Invalid Word Message */}
      {invalidWordMessage && (
        <div className="text-center mb-4">
          <p className="text-amber-600 font-medium text-lg animate-pulse">
            {invalidWordMessage}
          </p>
        </div>
      )}

      {/* Game Over Message */}
      {gameOver && (
        <div className="text-center mb-6">
          {won ? (
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <Trophy className="h-8 w-8" />
              <span className="text-2xl font-bold">You Won!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
              <X className="h-8 w-8" />
              <span className="text-2xl font-bold">
                The word was: {targetWord}
              </span>
            </div>
          )}
          <Button
            onClick={startNewGame}
            className="min-h-[48px] bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Play Again
          </Button>
        </div>
      )}

      {/* Keyboard */}
      <div className="flex flex-col items-center gap-2">
        {keyboard.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((key) => {
              const status = usedLetters[key];
              const isSpecial = key === "ENTER" || key === "BACKSPACE";
              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  disabled={gameOver}
                  className={`${isSpecial ? "px-3 md:px-4" : "w-8 md:w-10"} h-12 md:h-14 rounded-lg font-bold text-sm md:text-base transition-all active:scale-95 ${
                    status
                      ? getStatusColor(status)
                      : "bg-slate-200 hover:bg-slate-300"
                  } ${gameOver ? "opacity-50" : ""}`}
                >
                  {key === "BACKSPACE" ? "⌫" : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

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

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </Card>
  );
}
