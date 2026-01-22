"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Trophy } from "lucide-react";

interface MemoryMatchGameProps {
  difficulty: "easy" | "medium" | "hard";
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_SETS = {
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵"],
  food: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🥝", "🍑", "🥭", "🍍", "🥥"],
  nature: ["🌸", "🌺", "🌻", "🌹", "🌷", "🌼", "🍀", "🌲", "🌴", "🌵", "🍁", "🍂", "🌾", "🌿", "☘️"],
  space: ["🌙", "⭐", "🌟", "✨", "💫", "☀️", "🌍", "🪐", "🚀", "👽", "🛸", "🌌", "☄️", "🔭", "🌈"],
  sports: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎱", "🏓", "🏸", "🥊", "🎯", "🛹", "🎿", "🏄", "🚴"],
};

const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, cols: 4, rows: 3 },
  medium: { pairs: 8, cols: 4, rows: 4 },
  hard: { pairs: 10, cols: 5, rows: 4 },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MemoryMatchGame({ difficulty }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const config = DIFFICULTY_CONFIG[difficulty];

  const initializeGame = useCallback(() => {
    // Pick a random emoji set
    const setNames = Object.keys(EMOJI_SETS) as (keyof typeof EMOJI_SETS)[];
    const randomSet = EMOJI_SETS[setNames[Math.floor(Math.random() * setNames.length)]];

    // Pick random emojis for pairs
    const shuffledEmojis = shuffleArray(randomSet);
    const selectedEmojis = shuffledEmojis.slice(0, config.pairs);

    // Create pairs
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    const shuffledCards = shuffleArray(cardPairs);

    const newCards: Card[] = shuffledCards.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setIsWon(false);
    setIsLocked(false);
    setStartTime(null);
    setElapsedTime(0);
  }, [config.pairs]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer
  useEffect(() => {
    if (!startTime || isWon) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isWon]);

  const handleCardClick = (cardId: number) => {
    if (isLocked) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId].isMatched) return;
    if (flippedCards.length >= 2) return;

    // Start timer on first move
    if (!startTime) {
      setStartTime(Date.now());
    }

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // Update card to flipped
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsLocked(true);

      const [first, second] = newFlipped;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found!
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === config.pairs) {
              setIsWon(true);
            }
            return newMatches;
          });
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === first || card.id === second
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStarRating = () => {
    const perfectMoves = config.pairs;
    const ratio = perfectMoves / moves;
    if (ratio >= 0.8) return 3;
    if (ratio >= 0.5) return 2;
    return 1;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-lg">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Moves:</span>
          <span className="font-bold text-purple-600">{moves}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Matches:</span>
          <span className="font-bold text-green-600">{matches}/{config.pairs}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Time:</span>
          <span className="font-bold text-blue-600">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Game grid */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
          maxWidth: config.cols * 80 + (config.cols - 1) * 12,
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || isLocked}
            className={`
              aspect-square w-14 sm:w-16 md:w-18 rounded-xl text-3xl sm:text-4xl
              transition-all duration-300 transform
              ${card.isFlipped || card.isMatched
                ? "bg-white shadow-lg scale-100 rotate-0"
                : "bg-gradient-to-br from-purple-500 to-blue-500 shadow-md hover:scale-105 hover:shadow-lg"
              }
              ${card.isMatched ? "opacity-70 scale-95" : ""}
              ${!card.isFlipped && !card.isMatched ? "cursor-pointer" : ""}
            `}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {card.isFlipped || card.isMatched ? (
              <span className="block">{card.emoji}</span>
            ) : (
              <span className="text-white text-2xl">?</span>
            )}
          </button>
        ))}
      </div>

      {/* Win screen */}
      {isWon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">You Won!</h2>
            <div className="text-4xl mb-4">
              {Array(getStarRating()).fill("⭐").join("")}
              {Array(3 - getStarRating()).fill("☆").join("")}
            </div>
            <div className="space-y-1 text-slate-600 mb-6">
              <p>Moves: <span className="font-bold">{moves}</span></p>
              <p>Time: <span className="font-bold">{formatTime(elapsedTime)}</span></p>
            </div>
            <button
              onClick={initializeGame}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Reset button */}
      {!isWon && (
        <button
          onClick={initializeGame}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-medium transition-colors min-h-[48px]"
        >
          <RotateCcw className="w-5 h-5" />
          New Game
        </button>
      )}
    </div>
  );
}
