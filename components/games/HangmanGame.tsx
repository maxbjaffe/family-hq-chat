"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, X, Settings } from "lucide-react";
import { getRandomHangmanWord, type Difficulty } from "@/lib/game-words";
import {
  AnimalCharacter,
  MonsterCharacter,
  RobotCharacter,
} from "@/components/games/hangman-characters";

const MAX_WRONG = 6;

// Character types for random selection
const CHARACTER_TYPES = ['animal', 'robot', 'monster'] as const;
type CharacterType = typeof CHARACTER_TYPES[number];

interface HangmanGameProps {
  difficulty?: Difficulty;
  onChangeDifficulty?: () => void;
}

export function HangmanGame({ difficulty = 'easy', onChangeDifficulty }: HangmanGameProps) {
  const [word, setWord] = useState("");
  const [category, setCategory] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [characterType, setCharacterType] = useState<CharacterType>('animal');

  const startNewGame = useCallback(() => {
    const { word: randomWord, category: randomCategory } = getRandomHangmanWord(difficulty);
    const randomCharacter = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];

    setWord(randomWord);
    setCategory(randomCategory);
    setCharacterType(randomCharacter);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameOver(false);
    setWon(false);
  }, [difficulty]);

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

  // Render the appropriate character based on characterType
  const renderCharacter = () => {
    const props = { wrongGuesses, won };
    switch (characterType) {
      case 'robot':
        return <RobotCharacter {...props} />;
      case 'monster':
        return <MonsterCharacter {...props} />;
      case 'animal':
      default:
        return <AnimalCharacter {...props} />;
    }
  };

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

      {/* Character */}
      <div className="flex justify-center mb-4">
        {renderCharacter()}
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
