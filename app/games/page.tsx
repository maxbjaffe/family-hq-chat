"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  Paintbrush,
  Type,
  Grid3X3,
  ArrowLeft,
  Search,
  Shuffle,
  GitBranch,
  Layers,
} from "lucide-react";
import { WordleGame } from "@/components/games/WordleGame";
import { HangmanGame } from "@/components/games/HangmanGame";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { WordSearchGame } from "@/components/games/WordSearchGame";
import { AnagramsGame } from "@/components/games/AnagramsGame";
import { WordLadderGame } from "@/components/games/WordLadderGame";
import { MemoryMatchGame } from "@/components/games/MemoryMatchGame";
import { DifficultySelect } from "@/components/games/DifficultySelect";

type Difficulty = "easy" | "medium" | "hard";

type GameType = "menu" | "doodle" | "wordle" | "hangman" | "tictactoe" | "wordsearch" | "anagrams" | "wordladder" | "memorymatch";

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
  {
    id: "memorymatch" as const,
    name: "Memory Match",
    description: "Flip cards to find matching pairs!",
    icon: Layers,
    color: "from-amber-500 to-orange-500",
    bgColor: "from-amber-50 to-orange-50",
  },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>("menu");
  const [wordleDifficulty, setWordleDifficulty] = useState<Difficulty | null>(null);
  const [hangmanDifficulty, setHangmanDifficulty] = useState<Difficulty | null>(null);
  const [wordSearchDifficulty, setWordSearchDifficulty] = useState<Difficulty | null>(null);
  const [anagramsDifficulty, setAnagramsDifficulty] = useState<Difficulty | null>(null);
  const [wordLadderDifficulty, setWordLadderDifficulty] = useState<Difficulty | null>(null);
  const [memoryMatchDifficulty, setMemoryMatchDifficulty] = useState<Difficulty | null>(null);

  // Show game menu
  if (activeGame === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Gamepad2 className="h-10 w-10 text-purple-600" />
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Break Time!
              </h1>
            </div>
            <p className="text-slate-600 text-lg">
              Pick a game and have some fun!
            </p>
          </div>

          {/* Game Grid */}
          <div className="grid grid-cols-2 gap-6">
            {games.map((game) => {
              const Icon = game.icon;

              // Doodle links to separate page
              if (game.id === "doodle") {
                return (
                  <Link
                    key={game.id}
                    href="/doodle"
                    className="text-left focus:outline-none focus:ring-4 focus:ring-purple-300 rounded-3xl"
                  >
                    <Card
                      className={`p-6 h-full bg-gradient-to-br ${game.bgColor} border-2 border-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer`}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 shadow-lg`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h2
                        className="text-2xl font-black text-slate-800 mb-1"
                        style={{
                          fontFamily:
                            "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
                        }}
                      >
                        {game.name}
                      </h2>
                      <p className="text-slate-600">{game.description}</p>
                    </Card>
                  </Link>
                );
              }

              return (
                <button
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  className="text-left focus:outline-none focus:ring-4 focus:ring-purple-300 rounded-3xl"
                >
                  <Card
                    className={`p-6 h-full bg-gradient-to-br ${game.bgColor} border-2 border-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer`}
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h2
                      className="text-2xl font-black text-slate-800 mb-1"
                      style={{
                        fontFamily:
                          "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
                      }}
                    >
                      {game.name}
                    </h2>
                    <p className="text-slate-600">{game.description}</p>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show selected game
  const selectedGame = games.find((g) => g.id === activeGame);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${selectedGame?.bgColor || "from-slate-50 to-slate-100"}`}
    >
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => {
            setActiveGame("menu");
            // Reset difficulty when going back to menu
            if (activeGame === "wordle") setWordleDifficulty(null);
            if (activeGame === "hangman") setHangmanDifficulty(null);
            if (activeGame === "wordsearch") setWordSearchDifficulty(null);
            if (activeGame === "anagrams") setAnagramsDifficulty(null);
            if (activeGame === "wordladder") setWordLadderDifficulty(null);
            if (activeGame === "memorymatch") setMemoryMatchDifficulty(null);
          }}
          className="mb-4 min-h-[48px]"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Games
        </Button>

        {/* Game Component */}
        {activeGame === "wordle" && (
          wordleDifficulty === null ? (
            <DifficultySelect
              gameName="Word Guess"
              onSelect={(difficulty) => setWordleDifficulty(difficulty)}
            />
          ) : (
            <WordleGame
              difficulty={wordleDifficulty}
              onChangeDifficulty={() => setWordleDifficulty(null)}
            />
          )
        )}
        {activeGame === "hangman" && (
          hangmanDifficulty === null ? (
            <DifficultySelect
              gameName="Hangman"
              onSelect={(difficulty) => setHangmanDifficulty(difficulty)}
            />
          ) : (
            <HangmanGame
              difficulty={hangmanDifficulty}
              onChangeDifficulty={() => setHangmanDifficulty(null)}
            />
          )
        )}
        {activeGame === "tictactoe" && <TicTacToeGame />}
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
        {activeGame === "memorymatch" && (
          memoryMatchDifficulty === null ? (
            <DifficultySelect
              gameName="Memory Match"
              onSelect={(difficulty) => setMemoryMatchDifficulty(difficulty)}
            />
          ) : (
            <MemoryMatchGame difficulty={memoryMatchDifficulty} />
          )
        )}
      </div>
    </div>
  );
}
