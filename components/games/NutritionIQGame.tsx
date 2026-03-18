"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw, Brain, ChevronRight } from "lucide-react";
import type {
  EducationQuestion,
  EducationDifficulty,
} from "@/lib/nutrition/education-types";

interface NutritionIQGameProps {
  difficulty: EducationDifficulty;
  onChangeDifficulty: () => void;
}

const DIFFICULTY_CONFIG = {
  easy: { questionCount: 8, wrongPenalty: 0, label: "Easy" },
  medium: { questionCount: 10, wrongPenalty: 0, label: "Medium" },
  hard: { questionCount: 10, wrongPenalty: 3, label: "Hard" },
};

const LOADING_MESSAGES = [
  "Cooking up brain food...",
  "Mixing up some questions...",
  "Checking the nutrition facts...",
  "Peeling back the science...",
];

const HISTORY_KEY = "nutritioniq-history";
const MAX_HISTORY = 50;

function getRecentPrompts(): string[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePrompts(prompts: string[]) {
  try {
    const existing = getRecentPrompts();
    const combined = [...prompts, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(combined));
  } catch {
    // localStorage not available
  }
}

export function NutritionIQGame({
  difficulty,
  onChangeDifficulty,
}: NutritionIQGameProps) {
  const [questions, setQuestions] = useState<EducationQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showingExplanation, setShowingExplanation] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMsg] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
  );

  const cfg = DIFFICULTY_CONFIG[difficulty];

  const initGame = useCallback(async () => {
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowingExplanation(false);
    setIsComplete(false);
    setCorrectCount(0);
    setIsLoading(true);

    const recentPrompts = getRecentPrompts();

    try {
      const res = await fetch("/api/nutrition/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quiz",
          difficulty,
          count: cfg.questionCount,
          recentPrompts: recentPrompts.slice(0, 30),
        }),
      });
      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
        // Save new prompts to history
        savePrompts(data.questions.map((q: EducationQuestion) => q.prompt));
      }
    } catch (error) {
      console.error("[NutritionIQ] Failed to fetch questions:", error);
    }

    setIsLoading(false);
  }, [difficulty, cfg.questionCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const question = questions[current];

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

    setShowingExplanation(true);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setIsComplete(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowingExplanation(false);
    }
  };

  const getStars = () => {
    const pct = correctCount / questions.length;
    if (pct >= 0.9) return 3;
    if (pct >= 0.7) return 2;
    return 1;
  };

  const getLearnedFacts = () => {
    return questions
      .filter((_, i) => i < current + 1)
      .map((q) => q.explanation)
      .slice(0, 3);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 max-w-lg mx-auto min-h-[300px]">
        <div className="text-6xl animate-pulse">{"\u{1F9E0}"}</div>
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
          <div className="h-full bg-gradient-to-r from-teal-400 to-green-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // No questions loaded
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 max-w-lg mx-auto">
        <div className="text-4xl">{"\u{1F615}"}</div>
        <p className="text-slate-600">
          Couldn&apos;t load questions. Please try again!
        </p>
        <button
          onClick={initGame}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold hover:opacity-90 min-h-[48px]"
        >
          <RotateCcw className="w-5 h-5" /> Retry
        </button>
      </div>
    );
  }

  // Complete screen
  if (isComplete) {
    const stars = getStars();
    const facts = getLearnedFacts();

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl max-h-[90vh] overflow-auto">
          <div className="text-6xl mb-3">
            <Brain className="w-16 h-16 mx-auto text-teal-500" />
          </div>
          <h2
            className="text-2xl font-bold text-teal-600 mb-2"
            style={{
              fontFamily:
                "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
            }}
          >
            {stars === 3
              ? "Nutrition Genius!"
              : stars === 2
                ? "Great Job!"
                : "Nice Try!"}
          </h2>
          <div className="text-4xl mb-3">
            {"\u2B50".repeat(stars)}
            {"\u2606".repeat(3 - stars)}
          </div>
          <div className="space-y-1 text-slate-600 mb-4">
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

          {/* What You Learned */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-left">
            <h3
              className="text-sm font-bold text-teal-700 mb-2"
              style={{
                fontFamily:
                  "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
              }}
            >
              {"\u{1F4A1}"} What You Learned:
            </h3>
            <ul className="space-y-2">
              {facts.map((fact, i) => (
                <li key={i} className="text-xs text-slate-600 leading-relaxed">
                  {"\u2022"} {fact}
                </li>
              ))}
            </ul>
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
    );
  }

  // Active question
  if (!question) return null;
  const isCorrect = selected !== null && selected === question.correctIndex;

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
        {question.emoji && (
          <div className="text-5xl mb-3">{question.emoji}</div>
        )}

        <h3
          className="text-lg font-bold text-slate-800 mb-6 leading-snug"
          style={{
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive",
          }}
        >
          {question.prompt}
        </h3>

        <div className="grid gap-3">
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
                <span className="text-base">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation — always shown after answering */}
        {showingExplanation && (
          <div
            className={`mt-4 p-4 rounded-xl border text-sm text-left leading-relaxed ${
              isCorrect
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <span className="font-bold">
              {isCorrect ? "\u2705 Correct! " : "\u274C Not quite! "}
            </span>
            {question.explanation}
          </div>
        )}

        {/* Next button — appears after answering */}
        {showingExplanation && (
          <button
            onClick={handleNext}
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] min-h-[48px] transition-all"
          >
            {current + 1 >= questions.length ? "See Results" : "Next Question"}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Difficulty badge */}
      <div className="text-xs text-slate-400">
        Difficulty:{" "}
        <span className="font-semibold capitalize">{difficulty}</span>
        {cfg.wrongPenalty > 0 && (
          <span className="ml-2 text-red-400">
            (-{cfg.wrongPenalty} for wrong answers)
          </span>
        )}
      </div>
    </div>
  );
}
