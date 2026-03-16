"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Plus,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Trash2,
  X,
  Lightbulb,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NutritionFood {
  id: string;
  name: string;
  emoji: string;
  meal_categories: string[];
  protein_score: number;
  veggie_score: number;
  sugar_score: number;
  water_score: number;
  vitamin_score: number;
}

interface FoodSuggestion {
  name: string;
  meal_categories: string[];
}

interface ScoredResult {
  name: string;
  emoji: string;
  meal_categories: string[];
  protein_score: number;
  veggie_score: number;
  sugar_score: number;
  water_score: number;
  vitamin_score: number;
  reasoning: string;
  id?: string;
}

type SortField =
  | "name"
  | "emoji"
  | "meal_categories"
  | "protein_score"
  | "veggie_score"
  | "sugar_score"
  | "water_score"
  | "vitamin_score";

type SortDir = "asc" | "desc";

const MEAL_OPTIONS = ["breakfast", "lunch", "dinner", "snack", "drink"] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NutritionFoodManager() {
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Add food form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [scoring, setScoring] = useState(false);
  const [lastScored, setLastScored] = useState<ScoredResult[]>([]);

  // Suggestions
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);

  // Bulk delete
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Single delete
  const [deleting, setDeleting] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  async function loadFoods() {
    setLoading(true);
    try {
      const res = await fetch("/api/nutrition/foods");
      if (res.ok) {
        const data = await res.json();
        setFoods(data.foods || []);
      } else {
        toast.error("Failed to load foods");
      }
    } catch (error) {
      console.error("[NutritionFoodManager] Error loading foods:", error);
      toast.error("Failed to load foods");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  // -----------------------------------------------------------------------
  // CSV Download (read-only reference)
  // -----------------------------------------------------------------------

  async function handleDownload() {
    try {
      const res = await fetch("/api/admin/nutrition");
      if (!res.ok) {
        toast.error("Failed to download CSV");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nutrition-foods.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (error) {
      console.error("[NutritionFoodManager] Download error:", error);
      toast.error("Download failed");
    }
  }

  // -----------------------------------------------------------------------
  // Add single food with AI auto-scoring
  // -----------------------------------------------------------------------

  async function handleAddFood() {
    const name = newFoodName.trim();
    if (!name) {
      toast.error("Enter a food name");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Select at least one meal category");
      return;
    }

    const existing = foods.find(
      (f) => f.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      toast.error(`"${name}" already exists in the database`);
      return;
    }

    setScoring(true);
    setLastScored([]);

    try {
      const res = await fetch("/api/admin/nutrition/auto-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foods: [{ name, meal_categories: selectedCategories }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error(err.error || "Auto-scoring failed");
        return;
      }

      const result = await res.json();
      const scored = result.scored as ScoredResult[] | undefined;

      if (scored?.[0]?.id) {
        setLastScored(scored);
        setNewFoodName("");
        setSelectedCategories([]);
        toast.success(`Added "${scored[0].name}" with AI-generated scores`);
        await loadFoods();
      } else {
        toast.error("Failed to insert food");
        if (scored) setLastScored(scored);
      }
    } catch (error) {
      console.error("[NutritionFoodManager] Auto-score error:", error);
      toast.error("Auto-scoring failed");
    } finally {
      setScoring(false);
    }
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  // -----------------------------------------------------------------------
  // Suggestions
  // -----------------------------------------------------------------------

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    try {
      const res = await fetch("/api/admin/nutrition/suggest");
      if (!res.ok) {
        toast.error("Failed to load suggestions");
        return;
      }
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("[NutritionFoodManager] Suggestion error:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function toggleSuggestion(index: number) {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function selectAllSuggestions() {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
    }
  }

  async function handleBulkAdd() {
    if (selectedSuggestions.size === 0) {
      toast.error("Select at least one food to add");
      return;
    }

    const toAdd = Array.from(selectedSuggestions).map((i) => suggestions[i]);
    setBulkAdding(true);
    setLastScored([]);

    try {
      const res = await fetch("/api/admin/nutrition/auto-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foods: toAdd }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error(err.error || "Bulk add failed");
        return;
      }

      const result = await res.json();
      const scored = result.scored as ScoredResult[] | undefined;

      if (scored) {
        setLastScored(scored);
        const inserted = scored.filter((s) => s.id).length;
        toast.success(`Added ${inserted} food${inserted !== 1 ? "s" : ""} with AI-generated scores`);

        // Remove added suggestions from list
        const addedNames = new Set(scored.filter((s) => s.id).map((s) => s.name.toLowerCase()));
        setSuggestions((prev) => prev.filter((s) => !addedNames.has(s.name.toLowerCase())));
        setSelectedSuggestions(new Set());

        await loadFoods();
      }
    } catch (error) {
      console.error("[NutritionFoodManager] Bulk add error:", error);
      toast.error("Bulk add failed");
    } finally {
      setBulkAdding(false);
    }
  }

  // -----------------------------------------------------------------------
  // Delete (single + bulk)
  // -----------------------------------------------------------------------

  async function handleDelete(food: NutritionFood) {
    if (!confirm(`Delete "${food.name}"? This cannot be undone.`)) return;

    setDeleting(food.id);
    try {
      const res = await fetch(`/api/admin/nutrition?id=${food.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Deleted "${food.name}"`);
        setFoods((prev) => prev.filter((f) => f.id !== food.id));
        setSelectedForDelete((prev) => {
          const next = new Set(prev);
          next.delete(food.id);
          return next;
        });
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  function toggleDeleteSelect(id: string) {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllForDelete() {
    if (selectedForDelete.size === sortedFoods.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(sortedFoods.map((f) => f.id)));
    }
  }

  async function handleBulkDelete() {
    if (selectedForDelete.size === 0) return;

    const count = selectedForDelete.size;
    if (!confirm(`Delete ${count} food${count !== 1 ? "s" : ""}? This cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/nutrition", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedForDelete) }),
      });

      if (res.ok) {
        toast.success(`Deleted ${count} food${count !== 1 ? "s" : ""}`);
        setFoods((prev) => prev.filter((f) => !selectedForDelete.has(f.id)));
        setSelectedForDelete(new Set());
      } else {
        toast.error("Bulk delete failed");
      }
    } catch {
      toast.error("Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  }

  // -----------------------------------------------------------------------
  // Sorting
  // -----------------------------------------------------------------------

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortedFoods = useMemo(() => {
    const copy = [...foods];
    copy.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortField === "meal_categories") {
        aVal = (a.meal_categories || []).join("|");
        bVal = (b.meal_categories || []).join("|");
      } else if (sortField === "name" || sortField === "emoji") {
        aVal = (a[sortField] || "").toLowerCase();
        bVal = (b[sortField] || "").toLowerCase();
      } else {
        aVal = a[sortField] ?? 0;
        bVal = b[sortField] ?? 0;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [foods, sortField, sortDir]);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-0.5" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-0.5" />
    );
  }

  function scoreColor(score: number, isSugar: boolean = false) {
    if (isSugar) {
      if (score === 0) return "bg-green-100 text-green-800";
      if (score === 1) return "bg-yellow-100 text-yellow-800";
      if (score === 2) return "bg-orange-100 text-orange-800";
      return "bg-red-100 text-red-800";
    }
    if (score === 0) return "bg-slate-100 text-slate-500";
    if (score === 1) return "bg-blue-50 text-blue-700";
    if (score === 2) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  }

  function catLabel(cat: string) {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-medium text-lg">Nutrition Food Database</h3>
            <p className="text-sm text-slate-500">
              {foods.length} foods &mdash; Scores auto-generated via USDA guidelines
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSuggestions}
              disabled={loadingSuggestions}
            >
              {loadingSuggestions ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4 mr-2" />
              )}
              Suggest Foods
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (showAddForm) setLastScored([]);
              }}
              variant={showAddForm ? "secondary" : "default"}
            >
              {showAddForm ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {showAddForm ? "Cancel" : "Add Food"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Suggestions panel */}
      {suggestions.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-700">
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium text-sm">
                Suggested Foods &mdash; Common kid foods not yet in your database
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllSuggestions}
                className="text-xs text-amber-700 hover:text-amber-900 underline"
              >
                {selectedSuggestions.size === suggestions.length ? "Deselect all" : "Select all"}
              </button>
              <button
                onClick={() => {
                  setSuggestions([]);
                  setSelectedSuggestions(new Set());
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => toggleSuggestion(i)}
                disabled={bulkAdding}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  selectedSuggestions.has(i)
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-slate-700 border-slate-200 hover:border-amber-400"
                }`}
              >
                {selectedSuggestions.has(i) ? (
                  <CheckSquare className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                ) : (
                  <Square className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                )}
                {s.name}
                <span className="ml-1.5 text-xs opacity-70">
                  ({s.meal_categories.map(catLabel).join(", ")})
                </span>
              </button>
            ))}
          </div>

          {selectedSuggestions.size > 0 && (
            <Button
              onClick={handleBulkAdd}
              disabled={bulkAdding}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {bulkAdding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scoring {selectedSuggestions.size} food{selectedSuggestions.size !== 1 ? "s" : ""} with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Add {selectedSuggestions.size} Selected Food{selectedSuggestions.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}

          {/* Show bulk add results */}
          {lastScored.length > 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-amber-800">
                Added {lastScored.filter((s) => s.id).length} foods:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lastScored.filter((s) => s.id).map((s, i) => (
                  <div key={i} className="p-2 bg-white rounded-lg border border-amber-100 flex items-center gap-2 text-sm">
                    <span className="text-lg">{s.emoji}</span>
                    <span className="font-medium">{s.name}</span>
                    <div className="flex gap-1 ml-auto">
                      <span className={`text-[10px] px-1 rounded ${scoreColor(s.protein_score)}`}>P:{s.protein_score}</span>
                      <span className={`text-[10px] px-1 rounded ${scoreColor(s.veggie_score)}`}>V:{s.veggie_score}</span>
                      <span className={`text-[10px] px-1 rounded ${scoreColor(s.sugar_score, true)}`}>S:{s.sugar_score}</span>
                      <span className={`text-[10px] px-1 rounded ${scoreColor(s.water_score)}`}>W:{s.water_score}</span>
                      <span className={`text-[10px] px-1 rounded ${scoreColor(s.vitamin_score)}`}>Vi:{s.vitamin_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add food form */}
      {showAddForm && (
        <Card className="p-4 border-purple-200 bg-purple-50/30">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium text-sm">
                AI Auto-Scoring &mdash; Scores generated from USDA FoodData Central (ages 4-13)
              </span>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Food Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Parmesan"
                  value={newFoodName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFoodName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter" && !scoring) handleAddFood();
                  }}
                  disabled={scoring}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Meal Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {MEAL_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    disabled={scoring}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategories.includes(cat)
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {catLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAddFood}
              disabled={scoring || !newFoodName.trim() || selectedCategories.length === 0}
              className="w-full sm:w-auto"
            >
              {scoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scoring with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Score &amp; Add Food
                </>
              )}
            </Button>
          </div>

          {/* Show single add result */}
          {lastScored.length === 1 && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{lastScored[0].emoji}</span>
                <span className="font-medium">{lastScored[0].name}</span>
                {lastScored[0].id && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Added
                  </span>
                )}
              </div>
              <div className="flex gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${scoreColor(lastScored[0].protein_score)}`}>P:{lastScored[0].protein_score}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${scoreColor(lastScored[0].veggie_score)}`}>V:{lastScored[0].veggie_score}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${scoreColor(lastScored[0].sugar_score, true)}`}>S:{lastScored[0].sugar_score}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${scoreColor(lastScored[0].water_score)}`}>W:{lastScored[0].water_score}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${scoreColor(lastScored[0].vitamin_score)}`}>Vi:{lastScored[0].vitamin_score}</span>
              </div>
              {lastScored[0].reasoning && (
                <p className="text-xs text-slate-500 italic">
                  {lastScored[0].reasoning}
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Foods table */}
      <Card className="p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">All Foods ({sortedFoods.length})</h4>
          {selectedForDelete.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete {selectedForDelete.size} Selected
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : sortedFoods.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No foods in the database. Add a food above or use Suggest Foods.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-1 w-8">
                  <button
                    onClick={selectAllForDelete}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title={selectedForDelete.size === sortedFoods.length ? "Deselect all" : "Select all"}
                  >
                    {selectedForDelete.size === sortedFoods.length && sortedFoods.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th
                  className="pb-2 pr-2 cursor-pointer hover:text-slate-800 select-none"
                  onClick={() => handleSort("name")}
                >
                  Name
                  <SortIcon field="name" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  onClick={() => handleSort("emoji")}
                >
                  <SortIcon field="emoji" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none"
                  onClick={() => handleSort("meal_categories")}
                >
                  Categories
                  <SortIcon field="meal_categories" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Protein (0-3, higher = more protein)"
                  onClick={() => handleSort("protein_score")}
                >
                  P<SortIcon field="protein_score" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Veggie/Fiber (0-3, higher = more fiber)"
                  onClick={() => handleSort("veggie_score")}
                >
                  V<SortIcon field="veggie_score" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Sugar (0-3, higher = more sugar = worse)"
                  onClick={() => handleSort("sugar_score")}
                >
                  S<SortIcon field="sugar_score" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Water (0-3, higher = more hydrating)"
                  onClick={() => handleSort("water_score")}
                >
                  W<SortIcon field="water_score" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Vitamins (0-3, higher = more micronutrients)"
                  onClick={() => handleSort("vitamin_score")}
                >
                  Vi<SortIcon field="vitamin_score" />
                </th>
                <th className="pb-2 pl-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sortedFoods.map((food) => (
                <tr
                  key={food.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    selectedForDelete.has(food.id) ? "bg-red-50/50" : ""
                  }`}
                >
                  <td className="py-1.5 pr-1">
                    <button
                      onClick={() => toggleDeleteSelect(food.id)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      {selectedForDelete.has(food.id) ? (
                        <CheckSquare className="h-4 w-4 text-red-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-1.5 pr-2 font-medium">{food.name}</td>
                  <td className="py-1.5 px-2 text-center text-lg">{food.emoji}</td>
                  <td className="py-1.5 px-2 text-slate-500 text-xs">
                    {(food.meal_categories || []).join(", ")}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`inline-block w-6 text-center rounded text-xs font-medium ${scoreColor(food.protein_score)}`}>
                      {food.protein_score}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`inline-block w-6 text-center rounded text-xs font-medium ${scoreColor(food.veggie_score)}`}>
                      {food.veggie_score}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`inline-block w-6 text-center rounded text-xs font-medium ${scoreColor(food.sugar_score, true)}`}>
                      {food.sugar_score}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`inline-block w-6 text-center rounded text-xs font-medium ${scoreColor(food.water_score)}`}>
                      {food.water_score}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`inline-block w-6 text-center rounded text-xs font-medium ${scoreColor(food.vitamin_score)}`}>
                      {food.vitamin_score}
                    </span>
                  </td>
                  <td className="py-1.5 pl-2 text-center">
                    <button
                      onClick={() => handleDelete(food)}
                      disabled={deleting === food.id}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Delete food"
                    >
                      {deleting === food.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Scoring methodology reference */}
      <Card className="p-4 bg-slate-50">
        <h4 className="font-medium text-sm text-slate-600 mb-2">
          Scoring Methodology (USDA FoodData Central, ages 4-13)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-500">
          <div>
            <span className="font-medium text-blue-700">Protein (P):</span> 0=&lt;2g, 1=2-7g, 2=8-15g, 3=16g+
          </div>
          <div>
            <span className="font-medium text-green-700">Veggie/Fiber (V):</span> 0=&lt;1g, 1=1-2g, 2=2-4g, 3=4g+
          </div>
          <div>
            <span className="font-medium text-orange-700">Sugar (S):</span> 0=&lt;2g, 1=2-6g, 2=7-15g, 3=16g+
            <span className="ml-1 text-red-500">(higher = worse)</span>
          </div>
          <div>
            <span className="font-medium text-cyan-700">Water (W):</span> 0=negligible, 1=some, 2=high, 3=hydrating
          </div>
          <div>
            <span className="font-medium text-yellow-700">Vitamins (Vi):</span> 0=minimal, 1=1-2, 2=variety, 3=dense
          </div>
        </div>
      </Card>
    </div>
  );
}
