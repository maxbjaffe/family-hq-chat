"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, Utensils } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { NutritionAvatar } from "@/components/nutrition/NutritionAvatar";
import { NutritionMeters } from "@/components/nutrition/NutritionMeters";
import { toPercentages } from "@/lib/nutrition/engine";
import { AVATAR_STATE_CONFIG } from "@/lib/nutrition/constants";
import type { AvatarState, MeterValues } from "@/lib/nutrition/types";

interface FamilyMember {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid" | "pet";
  avatar_url: string | null;
  has_checklist: boolean;
  stats?: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

interface NutritionState {
  avatar_state: string;
  protein_total: number;
  veggie_total: number;
  sugar_total: number;
  water_total: number;
  vitamin_total: number;
}

interface FamilyAvatarRowProps {
  members: FamilyMember[];
  allKidsComplete: boolean;
  nutritionStates?: Record<string, NutritionState>;
  defaultMode?: "checklist" | "nutrition";
}

type ViewMode = "checklist" | "nutrition";

const SORT_ORDER = ["Riley", "Parker", "Devin", "Jaffe"];

function sortMembers(a: FamilyMember, b: FamilyMember): number {
  const aIndex = SORT_ORDER.indexOf(a.name);
  const bIndex = SORT_ORDER.indexOf(b.name);

  // Both in sort order: sort by index
  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  // Only a is in sort order: a comes first
  if (aIndex !== -1) return -1;
  // Only b is in sort order: b comes first
  if (bIndex !== -1) return 1;
  // Neither in sort order: alphabetical
  return a.name.localeCompare(b.name);
}

function ProgressRing({
  total,
  completed,
  isComplete,
}: {
  total: number;
  completed: number;
  isComplete: boolean;
}) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference - progress * circumference;

  return (
    <svg
      viewBox="0 0 144 144"
      className="absolute inset-0 w-full h-full"
      style={{ transform: "rotate(-90deg)" }}
    >
      {/* Background ring */}
      <circle
        cx="72"
        cy="72"
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={4}
      />
      {/* Progress ring */}
      <circle
        cx="72"
        cy="72"
        r={radius}
        fill="none"
        stroke={isComplete ? "#10b981" : "#8b5cf6"}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

/* ── Toggle pill ─────────────────────────────────────────────── */

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-full p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => onChange("checklist")}
        className={`p-1.5 rounded-full transition-colors ${
          mode === "checklist"
            ? "bg-white text-purple-600 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        }`}
        title="Checklists"
      >
        <CheckCircle2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("nutrition")}
        className={`p-1.5 rounded-full transition-colors ${
          mode === "nutrition"
            ? "bg-white text-orange-500 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        }`}
        title="Nutrition"
      >
        <Utensils className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Checklist member avatar (original behaviour) ────────────── */

function ChecklistMemberAvatar({ member }: { member: FamilyMember }) {
  const router = useRouter();
  const isPet = member.role === "pet";
  const stats = member.stats;
  const isComplete = stats?.isComplete ?? false;

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => router.push(`/family/${member.name.toLowerCase()}`)}
    >
      {/* Avatar container with progress ring */}
      <div className="relative w-36 h-36">
        {/* SVG progress ring (not for pets) */}
        {!isPet && stats && (
          <ProgressRing
            total={stats.total}
            completed={stats.completed}
            isComplete={isComplete}
          />
        )}

        {/* Avatar centered inside */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar member={member} size="xl" />
        </div>

        {/* Complete badge */}
        {isComplete && (
          <div className="absolute bottom-1 right-1 z-10">
            <div className="bg-white rounded-full p-0.5">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="font-bold text-sm text-slate-700">{member.name}</span>

      {/* Status text */}
      {isPet ? (
        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          Good boy!
        </span>
      ) : stats && isComplete ? (
        <span className="text-xs text-green-600 font-medium">All done!</span>
      ) : stats ? (
        <span className="text-xs text-slate-500">
          {stats.completed}/{stats.total}
        </span>
      ) : null}
    </button>
  );
}

/* ── Nutrition member avatar ─────────────────────────────────── */

function NutritionMemberAvatar({
  member,
  nutritionState,
}: {
  member: FamilyMember;
  nutritionState?: NutritionState;
}) {
  const router = useRouter();
  const isPet = member.role === "pet";

  // Pets render the same as in checklist mode
  if (isPet) {
    return <ChecklistMemberAvatar member={member} />;
  }

  const avatarState = (nutritionState?.avatar_state ?? "pebble") as AvatarState;
  const totals: MeterValues = nutritionState
    ? {
        protein: nutritionState.protein_total,
        veggie: nutritionState.veggie_total,
        sugar: nutritionState.sugar_total,
        water: nutritionState.water_total,
        vitamin: nutritionState.vitamin_total,
      }
    : { protein: 0, veggie: 0, sugar: 0, water: 0, vitamin: 0 };

  const percentages = toPercentages(totals);
  const stateLabel = AVATAR_STATE_CONFIG[avatarState]?.label ?? "Pebble";

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => router.push("/nutrition")}
    >
      {/* Nutrition avatar */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <NutritionAvatar
          kidName={member.name}
          state={avatarState}
          totals={totals}
          size="lg"
        />
      </div>

      {/* Name */}
      <span className="font-bold text-sm text-slate-700">{member.name}</span>

      {/* Mini meters */}
      <NutritionMeters percentages={percentages} variant="mini" />

      {/* State label */}
      <span className="text-xs text-slate-500">{stateLabel}</span>
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export function FamilyAvatarRow({
  members,
  allKidsComplete,
  nutritionStates,
  defaultMode,
}: FamilyAvatarRowProps) {
  const sorted = [...members].sort(sortMembers);
  const hasNutrition = !!nutritionStates;
  const [mode, setMode] = useState<ViewMode>(defaultMode ?? "checklist");

  return (
    <div>
      {/* Section header */}
      <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2 justify-center">
        {mode === "checklist" && allKidsComplete ? (
          <>
            <Sparkles className="w-5 h-5 text-green-500" />
            <span className="text-green-500">Everyone&apos;s Ready!</span>
          </>
        ) : mode === "checklist" ? (
          "Family"
        ) : (
          "Nutrition"
        )}

        {/* Toggle — only shown when nutrition data is available */}
        {hasNutrition && <ModeToggle mode={mode} onChange={setMode} />}
      </h2>

      {/* Avatar row */}
      <div
        className={`flex items-center justify-center gap-6 md:gap-8 overflow-x-auto ${
          mode === "checklist" && allKidsComplete
            ? "bg-green-50/50 rounded-2xl py-4 px-2"
            : ""
        }`}
      >
        {sorted.map((member) =>
          mode === "nutrition" && member.role === "kid" ? (
            <NutritionMemberAvatar
              key={member.id}
              member={member}
              nutritionState={nutritionStates?.[member.id]}
            />
          ) : (
            <ChecklistMemberAvatar key={member.id} member={member} />
          )
        )}
      </div>
    </div>
  );
}

export type { FamilyMember, FamilyAvatarRowProps };
