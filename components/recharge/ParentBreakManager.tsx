"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Eye, EyeOff, Trash2, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import type { RechargeBreak, RechargeProfile } from "@/lib/supabase";
import type { RechargeCategory } from "./constants";
import { CATEGORY_CONFIG, DURATIONS, DURATION_LABELS } from "./constants";
import { PersonalizationSurvey } from "./PersonalizationSurvey";

interface ParentBreakManagerProps {
  childId: string;
  childName: string;
}

type ViewMode = "manager" | "survey";

export function ParentBreakManager({ childId, childName }: ParentBreakManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("manager");
  const [breaks, setBreaks] = useState<RechargeBreak[]>([]);
  const [profile, setProfile] = useState<RechargeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newEmoji, setNewEmoji] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<RechargeCategory>("fun");
  const [newDuration, setNewDuration] = useState<number>(10);
  const [addingBreak, setAddingBreak] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [breaksRes, profileRes] = await Promise.all([
        fetch(`/api/recharge/breaks?childId=${childId}`),
        fetch(`/api/recharge/profiles?childId=${childId}`),
      ]);

      if (breaksRes.ok) {
        const breaksData = await breaksRes.json();
        // We need ALL breaks for management, including hidden ones
        // Fetch directly without profile filtering
        setBreaks(breaksData.breaks || []);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile || null);
      }
    } catch (error) {
      console.error("[ParentBreakManager] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddBreak = async () => {
    if (!newEmoji || !newName) return;
    setAddingBreak(true);

    try {
      const res = await fetch("/api/recharge/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: childId,
          emoji: newEmoji,
          name: newName,
          description: newDescription || null,
          category: newCategory,
          duration: newDuration,
        }),
      });

      if (res.ok) {
        // Reset form
        setNewEmoji("");
        setNewName("");
        setNewDescription("");
        setNewCategory("fun");
        setNewDuration(10);
        setShowAddForm(false);
        await loadData();
      }
    } catch (error) {
      console.error("[ParentBreakManager] Error adding break:", error);
    } finally {
      setAddingBreak(false);
    }
  };

  const handleToggleBreak = async (breakItem: RechargeBreak) => {
    try {
      const res = await fetch(`/api/recharge/breaks/${breakItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !breakItem.is_active }),
      });

      if (res.ok) {
        setBreaks((prev) =>
          prev.map((b) =>
            b.id === breakItem.id ? { ...b, is_active: !b.is_active } : b
          )
        );
      }
    } catch (error) {
      console.error("[ParentBreakManager] Error toggling break:", error);
    }
  };

  const handleDeleteBreak = async (breakId: string) => {
    try {
      const res = await fetch(`/api/recharge/breaks/${breakId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBreaks((prev) => prev.filter((b) => b.id !== breakId));
      } else {
        const data = await res.json();
        console.error("[ParentBreakManager] Delete failed:", data.error);
      }
    } catch (error) {
      console.error("[ParentBreakManager] Error deleting break:", error);
    }
  };

  const handleSurveyComplete = () => {
    setViewMode("manager");
    loadData();
  };

  if (viewMode === "survey") {
    return (
      <PersonalizationSurvey
        childId={childId}
        childName={childName}
        onComplete={handleSurveyComplete}
        onCancel={() => setViewMode("manager")}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  // Group breaks by category
  const breaksByCategory = (Object.keys(CATEGORY_CONFIG) as RechargeCategory[]).reduce(
    (acc, cat) => {
      acc[cat] = breaks.filter((b) => b.category === cat);
      return acc;
    },
    {} as Record<RechargeCategory, RechargeBreak[]>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setViewMode("survey")}
          className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors min-h-[40px]"
        >
          <ClipboardList className="h-4 w-4" />
          {profile?.survey_completed ? "Retake Survey" : "Take Survey"}
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 px-3 py-2 text-sm font-bold text-white shadow-sm hover:from-purple-600 hover:to-violet-600 transition-all min-h-[40px]"
        >
          <Plus className="h-4 w-4" />
          Add Custom Break
        </button>
      </div>

      {/* Survey status */}
      {profile?.survey_completed && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-700 font-medium">
            Survey completed
            {profile.survey_completed_at && (
              <span className="font-normal text-green-600">
                {" "}on{" "}
                {new Date(profile.survey_completed_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h4 className="font-semibold text-slate-700">New Break</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              placeholder="Emoji"
              className="w-16 rounded-lg border border-slate-200 p-2 text-center text-xl focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              maxLength={4}
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Break name"
              className="flex-1 rounded-lg border border-slate-200 p-2 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
            rows={2}
          />

          {/* Category pills */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_CONFIG) as RechargeCategory[]).map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      newCategory === cat
                        ? `${config.pill} ring-2 ring-offset-1 ring-current`
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {config.icon} {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration pills */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Duration</p>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setNewDuration(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    newDuration === d
                      ? "bg-purple-100 text-purple-700 ring-2 ring-offset-1 ring-purple-400"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {DURATION_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBreak}
              disabled={!newEmoji || !newName || addingBreak}
              className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 px-3 py-2 text-sm font-bold text-white shadow-sm hover:from-purple-600 hover:to-violet-600 transition-all disabled:opacity-50"
            >
              {addingBreak ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Breaks list grouped by category */}
      {(Object.keys(CATEGORY_CONFIG) as RechargeCategory[]).map((cat) => {
        const catBreaks = breaksByCategory[cat];
        if (catBreaks.length === 0) return null;

        const config = CATEGORY_CONFIG[cat];

        return (
          <CategoryGroup
            key={cat}
            category={cat}
            label={config.label}
            icon={config.icon}
            pill={config.pill}
            breaks={catBreaks}
            onToggle={handleToggleBreak}
            onDelete={handleDeleteBreak}
          />
        );
      })}
    </div>
  );
}

// Collapsible category group
function CategoryGroup({
  category,
  label,
  icon,
  pill,
  breaks,
  onToggle,
  onDelete,
}: {
  category: string;
  label: string;
  icon: string;
  pill: string;
  breaks: RechargeBreak[];
  onToggle: (b: RechargeBreak) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pill}`}>
          {icon} {label}
        </span>
        <span className="text-xs text-slate-400 ml-auto mr-1">
          {breaks.length} break{breaks.length !== 1 ? "s" : ""}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {breaks.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-b-0 ${
                !b.is_active ? "opacity-50" : ""
              }`}
            >
              <span className="text-lg flex-shrink-0">{b.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {b.name}
                </p>
                <p className="text-xs text-slate-400">
                  {b.duration} min
                  {b.is_foundation && (
                    <span className="ml-1.5 text-purple-400">foundation</span>
                  )}
                  {b.source === "parent_added" && (
                    <span className="ml-1.5 text-green-500">custom</span>
                  )}
                </p>
              </div>

              {/* Toggle visibility */}
              <button
                onClick={() => onToggle(b)}
                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                title={b.is_active ? "Hide break" : "Show break"}
              >
                {b.is_active ? (
                  <Eye className="h-4 w-4 text-slate-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-300" />
                )}
              </button>

              {/* Delete (non-foundation only) */}
              {!b.is_foundation && (
                <button
                  onClick={() => onDelete(b.id)}
                  className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete break"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
