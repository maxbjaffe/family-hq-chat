"use client";

import { Card } from "@/components/ui/card";

type Difficulty = "easy" | "medium" | "hard";

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void;
  gameName: string;
}

const difficulties: {
  level: Difficulty;
  label: string;
  subtitle: string;
  gradient: string;
  hoverGradient: string;
  bgGlow: string;
}[] = [
  {
    level: "easy",
    label: "Easy",
    subtitle: "Perfect for younger players",
    gradient: "from-green-500 to-emerald-500",
    hoverGradient: "hover:from-green-600 hover:to-emerald-600",
    bgGlow: "shadow-green-200",
  },
  {
    level: "medium",
    label: "Medium",
    subtitle: "A good challenge",
    gradient: "from-yellow-500 to-orange-500",
    hoverGradient: "hover:from-yellow-600 hover:to-orange-600",
    bgGlow: "shadow-yellow-200",
  },
  {
    level: "hard",
    label: "Hard",
    subtitle: "For word experts!",
    gradient: "from-red-500 to-purple-500",
    hoverGradient: "hover:from-red-600 hover:to-purple-600",
    bgGlow: "shadow-red-200",
  },
];

export function DifficultySelect({ onSelect, gameName }: DifficultySelectProps) {
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
          {gameName}
        </h2>
        <p className="text-slate-600 text-lg">Choose your difficulty level</p>
      </div>

      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {difficulties.map((difficulty) => (
          <button
            key={difficulty.level}
            onClick={() => onSelect(difficulty.level)}
            className={`
              w-full py-6 px-8 rounded-2xl
              bg-gradient-to-r ${difficulty.gradient} ${difficulty.hoverGradient}
              text-white font-bold
              shadow-lg ${difficulty.bgGlow}
              transform transition-all duration-200
              hover:scale-[1.02] hover:shadow-xl
              active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-purple-300
            `}
          >
            <div
              className="text-2xl mb-1"
              style={{
                fontFamily:
                  "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              }}
            >
              {difficulty.label}
            </div>
            <div className="text-sm opacity-90 font-normal">
              {difficulty.subtitle}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
