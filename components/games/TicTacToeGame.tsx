"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, Users, Bot } from "lucide-react";

type Player = "X" | "O" | null;
type Board = Player[];
type GameMode = "select" | "pvp" | "pvc";

const WINNING_COMBINATIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal
  [2, 4, 6], // Anti-diagonal
];

export function TicTacToeGame() {
  const [mode, setMode] = useState<GameMode>("select");
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const checkWinner = useCallback((squares: Board): Player | "draw" | null => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        setWinningLine(combo);
        return squares[a];
      }
    }
    if (squares.every((s) => s !== null)) {
      return "draw";
    }
    return null;
  }, []);

  const getAIMove = useCallback((squares: Board): number => {
    // Simple AI: Try to win, then block, then take center, then random
    const emptySquares = squares
      .map((s, i) => (s === null ? i : -1))
      .filter((i) => i !== -1);

    // Try to win
    for (const i of emptySquares) {
      const testBoard = [...squares];
      testBoard[i] = "O";
      for (const combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (
          testBoard[a] === "O" &&
          testBoard[b] === "O" &&
          testBoard[c] === "O"
        ) {
          return i;
        }
      }
    }

    // Block player from winning
    for (const i of emptySquares) {
      const testBoard = [...squares];
      testBoard[i] = "X";
      for (const combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (
          testBoard[a] === "X" &&
          testBoard[b] === "X" &&
          testBoard[c] === "X"
        ) {
          return i;
        }
      }
    }

    // Take center if available
    if (squares[4] === null) return 4;

    // Take a corner
    const corners = [0, 2, 6, 8].filter((i) => squares[i] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // Take any available
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }, []);

  const handleClick = useCallback(
    (index: number) => {
      if (board[index] || winner) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result);
        if (result === "X") {
          setScores((s) => ({ ...s, X: s.X + 1 }));
        } else if (result === "O") {
          setScores((s) => ({ ...s, O: s.O + 1 }));
        } else {
          setScores((s) => ({ ...s, draws: s.draws + 1 }));
        }
        return;
      }

      // Switch player or trigger AI
      if (mode === "pvc" && currentPlayer === "X") {
        setCurrentPlayer("O");
        // AI move after a short delay
        setTimeout(() => {
          const aiMove = getAIMove(newBoard);
          const aiBoard = [...newBoard];
          aiBoard[aiMove] = "O";
          setBoard(aiBoard);

          const aiResult = checkWinner(aiBoard);
          if (aiResult) {
            setWinner(aiResult);
            if (aiResult === "O") {
              setScores((s) => ({ ...s, O: s.O + 1 }));
            } else if (aiResult === "draw") {
              setScores((s) => ({ ...s, draws: s.draws + 1 }));
            }
          } else {
            setCurrentPlayer("X");
          }
        }, 500);
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    },
    [board, currentPlayer, winner, mode, checkWinner, getAIMove]
  );

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningLine(null);
  }, []);

  const resetAll = useCallback(() => {
    resetGame();
    setScores({ X: 0, O: 0, draws: 0 });
    setMode("select");
  }, [resetGame]);

  // Mode selection screen
  if (mode === "select") {
    return (
      <Card className="p-6">
        <div className="text-center mb-8">
          <h2
            className="text-3xl font-black text-slate-800 mb-2"
            style={{
              fontFamily:
                "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
            }}
          >
            Tic-Tac-Toe
          </h2>
          <p className="text-slate-600">Choose how you want to play!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <button
            onClick={() => setMode("pvp")}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-lg hover:scale-105 transition-all"
          >
            <Users className="h-12 w-12 mx-auto mb-3 text-blue-500" />
            <div className="text-lg font-bold text-slate-800">2 Players</div>
            <div className="text-sm text-slate-600">Play with a friend</div>
          </button>

          <button
            onClick={() => setMode("pvc")}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg hover:scale-105 transition-all"
          >
            <Bot className="h-12 w-12 mx-auto mb-3 text-purple-500" />
            <div className="text-lg font-bold text-slate-800">vs Computer</div>
            <div className="text-sm text-slate-600">Challenge the AI</div>
          </button>
        </div>
      </Card>
    );
  }

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
          Tic-Tac-Toe
        </h2>
        <p className="text-slate-600">
          {mode === "pvp" ? "2 Players" : "vs Computer"}
        </p>
      </div>

      {/* Score Board */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">X</div>
          <div className="text-xl font-bold">{scores.X}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-400">Draws</div>
          <div className="text-xl font-bold">{scores.draws}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">O</div>
          <div className="text-xl font-bold">{scores.O}</div>
        </div>
      </div>

      {/* Current Player / Winner */}
      <div className="text-center mb-4">
        {winner ? (
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-xl font-bold">
              {winner === "draw" ? "It's a Draw!" : `${winner} Wins!`}
            </span>
          </div>
        ) : (
          <span className="text-lg">
            Current Turn:{" "}
            <span
              className={`font-bold text-2xl ${currentPlayer === "X" ? "text-blue-500" : "text-red-500"}`}
            >
              {currentPlayer}
            </span>
          </span>
        )}
      </div>

      {/* Game Board */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-3 gap-2 bg-slate-200 p-2 rounded-xl">
          {board.map((cell, index) => {
            const isWinning = winningLine?.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={!!winner || !!cell || (mode === "pvc" && currentPlayer === "O")}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-lg text-4xl md:text-5xl font-bold transition-all ${
                  isWinning
                    ? "bg-yellow-300 scale-105"
                    : cell
                      ? "bg-white"
                      : "bg-white hover:bg-slate-50 active:scale-95"
                } ${cell === "X" ? "text-blue-500" : "text-red-500"}`}
              >
                {cell}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {winner && (
          <Button
            onClick={resetGame}
            className="min-h-[48px] bg-gradient-to-r from-blue-500 to-cyan-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Play Again
          </Button>
        )}
        <Button
          onClick={resetAll}
          variant="outline"
          className="min-h-[48px]"
        >
          Change Mode
        </Button>
      </div>
    </Card>
  );
}
