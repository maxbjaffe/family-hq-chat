"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Eye, Search } from "lucide-react";

interface HiddenObjectsGameProps {
  difficulty: "easy" | "medium" | "hard";
}

interface HiddenObject {
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation?: number;
  found: boolean;
}

interface SceneConfig {
  name: string;
  background: string;
  decorations: Array<{ emoji: string; x: number; y: number; size: number; rotation?: number }>;
  hiddenObjects: Array<{ emoji: string; x: number; y: number; size: number; rotation?: number }>;
}

const SCENES: SceneConfig[] = [
  {
    name: "Messy Bedroom",
    background: "from-blue-100 to-purple-100",
    decorations: [
      // Furniture
      { emoji: "🛏️", x: 70, y: 70, size: 80 },
      { emoji: "🪑", x: 15, y: 60, size: 36 },
      { emoji: "🖼️", x: 80, y: 20, size: 40 },
      { emoji: "🪟", x: 30, y: 15, size: 50 },
      { emoji: "💡", x: 85, y: 10, size: 28 },
      { emoji: "📚", x: 10, y: 40, size: 32 },
      { emoji: "📚", x: 18, y: 42, size: 28 },
      // Clutter
      { emoji: "👕", x: 45, y: 80, size: 26 },
      { emoji: "👖", x: 55, y: 85, size: 24 },
      { emoji: "🧦", x: 35, y: 88, size: 18 },
      { emoji: "📱", x: 60, y: 55, size: 20 },
      { emoji: "🎮", x: 25, y: 75, size: 22 },
      { emoji: "📖", x: 40, y: 65, size: 24 },
      { emoji: "🧸", x: 80, y: 55, size: 30 },
      { emoji: "⚽", x: 12, y: 85, size: 26 },
    ],
    hiddenObjects: [
      { emoji: "🔑", x: 22, y: 72, size: 16 },
      { emoji: "🎸", x: 8, y: 30, size: 34, rotation: -15 },
      { emoji: "🐱", x: 75, y: 48, size: 24 },
      { emoji: "🍕", x: 50, y: 75, size: 20 },
      { emoji: "💎", x: 88, y: 65, size: 16 },
      { emoji: "🎧", x: 32, y: 50, size: 22 },
      { emoji: "🕶️", x: 65, y: 35, size: 18 },
      { emoji: "🧲", x: 42, y: 25, size: 16 },
    ],
  },
  {
    name: "Kitchen Chaos",
    background: "from-amber-100 to-orange-100",
    decorations: [
      // Appliances
      { emoji: "🧊", x: 85, y: 50, size: 70 },
      { emoji: "🍳", x: 30, y: 45, size: 50 },
      { emoji: "🚰", x: 55, y: 40, size: 36 },
      // Cabinets/shelves
      { emoji: "🗄️", x: 15, y: 25, size: 44 },
      { emoji: "🗄️", x: 45, y: 20, size: 40 },
      // Food and items
      { emoji: "🍎", x: 25, y: 65, size: 22 },
      { emoji: "🍊", x: 32, y: 68, size: 20 },
      { emoji: "🥖", x: 60, y: 70, size: 28 },
      { emoji: "🥛", x: 70, y: 60, size: 24 },
      { emoji: "☕", x: 40, y: 55, size: 22 },
      { emoji: "🍽️", x: 50, y: 80, size: 26 },
      { emoji: "🥄", x: 45, y: 85, size: 18 },
      { emoji: "🍴", x: 55, y: 82, size: 20 },
      { emoji: "🧂", x: 38, y: 48, size: 18 },
      { emoji: "🫖", x: 22, y: 50, size: 26 },
    ],
    hiddenObjects: [
      { emoji: "🐭", x: 78, y: 85, size: 18 },
      { emoji: "🧁", x: 12, y: 55, size: 20 },
      { emoji: "🥕", x: 65, y: 25, size: 22 },
      { emoji: "🔔", x: 28, y: 30, size: 18 },
      { emoji: "🎂", x: 82, y: 35, size: 26 },
      { emoji: "🍪", x: 48, y: 32, size: 16 },
      { emoji: "🧲", x: 72, y: 72, size: 16 },
      { emoji: "💰", x: 18, y: 78, size: 18 },
    ],
  },
  {
    name: "Enchanted Forest",
    background: "from-green-200 to-emerald-300",
    decorations: [
      // Trees
      { emoji: "🌳", x: 10, y: 60, size: 70 },
      { emoji: "🌲", x: 85, y: 55, size: 65 },
      { emoji: "🌳", x: 50, y: 50, size: 60 },
      { emoji: "🌲", x: 30, y: 45, size: 55 },
      { emoji: "🌿", x: 20, y: 80, size: 30 },
      { emoji: "🌿", x: 70, y: 85, size: 28 },
      // Flowers
      { emoji: "🌸", x: 15, y: 75, size: 22 },
      { emoji: "🌺", x: 60, y: 78, size: 24 },
      { emoji: "🌻", x: 40, y: 82, size: 26 },
      { emoji: "🍄", x: 75, y: 75, size: 24 },
      { emoji: "🍄", x: 25, y: 70, size: 20 },
      // Sky
      { emoji: "☀️", x: 80, y: 10, size: 40 },
      { emoji: "☁️", x: 25, y: 12, size: 32 },
      { emoji: "🦋", x: 45, y: 25, size: 22 },
      { emoji: "🐦", x: 65, y: 20, size: 20 },
    ],
    hiddenObjects: [
      { emoji: "🦊", x: 35, y: 72, size: 26 },
      { emoji: "🦉", x: 55, y: 35, size: 24 },
      { emoji: "🐿️", x: 82, y: 42, size: 20 },
      { emoji: "🍎", x: 12, y: 48, size: 18 },
      { emoji: "🗝️", x: 42, y: 65, size: 16 },
      { emoji: "👑", x: 28, y: 55, size: 20 },
      { emoji: "🧚", x: 68, y: 45, size: 22 },
      { emoji: "💎", x: 78, y: 68, size: 16 },
    ],
  },
  {
    name: "Toy Store",
    background: "from-pink-100 to-yellow-100",
    decorations: [
      // Shelves
      { emoji: "🧸", x: 15, y: 35, size: 36 },
      { emoji: "🧸", x: 80, y: 40, size: 32 },
      { emoji: "🎠", x: 50, y: 30, size: 50 },
      // Toys
      { emoji: "🚗", x: 25, y: 70, size: 28 },
      { emoji: "🚂", x: 70, y: 75, size: 32 },
      { emoji: "🎪", x: 40, y: 55, size: 40 },
      { emoji: "🎈", x: 10, y: 20, size: 26 },
      { emoji: "🎈", x: 88, y: 15, size: 24 },
      { emoji: "🎈", x: 55, y: 12, size: 28 },
      { emoji: "🪀", x: 35, y: 80, size: 22 },
      { emoji: "🏀", x: 60, y: 85, size: 26 },
      { emoji: "🎯", x: 85, y: 60, size: 30 },
      { emoji: "🪁", x: 20, y: 50, size: 28 },
      { emoji: "🎲", x: 45, y: 75, size: 20 },
      { emoji: "🧩", x: 75, y: 55, size: 24 },
    ],
    hiddenObjects: [
      { emoji: "🐰", x: 30, y: 45, size: 24 },
      { emoji: "🦄", x: 65, y: 35, size: 28 },
      { emoji: "🎁", x: 12, y: 65, size: 26 },
      { emoji: "🍭", x: 82, y: 25, size: 22 },
      { emoji: "🎺", x: 48, y: 65, size: 24 },
      { emoji: "🪄", x: 22, y: 28, size: 20, rotation: 30 },
      { emoji: "👸", x: 58, y: 50, size: 26 },
      { emoji: "🤖", x: 38, y: 38, size: 24 },
    ],
  },
  {
    name: "Pirate Ship",
    background: "from-cyan-200 to-blue-300",
    decorations: [
      // Ship parts
      { emoji: "⛵", x: 50, y: 55, size: 100 },
      { emoji: "🏴‍☠️", x: 55, y: 20, size: 36 },
      // Ocean
      { emoji: "🌊", x: 15, y: 85, size: 40 },
      { emoji: "🌊", x: 50, y: 88, size: 36 },
      { emoji: "🌊", x: 85, y: 82, size: 38 },
      // Sky
      { emoji: "☀️", x: 85, y: 12, size: 36 },
      { emoji: "☁️", x: 20, y: 10, size: 30 },
      { emoji: "🦅", x: 75, y: 25, size: 24 },
      // Misc
      { emoji: "🦜", x: 42, y: 35, size: 22 },
      { emoji: "📜", x: 60, y: 60, size: 24 },
      { emoji: "⚓", x: 35, y: 75, size: 28 },
      { emoji: "🪝", x: 70, y: 55, size: 20 },
      { emoji: "🐚", x: 25, y: 80, size: 18 },
      { emoji: "🐠", x: 80, y: 90, size: 20 },
      { emoji: "🦈", x: 10, y: 78, size: 26 },
    ],
    hiddenObjects: [
      { emoji: "💰", x: 45, y: 50, size: 22 },
      { emoji: "🗡️", x: 65, y: 45, size: 24, rotation: 45 },
      { emoji: "🔭", x: 30, y: 42, size: 22, rotation: -20 },
      { emoji: "💎", x: 52, y: 68, size: 18 },
      { emoji: "🗺️", x: 72, y: 35, size: 20 },
      { emoji: "🧭", x: 38, y: 58, size: 18 },
      { emoji: "👒", x: 58, y: 28, size: 22 },
      { emoji: "🐙", x: 22, y: 70, size: 26 },
    ],
  },
];

const DIFFICULTY_CONFIG = {
  easy: { objectsToFind: 4, showHints: true },
  medium: { objectsToFind: 6, showHints: true },
  hard: { objectsToFind: 8, showHints: false },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function HiddenObjectsGame({ difficulty }: HiddenObjectsGameProps) {
  const [scene, setScene] = useState<SceneConfig>(SCENES[0]);
  const [objects, setObjects] = useState<HiddenObject[]>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongClick, setWrongClick] = useState<{ x: number; y: number } | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const config = DIFFICULTY_CONFIG[difficulty];

  const initializeGame = useCallback(() => {
    // Pick random scene
    const randomScene = SCENES[Math.floor(Math.random() * SCENES.length)];
    setScene(randomScene);

    // Pick random hidden objects to find
    const shuffledObjects = shuffleArray(randomScene.hiddenObjects);
    const selectedObjects = shuffledObjects.slice(0, config.objectsToFind);

    const newObjects: HiddenObject[] = selectedObjects.map((obj) => ({
      ...obj,
      found: false,
    }));

    setObjects(newObjects);
    setFoundCount(0);
    setIsWon(false);
    setShowHint(false);
    setWrongClick(null);
    setStartTime(null);
    setElapsedTime(0);
  }, [config.objectsToFind]);

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

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isWon) return;

    // Start timer on first click
    if (!startTime) {
      setStartTime(Date.now());
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if click is near any unfound object
    let foundObj = false;
    const newObjects = objects.map((obj) => {
      if (!obj.found) {
        const distance = Math.sqrt(Math.pow(obj.x - x, 2) + Math.pow(obj.y - y, 2));
        if (distance < 8) {
          foundObj = true;
          return { ...obj, found: true };
        }
      }
      return obj;
    });

    if (foundObj) {
      setObjects(newObjects);
      const newFoundCount = foundCount + 1;
      setFoundCount(newFoundCount);
      if (newFoundCount === config.objectsToFind) {
        setIsWon(true);
      }
    } else {
      // Wrong click
      setWrongClick({ x, y });
      setTimeout(() => setWrongClick(null), 500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-3xl mx-auto">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-lg flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-500" />
          <span className="font-bold text-purple-600">
            {foundCount}/{config.objectsToFind}
          </span>
        </div>
        <div className="px-3 py-1 bg-purple-100 rounded-full text-purple-700 font-medium">
          {scene.name}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Time:</span>
          <span className="font-bold text-blue-600">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Items to find */}
      <div className="flex items-center gap-2 flex-wrap justify-center bg-white/80 px-4 py-2 rounded-xl shadow">
        <span className="text-sm text-slate-500 mr-2">Find:</span>
        {objects.map((obj, index) => (
          <div
            key={index}
            className={`text-2xl sm:text-3xl p-1 rounded-lg transition-all ${
              obj.found
                ? "opacity-40 line-through bg-green-100"
                : "bg-purple-50 hover:bg-purple-100"
            }`}
          >
            {obj.emoji}
          </div>
        ))}
      </div>

      {/* Game area */}
      <div
        className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br ${scene.background} shadow-xl cursor-crosshair`}
        onClick={handleClick}
      >
        {/* Decorations */}
        {scene.decorations.map((dec, index) => (
          <div
            key={`dec-${index}`}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${dec.x}%`,
              top: `${dec.y}%`,
              fontSize: dec.size,
              transform: `translate(-50%, -50%) ${dec.rotation ? `rotate(${dec.rotation}deg)` : ""}`,
            }}
          >
            {dec.emoji}
          </div>
        ))}

        {/* Hidden objects */}
        {objects.map((obj, index) => (
          <div
            key={`obj-${index}`}
            className={`absolute select-none pointer-events-none transition-all ${
              obj.found ? "scale-125" : ""
            }`}
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              fontSize: obj.size,
              transform: `translate(-50%, -50%) ${obj.rotation ? `rotate(${obj.rotation}deg)` : ""}`,
            }}
          >
            {obj.emoji}
            {obj.found && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-500 rounded-full animate-ping" />
              </div>
            )}
          </div>
        ))}

        {/* Wrong click X */}
        {wrongClick && (
          <div
            className="absolute text-3xl text-red-500 font-bold animate-bounce pointer-events-none"
            style={{
              left: `${wrongClick.x}%`,
              top: `${wrongClick.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            ✗
          </div>
        )}

        {/* Hints */}
        {showHint &&
          objects
            .filter((obj) => !obj.found)
            .map((obj, index) => (
              <div
                key={`hint-${index}`}
                className="absolute w-10 h-10 border-2 border-yellow-400 rounded-full animate-pulse bg-yellow-200/40 pointer-events-none"
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {config.showHints && !isWon && (
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
            <div className="text-6xl mb-4">🔍🎉</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              Detective Master!
            </h2>
            <p className="text-slate-600 mb-2">
              You found all {config.objectsToFind} hidden objects!
            </p>
            <p className="text-lg font-medium text-blue-600 mb-6">
              Time: {formatTime(elapsedTime)}
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
