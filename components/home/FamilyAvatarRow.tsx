"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Avatar } from "@/components/Avatar";

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

interface FamilyAvatarRowProps {
  members: FamilyMember[];
  allKidsComplete: boolean;
}

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

function MemberAvatar({ member }: { member: FamilyMember }) {
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

export function FamilyAvatarRow({
  members,
  allKidsComplete,
}: FamilyAvatarRowProps) {
  const sorted = [...members].sort(sortMembers);

  return (
    <div>
      {/* Section header */}
      <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2 justify-center">
        {allKidsComplete ? (
          <>
            <Sparkles className="w-5 h-5 text-green-500" />
            <span className="text-green-500">Everyone&apos;s Ready!</span>
          </>
        ) : (
          "Family"
        )}
      </h2>

      {/* Avatar row */}
      <div
        className={`flex items-center justify-center gap-6 md:gap-8 overflow-x-auto ${
          allKidsComplete ? "bg-green-50/50 rounded-2xl py-4 px-2" : ""
        }`}
      >
        {sorted.map((member) => (
          <MemberAvatar key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

export type { FamilyMember, FamilyAvatarRowProps };
