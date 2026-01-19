"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/Avatar";
import { PinModal } from "@/components/PinModal";
import { CheckCircle2 } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid" | "pet";
  avatar_url: string | null;
  has_checklist?: boolean;
  stats?: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

interface UserInfo {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid";
}

interface FamilyMemberCardProps {
  member: FamilyMember;
  showProgress?: boolean;
}

export function FamilyMemberCard({ member, showProgress = true }: FamilyMemberCardProps) {
  const router = useRouter();
  const [showPinModal, setShowPinModal] = useState(false);

  const handleClick = () => {
    switch (member.role) {
      case "admin":
      case "adult":
        // Adults require PIN
        setShowPinModal(true);
        break;
      case "kid":
        // Kids go to their detail/activity view
        router.push(`/family/${encodeURIComponent(member.name.toLowerCase())}`);
        break;
      case "pet":
        // Pets go to profile
        router.push(`/family/${encodeURIComponent(member.name.toLowerCase())}`);
        break;
    }
  };

  const handlePinSuccess = (user: UserInfo) => {
    setShowPinModal(false);
    router.push(`/parents?user=${encodeURIComponent(user.name)}`);
  };

  const percentage =
    member.stats && member.stats.total > 0
      ? Math.round((member.stats.completed / member.stats.total) * 100)
      : 0;

  const isComplete = member.stats?.isComplete ?? false;
  const showChecklistProgress = showProgress && member.role === "kid" && member.has_checklist && member.stats;

  return (
    <>
      <Card
        onClick={handleClick}
        className={`p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
          isComplete
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 ring-2 ring-green-200"
            : "hover:bg-slate-50"
        }`}
      >
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <Avatar
            member={{
              name: member.name,
              role: member.role,
              avatar_url: member.avatar_url,
            }}
            size="xl"
            className="shadow-xl border-4 border-white"
          />

          {/* Name */}
          <h3
            className="mt-4 text-2xl font-bold text-slate-800 tracking-tight"
          >
            {member.name}
          </h3>

          {/* Role badge for adults */}
          {(member.role === "admin" || member.role === "adult") && (
            <span className="mt-1 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
              Tap for dashboard
            </span>
          )}

          {/* Pet badge */}
          {member.role === "pet" && (
            <span className="mt-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              Good boy!
            </span>
          )}

          {/* Checklist Progress for kids */}
          {showChecklistProgress && member.stats && (
            <>
              <div className="w-full mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-bold text-slate-700">
                    {member.stats.completed}/{member.stats.total}
                  </span>
                </div>
                <Progress value={percentage} className="h-3" />
              </div>

              {isComplete && (
                <div className="flex items-center gap-2 mt-3 text-green-600 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  All done!
                </div>
              )}

              {!isComplete && (
                <p className="text-sm text-slate-400 mt-3">Tap to view details</p>
              )}
            </>
          )}

          {/* View profile hint for kids without checklist */}
          {member.role === "kid" && !showChecklistProgress && (
            <p className="text-sm text-slate-400 mt-3">Tap to view profile</p>
          )}
        </div>
      </Card>

      {/* PIN Modal for adults */}
      <PinModal
        isOpen={showPinModal}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
        title={`${member.name}'s Access`}
      />
    </>
  );
}
