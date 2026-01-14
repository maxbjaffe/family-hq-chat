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
} from "lucide-react";
import { WordleGame } from "@/components/games/WordleGame";
import { HangmanGame } from "@/components/games/HangmanGame";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";

type GameType = "menu" | "doodle" | "wordle" | "hangman" | "tictactoe";

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
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>("menu");

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
          onClick={() => setActiveGame("menu")}
          className="mb-4 min-h-[48px]"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Games
        </Button>

        {/* Game Component */}
        {activeGame === "wordle" && <WordleGame />}
        {activeGame === "hangman" && <HangmanGame />}
        {activeGame === "tictactoe" && <TicTacToeGame />}
      </div>
    </div>
  );
}
