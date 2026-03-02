"use client";

import { useState, useEffect, useCallback } from "react";
import type { RechargeBreak } from "@/lib/supabase";
import type { RechargeDuration } from "./constants";
import { AvatarPicker } from "./AvatarPicker";
import { DurationPicker } from "./DurationPicker";
import { BreakGrid } from "./BreakGrid";
import { BreakDetail } from "./BreakDetail";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type Step = "avatar" | "duration" | "grid" | "detail";

interface KidMember {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
}

interface RechargeMenuProps {
  childId?: string;
  childName?: string;
}

export function RechargeMenu({ childId, childName }: RechargeMenuProps) {
  const [step, setStep] = useState<Step>(childId ? "duration" : "avatar");
  const [kids, setKids] = useState<KidMember[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidMember | null>(
    childId && childName
      ? { id: childId, name: childName, role: "kid" }
      : null
  );
  const [breaks, setBreaks] = useState<RechargeBreak[]>([]);
  const [selectedDuration, setSelectedDuration] =
    useState<RechargeDuration | null>(null);
  const [selectedBreak, setSelectedBreak] = useState<RechargeBreak | null>(
    null
  );
  const [loadingKids, setLoadingKids] = useState(!childId);
  const [loadingBreaks, setLoadingBreaks] = useState(false);

  // Load kids list if no childId prop
  useEffect(() => {
    if (childId) return;

    async function fetchKids() {
      try {
        const res = await fetch("/api/checklist");
        if (res.ok) {
          const data = await res.json();
          const kidMembers = (data.members || []).filter(
            (m: KidMember) => m.role === "kid"
          );
          setKids(kidMembers);
        }
      } catch (error) {
        console.error("[RechargeMenu] Error loading kids:", error);
      } finally {
        setLoadingKids(false);
      }
    }

    fetchKids();
  }, [childId]);

  // Load breaks when a kid is selected
  const loadBreaks = useCallback(async (kidId: string) => {
    setLoadingBreaks(true);
    try {
      const res = await fetch(`/api/recharge/breaks?childId=${kidId}`);
      if (res.ok) {
        const data = await res.json();
        setBreaks(data.breaks || []);
      }
    } catch (error) {
      console.error("[RechargeMenu] Error loading breaks:", error);
    } finally {
      setLoadingBreaks(false);
    }
  }, []);

  // Load breaks on mount if childId is provided
  useEffect(() => {
    if (childId) {
      loadBreaks(childId);
    }
  }, [childId, loadBreaks]);

  // Handlers
  const handleSelectKid = (kid: KidMember) => {
    setSelectedKid(kid);
    loadBreaks(kid.id);
    setStep("duration");
  };

  const handleSelectDuration = (d: RechargeDuration) => {
    setSelectedDuration(d);
    setStep("grid");
  };

  const handleSelectBreak = (b: RechargeBreak) => {
    setSelectedBreak(b);
    setStep("detail");
  };

  const handleSurprise = () => {
    if (breaks.length === 0) return;
    const randomBreak = breaks[Math.floor(Math.random() * breaks.length)];
    setSelectedBreak(randomBreak);
    setStep("detail");
  };

  const handleStartBreak = async (b: RechargeBreak) => {
    if (!selectedKid) return;

    try {
      const res = await fetch("/api/recharge/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: selectedKid.id,
          break_id: b.id,
          duration_planned: b.duration * 60,
          context: "manual",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const session = data.session;

        // Dispatch custom event for the timer to pick up
        window.dispatchEvent(
          new CustomEvent("recharge:start", {
            detail: {
              sessionId: session.id,
              childId: selectedKid.id,
              childName: selectedKid.name,
              childAvatar: selectedKid.avatar_url || null,
              breakId: b.id,
              breakName: b.name,
              breakEmoji: b.emoji,
              durationSeconds: b.duration * 60,
            },
          })
        );
      }
    } catch (error) {
      console.error("[RechargeMenu] Error starting session:", error);
    }

    // Reset menu back to beginning
    if (childId) {
      setStep("duration");
    } else {
      setStep("avatar");
      setSelectedKid(null);
    }
    setSelectedDuration(null);
    setSelectedBreak(null);
  };

  const handleBack = () => {
    switch (step) {
      case "duration":
        if (childId) return; // Can't go back if childId is fixed
        setStep("avatar");
        setSelectedKid(null);
        break;
      case "grid":
        setStep("duration");
        setSelectedDuration(null);
        break;
      case "detail":
        if (selectedDuration) {
          setStep("grid");
        } else {
          // Came from surprise — go back to duration
          setStep("duration");
        }
        setSelectedBreak(null);
        break;
    }
  };

  // Render based on step
  if (loadingKids || loadingBreaks) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <LoadingSpinner size="md" />
        <p className="text-slate-500">
          {loadingKids ? "Loading kids..." : "Loading breaks..."}
        </p>
      </div>
    );
  }

  switch (step) {
    case "avatar":
      return <AvatarPicker kids={kids} onSelect={handleSelectKid} />;

    case "duration":
      return (
        <DurationPicker
          breaks={breaks}
          onSelect={handleSelectDuration}
          onSurprise={handleSurprise}
          onBack={handleBack}
          kidName={selectedKid?.name || ""}
        />
      );

    case "grid":
      return (
        <BreakGrid
          breaks={breaks}
          duration={selectedDuration!}
          onSelect={handleSelectBreak}
          onBack={handleBack}
          kidName={selectedKid?.name || ""}
        />
      );

    case "detail":
      return (
        <BreakDetail
          breakItem={selectedBreak!}
          onStart={handleStartBreak}
          onBack={handleBack}
        />
      );
  }
}
