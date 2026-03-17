"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { FOOD_DATABASE, type FoodSeedItem } from "@/lib/nutrition/food-data";
import { METER_CONFIG } from "@/lib/nutrition/constants";
import type { NutrientKey } from "@/lib/nutrition/types";

type Difficulty = "easy" | "medium" | "hard";

interface FoodDetectiveGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: () => void;
}

const QUIZ_NUTRIENTS: NutrientKey[] = ["protein", "veggie", "water", "vitamin"];

type QuestionType = "A" | "B" | "C";

interface Question {
  type: QuestionType;
  prompt: string;
  displayEmoji?: string;
  options: { label: string; emoji: string }[];
  correctIndex: number;
  explanation: string;
}

const DIFFICULTY_CONFIG = {
  easy: {
    types: ["A"] as QuestionType[],
    choiceCount: 2,
    questionCount: 8,
    wrongPenalty: 0,
    showExplanation: "always" as const,
  },
  medium: {
    types: ["A", "B"] as QuestionType[],
    choiceCount: 3,
    questionCount: 10,
    wrongPenalty: 0,
    showExplanation: "wrong" as const,
  },
  hard: {
    types: ["A", "B", "C"] as QuestionType[],
    choiceCount: 4,
    questionCount: 10,
    wrongPenalty: 3,
    showExplanation: "wrong" as const,
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getScore(food: FoodSeedItem, key: NutrientKey): number {
  const map: Record<NutrientKey, number> = {
    protein: food.protein_score,
    veggie: food.veggie_score,
    sugar: food.sugar_score,
    water: food.water_score,
    vitamin: food.vitamin_score,
  };
  return map[key];
}

function getTopNutrient(food: FoodSeedItem): NutrientKey {
  let best: NutrientKey = "protein";
  let bestVal = 0;
  for (const k of QUIZ_NUTRIENTS) {
    const v = getScore(food, k);
    if (v > bestVal) {
      best = k;
      bestVal = v;
    }
  }
  return best;
}

function generateQuestions(difficulty: Difficulty): Question[] {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const questions: Question[] = [];
  const pool = shuffle(FOOD_DATABASE);
  let idx = 0;

  // Filter foods with at least one non-zero nutrient for meaningful questions
  const goodFoods = pool.filter((f) =>
    QUIZ_NUTRIENTS.some((k) => getScore(f, k) > 0)
  );

  for (let i = 0; i < cfg.questionCount; i++) {
    const type = cfg.types[i % cfg.types.length];

    if (type === "A") {
      const food = goodFoods[idx++ % goodFoods.length];
      const top = getTopNutrient(food);
      let opts = shuffle(QUIZ_NUTRIENTS.filter((n) => n !== top)).slice(
        0,
        cfg.choiceCount - 1
      );
      opts.push(top);
      opts = shuffle(opts);
      const ci = opts.indexOf(top);

      questions.push({
        type: "A",
        prompt: `What does ${food.name} give your body?`,
        displayEmoji: food.emoji,
        options: opts.map((n) => ({
          label: METER_CONFIG[n].label,
          emoji: METER_CONFIG[n].emoji,
        })),
        correctIndex: ci,
        explanation: `${food.emoji} ${food.name} is a great source of ${METER_CONFIG[top].label.toLowerCase()}! ${METER_CONFIG[top].emoji}`,
      });
    } else if (type === "B") {
      const nutrient =
        QUIZ_NUTRIENTS[Math.floor(Math.random() * QUIZ_NUTRIENTS.length)];
      const subPool = shuffle(goodFoods).slice(0, 20);
      subPool.sort(
        (a, b) => getScore(b, nutrient) - getScore(a, nutrient)
      );

      const correct = subPool[0];
      const wrongs = subPool
        .filter(
          (f) =>
            f !== correct &&
            getScore(f, nutrient) < getScore(correct, nutrient)
        )
        .slice(0, cfg.choiceCount - 1);

      // Pad if needed
      let fi = 1;
      while (wrongs.length < cfg.choiceCount - 1 && fi < subPool.length) {
        if (subPool[fi] !== correct && !wrongs.includes(subPool[fi]))
          wrongs.push(subPool[fi]);
        fi++;
      }

      const allOpts = shuffle([correct, ...wrongs]);
      const ci = allOpts.indexOf(correct);

      questions.push({
        type: "B",
        prompt: `Which has the MOST ${METER_CONFIG[nutrient].label.toLowerCase()}? ${METER_CONFIG[nutrient].emoji}`,
        options: allOpts.map((f) => ({ label: f.name, emoji: f.emoji })),
        correctIndex: ci,
        explanation: `${correct.emoji} ${correct.name} is loaded with ${METER_CONFIG[nutrient].label.toLowerCase()}! ${METER_CONFIG[nutrient].emoji}`,
      });
    } else {
      // Type C: True/false
      const food = goodFoods[idx++ % goodFoods.length];
      const nutrient =
        QUIZ_NUTRIENTS[Math.floor(Math.random() * QUIZ_NUTRIENTS.length)];
      const score = getScore(food, nutrient);
      const isHigh = score >= 2;
      const sayHigh = Math.random() > 0.5;

      const statement = sayHigh
        ? `${food.name} is high in ${METER_CONFIG[nutrient].label.toLowerCase()}`
        : `${food.name} is low in ${METER_CONFIG[nutrient].label.toLowerCase()}`;

      const statementIsTrue = sayHigh === isHigh;

      questions.push({
        type: "C",
        prompt: statement,
        displayEmoji: food.emoji,
        options: [
          { label: "True", emoji: "\u2705" },
          { label: "False", emoji: "\u274C" },
        ],
        correctIndex: statementIsTrue ? 0 : 1,
        explanation: isHigh
          ? `${food.emoji} ${food.name} IS high in ${METER_CONFIG[nutrient].label.toLowerCase()}! ${METER_CONFIG[nutrient].emoji}`
          : `${food.emoji} ${food.name} is NOT particularly high in ${METER_CONFIG[nutrient].label.toLowerCase()}.`,
      });
    }
  }

  return shuffle(questions);
}

export function FoodDetectiveGame({
  difficulty,
  onChangeDifficulty,
}: FoodDetectiveGameProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showingExplanation, setShowingExplanation] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const cfg = DIFFICULTY_CONFIG[difficulty];

  const initGame = useCallback(() => {
    setQuestions(generateQuestions(difficulty));
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowingExplanation(false);
    setIsComplete(false);
    setCorrectCount(0);
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const question = questions[current];
  if (!question) return null;

  const handleAnswer = (answerIdx: number) => {
    if (selected !== null) return;
    setSelected(answerIdx);

    const correct = answerIdx === question.correctIndex;
    if (correct) {
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
    } else if (cfg.wrongPenalty > 0) {
      setScore((s) => Math.max(0, s - cfg.wrongPenalty));
    }

    const shouldExplain =
      cfg.showExplanation === "always" ||
      (!correct && cfg.showExplanation === "wrong");
    if (shouldExplain) setShowingExplanation(true);

    setTimeout(
      () => {
        if (current + 1 >= questions.length) {
          setIsComplete(true);
        } else {
          setCurrent((c) => c + 1);
          setSelected(null);
          setShowingExplanation(false);
        }
      },
      shouldExplain ? 2000 : 1200
    );
  };

  const getStars = () => {
    const pct = correctCount / questions.length;
    if (pct >= 0.9) return 3;
    if (pct >= 0.7) return 2;
    return 1;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      {/* Progress */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-slate-500 mb-1">
          <span>
            Question {current + 1} / {questions.length}
          </span>
          <span>Score: {score}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all duration-300"
            style={{
              width: `${((current + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="w-full bg-white rounded-2xl p-6 shadow-md text-center">
        {question.displayEmoji && question.type !== "B" && (
          <div className="text-6xl mb-3">{question.displayEmoji}</div>
        )}

        <h3
          className="text-xl font-bold text-slate-800 mb-6"
          style={{
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
          }}
        >
          {question.prompt}
        </h3>

        <div
          className={`grid gap-3 ${question.type === "B" ? "grid-cols-2" : ""}`}
        >
          {question.options.map((opt, i) => {
            let cls =
              "bg-slate-50 border-2 border-slate-200 hover:bg-slate-100";
            if (selected !== null) {
              if (i === question.correctIndex)
                cls =
                  "bg-green-100 border-2 border-green-500 ring-2 ring-green-300";
              else if (i === selected)
                cls = "bg-red-100 border-2 border-red-400";
              else cls = "bg-slate-50 border-2 border-slate-200 opacity-50";
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={`${cls} rounded-xl p-4 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-h-[56px] font-semibold text-slate-800`}
              >
                <span className="text-2xl mr-2">{opt.emoji}</span>
                <span className="text-base">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {showingExplanation && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-slate-700">
            {question.explanation}
          </div>
        )}
      </div>

      {/* Complete overlay */}
      {isComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">{"\uD83D\uDD0D"}</div>
            <h2
              className="text-2xl font-bold text-teal-600 mb-2"
              style={{
                fontFamily:
                  "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              }}
            >
              Great Detective Work!
            </h2>
            <div className="text-4xl mb-4">
              {"\u2B50".repeat(getStars())}
              {"\u2606".repeat(3 - getStars())}
            </div>
            <div className="space-y-1 text-slate-600 mb-6">
              <p>
                Score: <span className="font-bold">{score}</span>
              </p>
              <p>
                Correct:{" "}
                <span className="font-bold">
                  {correctCount} / {questions.length}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={initGame}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
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
