"use client";

import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import type { FamilyCapabilityProfile } from "@/lib/analysis/capability-calculator";
import { generateGapQuestions, GapQuestion } from "@/lib/analysis/gap-questions";

const STORAGE_KEY = "dismissed-gap-questions";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function SuggestedQuestions() {
  const [questions, setQuestions] = useState<GapQuestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(getDismissed());

    fetch("/api/capability")
      .then((res) => (res.ok ? res.json() : null))
      .then((profile: FamilyCapabilityProfile | null) => {
        if (!profile || !profile.members || profile.members.length === 0) return;
        // Use first member's profile for questions
        const qs = generateGapQuestions(profile.members[0], "max-poppins", 5);
        setQuestions(qs);
      })
      .catch(() => {});
  }, []);

  const visible = questions.filter((q) => !dismissed.has(q.id));
  if (visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Zap className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-xs font-medium text-slate-500">Quick wins to unlock more help</span>
      </div>
      {visible.slice(0, 2).map((q) => (
        <div
          key={q.id}
          className="bg-white border border-slate-200 rounded-xl p-3 group shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{q.gapIcon}</span>
                <span className="text-xs text-slate-500">{q.gap}</span>
                <span className="text-[10px] text-purple-600 font-medium">
                  +{q.impact}%
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-snug">
                {q.question}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-slate-400">{q.effort}</span>
                <span className="text-[11px] text-slate-400">{q.why}</span>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(q.id)}
              className="text-slate-300 hover:text-slate-500 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
