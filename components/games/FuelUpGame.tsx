"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { RotateCcw, Lightbulb } from "lucide-react";
import { FOOD_DATABASE, type FoodSeedItem } from "@/lib/nutrition/food-data";
import type {
  NutritionFood,
  MeterValues,
  AvatarState,
} from "@/lib/nutrition/types";
import {
  calculateAvatarState,
  toPercentages,
  getPowerUpSuggestions,
} from "@/lib/nutrition/engine";
import { NutritionAvatar } from "@/components/nutrition/NutritionAvatar";
import { NutritionMeters } from "@/components/nutrition/NutritionMeters";
import { FoodCard } from "@/components/nutrition/FoodCard";

type Difficulty = "easy" | "medium" | "hard";

interface FuelUpGameProps {
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

const STATE_RANK: Record<AvatarState, number> = {
  pebble: 0,
  fizzy: 1,
  flicker: 2,
  glow: 3,
  sunbeam: 4,
};

interface DifficultyConfig {
  states: AvatarState[];
  maxPicks: number;
  timer: number | null;
  target: AvatarState;
  showHint: boolean;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    states: ["pebble"],
    maxPicks: 5,
    timer: null,
    target: "glow",
    showHint: true,
  },
  medium: {
    states: ["pebble", "flicker"],
    maxPicks: 4,
    timer: 60,
    target: "sunbeam",
    showHint: true,
  },
  hard: {
    states: ["pebble", "fizzy"],
    maxPicks: 3,
    timer: 45,
    target: "sunbeam",
    showHint: false,
  },
};

/**
 * Generate meter values that produce the desired degraded avatar state.
 * Uses targeted random generation with state verification.
 */
function generateStartTotals(targetState: AvatarState): MeterValues {
  for (let attempt = 0; attempt < 200; attempt++) {
    let totals: MeterValues;

    if (targetState === "pebble") {
      // Need 2+ normal meters below 25%
      totals = {
        protein: Math.floor(Math.random() * 2),
        veggie: Math.floor(Math.random() * 2),
        sugar: Math.floor(Math.random() * 4),
        water: Math.floor(Math.random() * 2),
        vitamin: 2 + Math.floor(Math.random() * 2),
      };
    } else if (targetState === "flicker") {
      // Exactly 1 normal meter below 25%, rest moderate
      const low = Math.floor(Math.random() * 4);
      totals = {
        protein:
          low === 0
            ? Math.floor(Math.random() * 2)
            : 3 + Math.floor(Math.random() * 2),
        veggie:
          low === 1
            ? Math.floor(Math.random() * 2)
            : 3 + Math.floor(Math.random() * 2),
        sugar: Math.floor(Math.random() * 4),
        water:
          low === 2
            ? Math.floor(Math.random() * 2)
            : 3 + Math.floor(Math.random() * 3),
        vitamin:
          low === 3
            ? Math.floor(Math.random() * 2)
            : 3 + Math.floor(Math.random() * 2),
      };
    } else {
      // fizzy -- high sugar
      totals = {
        protein: 3 + Math.floor(Math.random() * 3),
        veggie: 2 + Math.floor(Math.random() * 3),
        sugar: 7 + Math.floor(Math.random() * 3),
        water: 3 + Math.floor(Math.random() * 3),
        vitamin: 2 + Math.floor(Math.random() * 3),
      };
    }

    if (calculateAvatarState(totals) === targetState) return totals;
  }

  // Hardcoded fallbacks
  const fallbacks: Record<AvatarState, MeterValues> = {
    pebble: { protein: 0, veggie: 0, sugar: 1, water: 0, vitamin: 2 },
    flicker: { protein: 1, veggie: 4, sugar: 2, water: 4, vitamin: 3 },
    fizzy: { protein: 4, veggie: 4, sugar: 8, water: 4, vitamin: 4 },
    glow: { protein: 4, veggie: 4, sugar: 3, water: 4, vitamin: 4 },
    sunbeam: { protein: 7, veggie: 6, sugar: 2, water: 7, vitamin: 6 },
  };
  return fallbacks[targetState];
}

export function FuelUpGame({
  difficulty,
  onChangeDifficulty,
}: FuelUpGameProps) {
  const cfg = DIFFICULTY_CONFIG[difficulty];

  const [currentTotals, setCurrentTotals] = useState<MeterValues>({
    protein: 0,
    veggie: 0,
    sugar: 0,
    water: 0,
    vitamin: 0,
  });
  const [foodPool, setFoodPool] = useState<NutritionFood[]>([]);
  const [picksUsed, setPicksUsed] = useState(0);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(cfg.timer);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const avatarState = calculateAvatarState(currentTotals);
  const pct = toPercentages(currentTotals);

  const initGame = useCallback(() => {
    const startState =
      cfg.states[Math.floor(Math.random() * cfg.states.length)];
    const start = generateStartTotals(startState);
    setCurrentTotals(start);
    setFoodPool(shuffle(FOOD_DATABASE).slice(0, 10).map(toGameFood));
    setPicksUsed(0);
    setPickedIds(new Set());
    setTimeLeft(cfg.timer);
    setIsWon(false);
    setIsLost(false);
    setShowHint(false);
    setGameStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [cfg]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (!gameStarted || cfg.timer === null || isWon || isLost) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsLost(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, cfg.timer, isWon, isLost]);

  const handlePickFood = (food: NutritionFood) => {
    if (isWon || isLost) return;
    if (pickedIds.has(food.id)) return;
    if (picksUsed >= cfg.maxPicks) return;

    if (!gameStarted) setGameStarted(true);

    const newTotals: MeterValues = {
      protein: currentTotals.protein + food.protein_score,
      veggie: currentTotals.veggie + food.veggie_score,
      sugar: currentTotals.sugar + food.sugar_score,
      water: currentTotals.water + food.water_score,
      vitamin: currentTotals.vitamin + food.vitamin_score,
    };

    setCurrentTotals(newTotals);
    setPicksUsed((p) => p + 1);
    setPickedIds((prev) => new Set(prev).add(food.id));
    setShowHint(false);

    const newState = calculateAvatarState(newTotals);

    // Check win
    if (STATE_RANK[newState] >= STATE_RANK[cfg.target]) {
      setIsWon(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (picksUsed + 1 >= cfg.maxPicks) {
      // Out of picks
      setIsLost(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Hints using getPowerUpSuggestions
  const hints = useMemo(() => {
    if (!cfg.showHint) return [];
    const available = foodPool.filter((f) => !pickedIds.has(f.id));
    return getPowerUpSuggestions(currentTotals, available);
  }, [currentTotals, foodPool, pickedIds, cfg.showHint]);

  const getStars = () => {
    const pctUsed = picksUsed / cfg.maxPicks;
    if (pctUsed <= 0.5) return 3;
    if (pctUsed <= 0.75) return 2;
    return 1;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      {/* Stats bar */}
      <div className="w-full flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
        <div className="text-sm">
          <span className="text-slate-500">Picks: </span>
          <span className="font-bold text-orange-600">
            {picksUsed}/{cfg.maxPicks}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-slate-500">Target: </span>
          <span className="font-bold text-purple-600 capitalize">
            {cfg.target}
          </span>
        </div>
        {cfg.timer !== null && (
          <div className="text-sm">
            <span className="text-slate-500">Time: </span>
            <span
              className={`font-bold ${timeLeft !== null && timeLeft <= 10 ? "text-red-600 animate-pulse" : "text-blue-600"}`}
            >
              {timeLeft !== null ? `${timeLeft}s` : "\u2014"}
            </span>
          </div>
        )}
      </div>

      {/* Avatar + Meters */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <NutritionAvatar
            kidName="riley"
            state={avatarState}
            totals={currentTotals}
            size="lg"
          />
          <span className="text-xs font-bold text-slate-500 capitalize">
            {avatarState}
          </span>
        </div>
        <div className="flex-1">
          <NutritionMeters percentages={pct} variant="full" />
        </div>
      </div>

      {/* Hint button */}
      {cfg.showHint && !isWon && !isLost && picksUsed < cfg.maxPicks && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 hover:bg-amber-100 transition-colors min-h-[44px]"
        >
          <Lightbulb className="w-4 h-4" />
          {showHint ? "Hide Hint" : "Show Hint"}
        </button>
      )}

      {showHint && hints.length > 0 && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-800 font-semibold mb-1">
            {"\uD83D\uDCA1"} Try these:
          </p>
          {hints.map((h) => (
            <p key={h.food.id} className="text-sm text-amber-700">
              {h.food.emoji} {h.food.name} — {h.reason}
            </p>
          ))}
        </div>
      )}

      {/* Food pool */}
      {!isWon && !isLost && (
        <div className="w-full">
          <span className="text-sm font-semibold text-slate-600 mb-2 block">
            Pick a food to power up!
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {foodPool.map((f) => {
              const picked = pickedIds.has(f.id);
              const isHinted = showHint && hints.some((h) => h.food.id === f.id);
              return (
                <FoodCard
                  key={f.id}
                  food={f}
                  onTap={handlePickFood}
                  highlighted={isHinted}
                  highlightColor={isHinted ? "#f59e0b" : undefined}
                  className={picked ? "opacity-30 pointer-events-none" : ""}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Loss screen */}
      {isLost && (
        <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">{"\uD83D\uDE14"}</div>
          <p className="font-bold text-red-600 mb-1">
            {timeLeft === 0 ? "Time's up!" : "Out of picks!"}
          </p>
          <p className="text-sm text-slate-600 mb-4">
            Your avatar reached{" "}
            <span className="capitalize font-bold">{avatarState}</span> but
            needed{" "}
            <span className="capitalize font-bold">{cfg.target}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={initGame}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
            >
              <RotateCcw className="w-5 h-5" /> Try Again
            </button>
            <button
              onClick={onChangeDifficulty}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 min-h-[48px]"
            >
              Change Difficulty
            </button>
          </div>
        </div>
      )}

      {/* Win overlay */}
      {isWon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">{"\u26A1"}</div>
            <h2
              className="text-2xl font-bold text-orange-600 mb-2"
              style={{
                fontFamily:
                  "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              }}
            >
              Powered Up!
            </h2>
            <div className="text-4xl mb-4">
              {"\u2B50".repeat(getStars())}
              {"\u2606".repeat(3 - getStars())}
            </div>
            <div className="space-y-1 text-slate-600 mb-6">
              <p>
                Picks used:{" "}
                <span className="font-bold">
                  {picksUsed} / {cfg.maxPicks}
                </span>
              </p>
              <p>
                Avatar state:{" "}
                <span className="font-bold capitalize">{avatarState}</span>
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={initGame}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
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
