"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { METER_CONFIG } from "@/lib/nutrition/constants";
import { FOOD_DATABASE, type FoodSeedItem } from "@/lib/nutrition/food-data";
import type {
  NutritionFood,
  MeterValues,
  AvatarState,
  MealCategory,
} from "@/lib/nutrition/types";
import { calculateAvatarState, toPercentages } from "@/lib/nutrition/engine";
import { NutritionAvatar } from "@/components/nutrition/NutritionAvatar";
import { NutritionMeters } from "@/components/nutrition/NutritionMeters";
import { FoodCard } from "@/components/nutrition/FoodCard";

type Difficulty = "easy" | "medium" | "hard";

interface MealBuilderGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: () => void;
}

function toGameFood(item: FoodSeedItem): NutritionFood {
  return { ...item, id: item.name, image_url: null };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MEAL_THEMES: Record<
  string,
  { emoji: string; label: string; bg: string }
> = {
  breakfast: {
    emoji: "\uD83C\uDF05",
    label: "Breakfast Time!",
    bg: "from-amber-100 to-orange-100",
  },
  lunch: {
    emoji: "\uD83E\uDD6A",
    label: "Lunch Break!",
    bg: "from-green-100 to-emerald-100",
  },
  dinner: {
    emoji: "\uD83C\uDF7D\uFE0F",
    label: "Dinner's Ready!",
    bg: "from-indigo-100 to-purple-100",
  },
};

const MEAL_TYPES: MealCategory[] = ["breakfast", "lunch", "dinner"];

const STATE_RANK: Record<AvatarState, number> = {
  pebble: 0,
  fizzy: 1,
  flicker: 2,
  glow: 3,
  sunbeam: 4,
};

const DIFFICULTY_CONFIG = {
  easy: {
    minPicks: 3,
    maxPicks: 5,
    target: "glow" as AvatarState,
    showHints: true,
  },
  medium: {
    minPicks: 3,
    maxPicks: 4,
    target: "sunbeam" as AvatarState,
    showHints: false,
  },
  hard: {
    minPicks: 3,
    maxPicks: 3,
    target: "sunbeam" as AvatarState,
    showHints: false,
  },
};

const ZERO_TOTALS: MeterValues = {
  protein: 0,
  veggie: 0,
  sugar: 0,
  water: 0,
  vitamin: 0,
};

export function MealBuilderGame({
  difficulty,
  onChangeDifficulty,
}: MealBuilderGameProps) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const [mealType, setMealType] = useState<MealCategory>("breakfast");
  const [foodPool, setFoodPool] = useState<NutritionFood[]>([]);
  const [tray, setTray] = useState<NutritionFood[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [won, setWon] = useState(false);
  const [aiReportCard, setAiReportCard] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const initGame = useCallback(() => {
    const mt = MEAL_TYPES[Math.floor(Math.random() * MEAL_TYPES.length)];
    setMealType(mt);
    const filtered = FOOD_DATABASE.filter((f) =>
      f.meal_categories.includes(mt)
    );
    setFoodPool(shuffle(filtered).slice(0, 12).map(toGameFood));
    setTray([]);
    setSubmitted(false);
    setWon(false);
    setAiReportCard(null);
    setLoadingAi(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Calculate totals from tray
  const totals: MeterValues = useMemo(() => {
    const t = { ...ZERO_TOTALS };
    for (const f of tray) {
      t.protein += f.protein_score;
      t.veggie += f.veggie_score;
      t.sugar += f.sugar_score;
      t.water += f.water_score;
      t.vitamin += f.vitamin_score;
    }
    return t;
  }, [tray]);

  const pct = toPercentages(totals);
  const avatarState = calculateAvatarState(totals);
  const theme = MEAL_THEMES[mealType];

  const canAdd = tray.length < cfg.maxPicks;
  const canSubmit = tray.length >= cfg.minPicks;

  const addFood = (food: NutritionFood) => {
    if (!canAdd || submitted) return;
    if (tray.some((f) => f.id === food.id)) return;
    setTray([...tray, food]);
  };

  const removeFood = (food: NutritionFood) => {
    if (submitted) return;
    setTray(tray.filter((f) => f.id !== food.id));
  };

  const handleSubmit = () => {
    const didWin = STATE_RANK[avatarState] >= STATE_RANK[cfg.target];
    setSubmitted(true);
    setWon(didWin);

    // Fetch AI meal report card
    setLoadingAi(true);
    fetch("/api/nutrition/education", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "meal-analysis",
        mealType,
        foods: tray.map((f) => f.name),
        avatarState,
        won: didWin,
      }),
    })
      .then((res) => res.json())
      .then((data) => setAiReportCard(data.analysis))
      .catch(() => {
        setAiReportCard(
          didWin
            ? "Great meal! You built a balanced plate that would keep you feeling energized!"
            : "Nice try! Mixing in more protein and veggies would make this meal more balanced."
        );
      })
      .finally(() => setLoadingAi(false));
  };

  const handleRetry = () => {
    setTray([]);
    setSubmitted(false);
    setWon(false);
    setAiReportCard(null);
    setLoadingAi(false);
  };

  const getStars = () => {
    if (avatarState === "sunbeam" && tray.length < cfg.maxPicks) return 3;
    if (STATE_RANK[avatarState] >= STATE_RANK[cfg.target]) return 2;
    return 1;
  };

  const picksLabel =
    cfg.minPicks === cfg.maxPicks
      ? `Pick exactly ${cfg.minPicks} foods`
      : `Pick ${cfg.minPicks}-${cfg.maxPicks} foods`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      {/* Meal header */}
      <div
        className={`w-full bg-gradient-to-r ${theme?.bg || "from-slate-100 to-slate-200"} rounded-2xl p-4 text-center`}
      >
        <span className="text-4xl">{theme?.emoji}</span>
        <h3
          className="text-xl font-bold text-slate-800 mt-1"
          style={{
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
          }}
        >
          {theme?.label}
        </h3>
        <p className="text-sm text-slate-600">
          {picksLabel} to build a balanced meal
        </p>
      </div>

      {/* Avatar + Meters */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <NutritionAvatar
          kidName="riley"
          state={avatarState}
          totals={totals}
          size="md"
        />
        <div className="flex-1">
          <NutritionMeters percentages={pct} variant="full" />
        </div>
      </div>

      {/* Tray */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-600">
            Your Tray ({tray.length}/{cfg.maxPicks})
          </span>
          {canSubmit && !submitted && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] min-h-[44px] text-sm"
            >
              Submit Meal!
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap min-h-[88px] bg-slate-50 rounded-xl p-2 border-2 border-dashed border-slate-200">
          {tray.length === 0 && (
            <p className="text-slate-400 text-sm m-auto">
              Tap foods below to add them!
            </p>
          )}
          {tray.map((f) => (
            <button
              key={f.id}
              onClick={() => removeFood(f)}
              className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 hover:shadow-md transition-all min-w-[72px]"
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-[10px] text-slate-600 line-clamp-1">
                {f.name}
              </span>
              <span className="text-[10px] text-red-400">{"\u2715"} remove</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hint bar — Easy mode, 2+ foods on tray */}
      {cfg.showHints && !submitted && tray.length >= 2 && (() => {
        const lowMeters = (['protein', 'veggie', 'water', 'vitamin'] as const).filter(
          (k) => pct[k] < 30
        );
        if (lowMeters.length === 0) return null;
        const lowestKey = lowMeters.reduce((a, b) => (pct[a] < pct[b] ? a : b));
        const meterInfo = METER_CONFIG[lowestKey];
        return (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-800">
              {"\u{1F4A1}"} <span className="font-semibold">Tip:</span> Your {meterInfo.label.toLowerCase()} meter is low — look for foods with the {meterInfo.emoji} icon!
            </p>
          </div>
        );
      })()}

      {/* Food pool */}
      {!submitted && (
        <div className="w-full">
          <span className="text-sm font-semibold text-slate-600 mb-2 block">
            Available Foods
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {foodPool.map((f) => {
              const inTray = tray.some((t) => t.id === f.id);
              return (
                <FoodCard
                  key={f.id}
                  food={f}
                  onTap={addFood}
                  highlighted={inTray}
                  highlightColor={inTray ? "#a855f7" : undefined}
                  className={
                    inTray
                      ? "opacity-40 pointer-events-none"
                      : canAdd
                        ? ""
                        : "opacity-40 pointer-events-none"
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Submit result -- loss */}
      {submitted && !won && (
        <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">{"\uD83D\uDE05"}</div>
          <p className="font-bold text-red-600 mb-1">
            Not quite balanced enough!
          </p>
          <p className="text-sm text-slate-600 mb-3">
            Your avatar needs to reach{" "}
            <span className="font-bold capitalize">{cfg.target}</span> state.
          </p>
          {loadingAi ? (
            <p className="text-xs text-slate-400 mb-3 animate-pulse">Getting meal feedback...</p>
          ) : aiReportCard ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-left">
              <p className="text-sm text-amber-800">{"\u{1F4A1}"} {aiReportCard}</p>
            </div>
          ) : null}
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Win screen */}
      {submitted && won && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">{"\uD83C\uDF7D\uFE0F"}</div>
            <h2
              className="text-2xl font-bold text-purple-600 mb-2"
              style={{
                fontFamily:
                  "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              }}
            >
              Balanced Meal!
            </h2>
            <div className="text-4xl mb-4">
              {"\u2B50".repeat(getStars())}
              {"\u2606".repeat(3 - getStars())}
            </div>
            <div className="space-y-1 text-slate-600 mb-4">
              <p>
                Foods used: <span className="font-bold">{tray.length}</span>
              </p>
              <p>
                Avatar state:{" "}
                <span className="font-bold capitalize">{avatarState}</span>
              </p>
            </div>
            {loadingAi ? (
              <p className="text-xs text-slate-400 mb-4 animate-pulse">Grading your meal...</p>
            ) : aiReportCard ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-left">
                <p className="text-sm text-green-800">{"\u{1F31F}"} {aiReportCard}</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-3">
              <button
                onClick={initGame}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
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
      )}
    </div>
  );
}
