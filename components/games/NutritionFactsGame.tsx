"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw, ChevronRight, Sparkles } from "lucide-react";
import type {
  NutritionFact,
  EducationDifficulty,
} from "@/lib/nutrition/education-types";

interface NutritionFactsGameProps {
  difficulty: EducationDifficulty;
  onChangeDifficulty: () => void;
}

const FACTS_COUNT = 10;

const LOADING_MESSAGES = [
  "Digging up food secrets...",
  "Exploring body science...",
  "Finding mind-blowing facts...",
  "Cracking open the nutrition lab...",
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Body Power": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Food Secrets": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Sugar Spy": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Nature's Science": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Myth Buster": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "World Foods": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
};

const HISTORY_KEY = "nutritionfacts-history";
const MAX_HISTORY = 60;

function getRecentTitles(): string[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTitles(titles: string[]) {
  try {
    const existing = getRecentTitles();
    const combined = [...titles, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(combined));
  } catch {
    // localStorage not available
  }
}

export function NutritionFactsGame({
  difficulty,
  onChangeDifficulty,
}: NutritionFactsGameProps) {
  const [facts, setFacts] = useState<NutritionFact[]>([]);
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [mindBlownCount, setMindBlownCount] = useState(0);
  const [loadingMsg] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
  );

  const loadFacts = useCallback(async () => {
    setFacts([]);
    setCurrent(0);
    setIsComplete(false);
    setMindBlownCount(0);
    setIsLoading(true);

    const recentTitles = getRecentTitles();

    try {
      const res = await fetch("/api/nutrition/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "facts",
          difficulty,
          count: FACTS_COUNT,
          recentTitles: recentTitles.slice(0, 30),
        }),
      });
      const data = await res.json();
      if (data.facts?.length) {
        setFacts(data.facts);
        saveTitles(data.facts.map((f: NutritionFact) => f.title));
      }
    } catch (error) {
      console.error("[NutritionFacts] Failed to fetch facts:", error);
    }

    setIsLoading(false);
  }, [difficulty]);

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  const fact = facts[current];

  const handleNext = () => {
    if (current + 1 >= facts.length) {
      setIsComplete(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handleMindBlown = () => {
    setMindBlownCount((c) => c + 1);
    handleNext();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 max-w-lg mx-auto min-h-[300px]">
        <div className="text-6xl animate-pulse">{"\u{1F52C}"}</div>
        <p
          className="text-lg font-bold text-slate-600 text-center"
          style={{
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
          }}
        >
          {loadingMsg}
        </p>
        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // No facts loaded
  if (facts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 max-w-lg mx-auto">
        <div className="text-4xl">{"\u{1F615}"}</div>
        <p className="text-slate-600">
          Couldn&apos;t load facts. Please try again!
        </p>
        <button
          onClick={loadFacts}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
        >
          <RotateCcw className="w-5 h-5" /> Retry
        </button>
      </div>
    );
  }

  // Complete screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl max-h-[90vh] overflow-auto">
          <div className="text-6xl mb-3">
            <Sparkles className="w-16 h-16 mx-auto text-orange-500" />
          </div>
          <h2
            className="text-2xl font-bold text-orange-600 mb-2"
            style={{
              fontFamily:
                "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
            }}
          >
            Nutrition Expert!
          </h2>
          <div className="space-y-2 text-slate-600 mb-6">
            <p className="text-lg">
              {"\u{1F4A1}"} <span className="font-bold">{facts.length}</span> facts learned
            </p>
            {mindBlownCount > 0 && (
              <p className="text-lg">
                {"\u{1F92F}"} <span className="font-bold">{mindBlownCount}</span> mind-blown moments
              </p>
            )}
          </div>

          {/* Recap — last 3 fact titles */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
            <h3
              className="text-sm font-bold text-orange-700 mb-2"
              style={{
                fontFamily:
                  "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              }}
            >
              {"\u{1F4DA}"} Your Top Facts:
            </h3>
            <ul className="space-y-1">
              {facts.slice(0, 3).map((f, i) => (
                <li key={i} className="text-xs text-slate-600">
                  {f.emoji} {f.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={loadFacts}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
            >
              <RotateCcw className="w-5 h-5" /> More Facts!
            </button>
            <button
              onClick={onChangeDifficulty}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 min-h-[48px]"
            >
              Change Difficulty
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active fact card
  if (!fact) return null;

  const colors = CATEGORY_COLORS[fact.category] || CATEGORY_COLORS["Food Secrets"];

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      {/* Progress */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-slate-500 mb-1">
          <span>
            Fact {current + 1} / {facts.length}
          </span>
          {mindBlownCount > 0 && (
            <span>{"\u{1F92F}"} {mindBlownCount}</span>
          )}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all duration-300"
            style={{
              width: `${((current + 1) / facts.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Fact card */}
      <div className={`w-full ${colors.bg} border ${colors.border} rounded-2xl p-6 shadow-md`}>
        {/* Category badge */}
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs font-semibold ${colors.text} px-2 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
            {fact.category}
          </span>
          <span className="text-xs text-slate-400 capitalize">{difficulty}</span>
        </div>

        {/* Emoji + Title */}
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">{fact.emoji}</div>
          <h3
            className="text-xl font-bold text-slate-800 leading-snug"
            style={{
              fontFamily:
                "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
            }}
          >
            {fact.title}
          </h3>
        </div>

        {/* Fact body */}
        <p className="text-slate-700 leading-relaxed text-center">
          {fact.body}
        </p>
      </div>

      {/* Action buttons */}
      <div className="w-full flex gap-3">
        <button
          onClick={handleMindBlown}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-orange-300 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 active:scale-[0.98] min-h-[48px] transition-all"
        >
          {"\u{1F92F}"} Mind Blown!
        </button>
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] min-h-[48px] transition-all"
        >
          {current + 1 >= facts.length ? "Done" : "Next"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
