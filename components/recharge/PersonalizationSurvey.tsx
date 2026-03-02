"use client";

import { useState } from "react";

interface PersonalizationSurveyProps {
  childId: string;
  childName: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface SurveyQuestion {
  key: string;
  emoji: string;
  question: string;
  type: "text" | "choice";
  placeholder?: string;
  choices?: { value: string; label: string }[];
}

const QUESTIONS: SurveyQuestion[] = [
  {
    key: "hype_song",
    emoji: "\uD83C\uDFB5",
    question: "What's your go-to hype song?",
    type: "text",
    placeholder: "A song that gets you pumped up...",
  },
  {
    key: "calm_strategy",
    emoji: "\uD83D\uDC86",
    question: "When you're upset, what helps you feel better?",
    type: "text",
    placeholder: "Something that calms you down...",
  },
  {
    key: "movement_preference",
    emoji: "\uD83C\uDFC3",
    question: "What's your favorite way to move your body?",
    type: "text",
    placeholder: "Dancing, jumping, stretching...",
  },
  {
    key: "creative_preference",
    emoji: "\uD83C\uDFA8",
    question: "What's your favorite creative thing?",
    type: "text",
    placeholder: "Drawing, building, writing...",
  },
  {
    key: "free_time_choice",
    emoji: "\u23F0",
    question: "If you had 10 free minutes right now, what would you do?",
    type: "text",
    placeholder: "Anything at all...",
  },
  {
    key: "favorite_snack",
    emoji: "\uD83C\uDF6A",
    question: "What's a snack that always makes you smile?",
    type: "text",
    placeholder: "Your go-to happy snack...",
  },
  {
    key: "break_style",
    emoji: "\uD83D\uDC65",
    question: "Do you like doing breaks alone, with a sibling, or with Jaffe?",
    type: "choice",
    choices: [
      { value: "solo", label: "By myself" },
      { value: "sibling", label: "With a sibling" },
      { value: "pet", label: "With Jaffe" },
      { value: "any", label: "Any of those!" },
    ],
  },
  {
    key: "never_suggest",
    emoji: "\uD83D\uDEAB",
    question: "What's something you'd NEVER want as a break suggestion?",
    type: "text",
    placeholder: "Something you really don't like...",
  },
  {
    key: "victory_move",
    emoji: "\uD83C\uDFC6",
    question: "When you're celebrating, what's your victory move?",
    type: "text",
    placeholder: "Fist pump, dance, cartwheel...",
  },
  {
    key: "custom_break_idea",
    emoji: "\uD83D\uDCA1",
    question: "If you could add any break to the menu, what would it be?",
    type: "text",
    placeholder: "Your dream brain break...",
  },
];

const PROGRESS_COLORS = [
  "bg-rose-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-green-400",
  "bg-teal-400",
  "bg-sky-400",
  "bg-blue-400",
  "bg-violet-400",
];

export function PersonalizationSurvey({
  childId,
  childName,
  onComplete,
  onCancel,
}: PersonalizationSurveyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const question = QUESTIONS[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === QUESTIONS.length - 1;
  const currentAnswer = answers[question.key] || "";

  const handleTextChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
  };

  const handleChoiceSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
  };

  const handleNext = () => {
    if (isLast) {
      handleSave();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (isFirst) {
      onCancel();
    } else {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        childId,
        survey_completed: true,
        survey_completed_at: new Date().toISOString(),
      };

      // Map answers to profile fields
      for (const q of QUESTIONS) {
        const val = answers[q.key];
        if (val !== undefined && val !== "") {
          if (q.key === "never_suggest") {
            // Store as array
            payload[q.key] = [val];
          } else {
            payload[q.key] = val;
          }
        }
      }

      const res = await fetch("/api/recharge/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onComplete();
      } else {
        console.error("[PersonalizationSurvey] Save failed:", await res.text());
      }
    } catch (error) {
      console.error("[PersonalizationSurvey] Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 transition-all duration-300 rounded-full ${
              i <= currentIndex ? PROGRESS_COLORS[i] : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-5xl block mb-3">{question.emoji}</span>
          <p className="text-lg font-semibold text-slate-800">
            Hey {childName},{" "}
            <span className="text-slate-600 font-normal">
              {question.question}
            </span>
          </p>
        </div>

        {/* Input area */}
        {question.type === "text" && (
          <textarea
            value={currentAnswer}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full rounded-lg border border-slate-200 p-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none min-h-[80px]"
            rows={3}
          />
        )}

        {question.type === "choice" && question.choices && (
          <div className="grid grid-cols-2 gap-3">
            {question.choices.map((choice) => (
              <button
                key={choice.value}
                onClick={() => handleChoiceSelect(choice.value)}
                className={`rounded-lg border-2 p-3 text-base font-medium transition-all min-h-[48px] ${
                  currentAnswer === choice.value
                    ? "border-purple-400 bg-purple-50 text-purple-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={handleBack}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[48px]"
        >
          {isFirst ? "Cancel" : "Back"}
        </button>
        <button
          onClick={handleNext}
          disabled={saving}
          className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-3 text-sm font-bold text-white shadow-sm hover:from-purple-600 hover:to-violet-600 transition-all disabled:opacity-50 min-h-[48px]"
        >
          {saving ? "Saving..." : isLast ? "Save Answers" : "Next"}
        </button>
      </div>

      {/* Question counter */}
      <p className="text-center text-xs text-slate-400">
        Question {currentIndex + 1} of {QUESTIONS.length}
      </p>
    </div>
  );
}
