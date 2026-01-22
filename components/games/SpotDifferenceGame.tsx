"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Eye } from "lucide-react";

interface SpotDifferenceGameProps {
  difficulty: "easy" | "medium" | "hard";
}

interface SceneElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation?: number;
}

interface Difference {
  id: string;
  x: number;
  y: number;
  found: boolean;
}

const SCENES = [
  {
    name: "Park",
    background: "from-green-200 to-blue-200",
    elements: [
      { emoji: "🌳", x: 10, y: 70, size: 48 },
      { emoji: "🌳", x: 85, y: 65, size: 52 },
      { emoji: "🌲", x: 25, y: 60, size: 40 },
      { emoji: "🌸", x: 15, y: 45, size: 24 },
      { emoji: "🌺", x: 75, y: 50, size: 22 },
      { emoji: "🌻", x: 45, y: 55, size: 26 },
      { emoji: "🦋", x: 30, y: 25, size: 20, rotation: 15 },
      { emoji: "🐦", x: 70, y: 20, size: 22 },
      { emoji: "🐿️", x: 55, y: 75, size: 20 },
      { emoji: "☀️", x: 80, y: 8, size: 36 },
      { emoji: "☁️", x: 20, y: 10, size: 32 },
      { emoji: "☁️", x: 50, y: 5, size: 28 },
      { emoji: "🌈", x: 60, y: 15, size: 40 },
      { emoji: "🦆", x: 40, y: 80, size: 24 },
      { emoji: "🐕", x: 65, y: 78, size: 26 },
    ],
  },
  {
    name: "Beach",
    background: "from-yellow-200 to-cyan-300",
    elements: [
      { emoji: "🌴", x: 8, y: 50, size: 56 },
      { emoji: "🌴", x: 88, y: 55, size: 50 },
      { emoji: "🏖️", x: 50, y: 70, size: 40 },
      { emoji: "🦀", x: 30, y: 82, size: 22 },
      { emoji: "🐚", x: 60, y: 85, size: 20 },
      { emoji: "🐚", x: 75, y: 80, size: 18 },
      { emoji: "⛱️", x: 35, y: 60, size: 36 },
      { emoji: "🏄", x: 70, y: 45, size: 28 },
      { emoji: "🌊", x: 50, y: 35, size: 60 },
      { emoji: "☀️", x: 75, y: 8, size: 40 },
      { emoji: "🦩", x: 15, y: 65, size: 28 },
      { emoji: "🐠", x: 45, y: 40, size: 20 },
      { emoji: "🦈", x: 25, y: 38, size: 24 },
      { emoji: "⭐", x: 55, y: 88, size: 16 },
      { emoji: "🦞", x: 80, y: 75, size: 22 },
    ],
  },
  {
    name: "Space",
    background: "from-indigo-900 to-purple-900",
    elements: [
      { emoji: "🌙", x: 80, y: 15, size: 44 },
      { emoji: "⭐", x: 15, y: 20, size: 20 },
      { emoji: "⭐", x: 30, y: 10, size: 16 },
      { emoji: "⭐", x: 55, y: 25, size: 18 },
      { emoji: "⭐", x: 70, y: 8, size: 14 },
      { emoji: "✨", x: 25, y: 35, size: 16 },
      { emoji: "✨", x: 65, y: 40, size: 14 },
      { emoji: "🚀", x: 40, y: 50, size: 40, rotation: -30 },
      { emoji: "🛸", x: 70, y: 60, size: 36 },
      { emoji: "🪐", x: 20, y: 55, size: 48 },
      { emoji: "🌍", x: 75, y: 75, size: 36 },
      { emoji: "👽", x: 50, y: 75, size: 28 },
      { emoji: "🌟", x: 10, y: 80, size: 22 },
      { emoji: "☄️", x: 85, y: 35, size: 30, rotation: 45 },
      { emoji: "🛰️", x: 35, y: 25, size: 26 },
    ],
  },
  {
    name: "Farm",
    background: "from-green-300 to-amber-200",
    elements: [
      { emoji: "🏠", x: 75, y: 40, size: 48 },
      { emoji: "🌾", x: 20, y: 75, size: 28 },
      { emoji: "🌾", x: 35, y: 78, size: 26 },
      { emoji: "🌾", x: 50, y: 76, size: 30 },
      { emoji: "🐄", x: 25, y: 60, size: 32 },
      { emoji: "🐖", x: 55, y: 65, size: 28 },
      { emoji: "🐔", x: 70, y: 70, size: 24 },
      { emoji: "🐓", x: 85, y: 68, size: 26 },
      { emoji: "🐑", x: 40, y: 55, size: 26 },
      { emoji: "🚜", x: 10, y: 50, size: 36 },
      { emoji: "☀️", x: 80, y: 10, size: 36 },
      { emoji: "🌻", x: 60, y: 80, size: 24 },
      { emoji: "🐴", x: 15, y: 35, size: 34 },
      { emoji: "🐕", x: 65, y: 55, size: 22 },
      { emoji: "🦆", x: 45, y: 85, size: 20 },
    ],
  },
  {
    name: "Underwater",
    background: "from-blue-400 to-blue-700",
    elements: [
      { emoji: "🐙", x: 15, y: 30, size: 44 },
      { emoji: "🐠", x: 40, y: 25, size: 28 },
      { emoji: "🐟", x: 70, y: 35, size: 26 },
      { emoji: "🐡", x: 55, y: 50, size: 24 },
      { emoji: "🦈", x: 80, y: 20, size: 36 },
      { emoji: "🐬", x: 25, y: 55, size: 32 },
      { emoji: "🐢", x: 60, y: 70, size: 30 },
      { emoji: "🦑", x: 45, y: 75, size: 28 },
      { emoji: "🪸", x: 10, y: 80, size: 36 },
      { emoji: "🪸", x: 85, y: 75, size: 32 },
      { emoji: "🐚", x: 30, y: 85, size: 22 },
      { emoji: "⭐", x: 75, y: 85, size: 20 },
      { emoji: "🦀", x: 50, y: 88, size: 24 },
      { emoji: "🫧", x: 35, y: 15, size: 18 },
      { emoji: "🫧", x: 65, y: 10, size: 16 },
    ],
  },
];

const DIFFICULTY_CONFIG = {
  easy: { differences: 3, hintAllowed: true },
  medium: { differences: 5, hintAllowed: true },
  hard: { differences: 7, hintAllowed: false },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function SpotDifferenceGame({ difficulty }: SpotDifferenceGameProps) {
  const [scene, setScene] = useState(SCENES[0]);
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());
  const [foundCount, setFoundCount] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongClick, setWrongClick] = useState<{ x: number; y: number } | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const initializeGame = useCallback(() => {
    // Pick random scene
    const randomScene = SCENES[Math.floor(Math.random() * SCENES.length)];
    setScene(randomScene);

    // Pick random elements to hide (these become the differences)
    const shuffledElements = shuffleArray(randomScene.elements);
    const elementsToHide = shuffledElements.slice(0, config.differences);

    const newHidden = new Set(elementsToHide.map((_, i) => shuffledElements[i].emoji + "-" + i));

    // Create difference locations based on hidden elements
    const newDifferences: Difference[] = elementsToHide.map((el, i) => ({
      id: el.emoji + "-" + i,
      x: el.x,
      y: el.y,
      found: false,
    }));

    // Store which element indices to hide
    const hiddenIndices = new Set<string>();
    elementsToHide.forEach((el) => {
      const index = randomScene.elements.findIndex(
        (e) => e.emoji === el.emoji && e.x === el.x && e.y === el.y
      );
      if (index >= 0) hiddenIndices.add(String(index));
    });

    setHiddenElements(hiddenIndices);
    setDifferences(newDifferences);
    setFoundCount(0);
    setIsWon(false);
    setShowHint(false);
    setWrongClick(null);
  }, [config.differences]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, isRight: boolean) => {
    if (isWon) return;
    if (!isRight) return; // Only check clicks on the right (modified) image

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if click is near any unfound difference
    let foundDiff = false;
    const newDifferences = differences.map((diff) => {
      if (!diff.found) {
        const distance = Math.sqrt(Math.pow(diff.x - x, 2) + Math.pow(diff.y - y, 2));
        if (distance < 12) {
          foundDiff = true;
          return { ...diff, found: true };
        }
      }
      return diff;
    });

    if (foundDiff) {
      setDifferences(newDifferences);
      const newFoundCount = foundCount + 1;
      setFoundCount(newFoundCount);
      if (newFoundCount === config.differences) {
        setIsWon(true);
      }
    } else {
      // Wrong click - show X briefly
      setWrongClick({ x, y });
      setTimeout(() => setWrongClick(null), 500);
    }
  };

  const renderScene = (showDifferences: boolean) => (
    <div
      className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br ${scene.background} cursor-crosshair`}
      onClick={(e) => handleClick(e, showDifferences)}
    >
      {scene.elements.map((el, index) => {
        const isHidden = showDifferences && hiddenElements.has(String(index));
        const diff = differences.find((d) => d.x === el.x && d.y === el.y);
        const isFound = diff?.found;

        if (isHidden) return null;

        return (
          <div
            key={index}
            className={`absolute transition-all ${isFound ? "animate-pulse" : ""}`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              fontSize: el.size,
              transform: `translate(-50%, -50%) ${el.rotation ? `rotate(${el.rotation}deg)` : ""}`,
            }}
          >
            {el.emoji}
          </div>
        );
      })}

      {/* Show found markers */}
      {showDifferences &&
        differences
          .filter((d) => d.found)
          .map((diff) => (
            <div
              key={diff.id}
              className="absolute w-10 h-10 border-4 border-green-500 rounded-full animate-ping"
              style={{
                left: `${diff.x}%`,
                top: `${diff.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

      {/* Show wrong click X */}
      {showDifferences && wrongClick && (
        <div
          className="absolute text-3xl text-red-500 font-bold animate-bounce"
          style={{
            left: `${wrongClick.x}%`,
            top: `${wrongClick.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          ✗
        </div>
      )}

      {/* Show hints */}
      {showHint &&
        differences
          .filter((d) => !d.found)
          .map((diff) => (
            <div
              key={diff.id + "-hint"}
              className="absolute w-8 h-8 border-2 border-yellow-400 rounded-full animate-pulse bg-yellow-200/30"
              style={{
                left: `${diff.x}%`,
                top: `${diff.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-4xl mx-auto">
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-lg">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Found:</span>
          <span className="font-bold text-green-600">
            {foundCount}/{config.differences}
          </span>
        </div>
        <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-700 font-medium">
          {scene.name}
        </div>
      </div>

      {/* Instructions */}
      <p className="text-slate-500 text-sm text-center">
        Find {config.differences} differences! Tap on the RIGHT image where something is missing.
      </p>

      {/* Game area - two images side by side */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full">
        <div className="relative">
          <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded-lg text-xs font-medium text-slate-600">
            Original
          </div>
          {renderScene(false)}
        </div>
        <div className="relative">
          <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded-lg text-xs font-medium text-slate-600">
            Find differences
          </div>
          {renderScene(true)}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {config.hintAllowed && !isWon && (
          <button
            onClick={() => setShowHint(!showHint)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors min-h-[48px] ${
              showHint
                ? "bg-yellow-100 text-yellow-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Eye className="w-5 h-5" />
            {showHint ? "Hide Hints" : "Show Hints"}
          </button>
        )}
        <button
          onClick={initializeGame}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-medium transition-colors min-h-[48px]"
        >
          <RotateCcw className="w-5 h-5" />
          New Game
        </button>
      </div>

      {/* Win screen */}
      {isWon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">🎉👀</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              Eagle Eyes!
            </h2>
            <p className="text-slate-600 mb-6">
              You found all {config.differences} differences!
            </p>
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
    </div>
  );
}
