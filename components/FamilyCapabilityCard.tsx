"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type {
  FamilyCapabilityProfile,
  PersonCapabilityProfile,
} from "@/lib/analysis/capability-calculator";

export function FamilyCapabilityCard() {
  const [profile, setProfile] = useState<FamilyCapabilityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/capability")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !profile) return null;

  const levelColor = (coverage: number) =>
    coverage >= 70
      ? "text-emerald-600 bg-emerald-50"
      : coverage >= 40
      ? "text-amber-600 bg-amber-50"
      : "text-rose-600 bg-rose-50";

  const barColor = (score: number) =>
    score >= 70
      ? "bg-emerald-500"
      : score >= 40
      ? "bg-amber-500"
      : "bg-rose-400";

  return (
    <Card className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="font-bold text-slate-800">Family Capability</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-violet-600">
              {profile.overallCapability}%
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Quick overview: per-person bars */}
        <div className="space-y-2">
          {profile.members
            .filter((m) => m.areas.length > 0)
            .slice(0, expanded ? undefined : 4)
            .map((member) => (
              <MemberBar key={member.personId} member={member} barColor={barColor} />
            ))}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-violet-200/50 space-y-4">
          {/* Top recommendations */}
          {profile.topRecommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Biggest Opportunities
              </p>
              <div className="space-y-2">
                {profile.topRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-slate-700">
                        {rec.personName}:
                      </span>{" "}
                      <span className="text-slate-600">{rec.action}</span>
                      <span className="text-violet-500 ml-1 text-xs">
                        +{rec.impact}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data quality */}
          {profile.dataQuality.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Data Quality
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.dataQuality.map((dq) => (
                  <span
                    key={dq.area}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${levelColor(dq.coverage)}`}
                  >
                    {dq.area}: {dq.level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function MemberBar({
  member,
  barColor,
}: {
  member: PersonCapabilityProfile;
  barColor: (score: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-16 truncate font-medium">
        {member.personName}
      </span>
      <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(member.overallCapability)}`}
          style={{ width: `${member.overallCapability}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-500 w-10 text-right">
        {member.overallCapability}%
      </span>
    </div>
  );
}
