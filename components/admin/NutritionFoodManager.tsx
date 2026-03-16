"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  RefreshCw,
  ChevronUp,
  ChevronDown,
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

interface ImportResult {
  updated: number;
  created: number;
  deleted: number;
  errors: string[];
  total: number;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NutritionFoodManager() {
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  // CSV Download
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
  // CSV Upload
  // -----------------------------------------------------------------------

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      if (!csvText) {
        toast.error("Failed to read file");
        return;
      }

      setImporting(true);
      setImportResult(null);

      try {
        const res = await fetch("/api/admin/nutrition", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: csvText }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          toast.error(err.error || "Import failed");
          return;
        }

        const result: ImportResult = await res.json();
        setImportResult(result);

        if (result.errors.length === 0) {
          toast.success(
            `Import complete: ${result.updated} updated, ${result.created} created, ${result.deleted} deleted`
          );
        } else {
          toast.warning(
            `Import done with ${result.errors.length} error(s). See details below.`
          );
        }

        // Reload the food list
        await loadFoods();
      } catch (error) {
        console.error("[NutritionFoodManager] Import error:", error);
        toast.error("Import failed");
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
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
  // Sort indicator
  // -----------------------------------------------------------------------

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-0.5" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-0.5" />
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-medium text-lg">Nutrition Food Database</h3>
            <p className="text-sm text-slate-500">
              {foods.length} foods &mdash; Download, edit in a spreadsheet, and re-upload
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {importing ? "Importing..." : "Upload CSV"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Import results */}
      {importResult && (
        <Card className="p-4">
          <h4 className="font-medium mb-2">Import Results</h4>
          <div className="flex gap-4 text-sm mb-2">
            <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
              {importResult.created} created
            </span>
            <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">
              {importResult.updated} updated
            </span>
            <span className="text-red-700 bg-red-50 px-2 py-1 rounded">
              {importResult.deleted} deleted
            </span>
            <span className="text-slate-500">
              {importResult.total} total rows
            </span>
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-700 mb-1">
                Errors ({importResult.errors.length}):
              </p>
              <ul className="text-xs text-red-600 bg-red-50 rounded p-2 max-h-40 overflow-y-auto space-y-1">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Foods table */}
      <Card className="p-4 overflow-x-auto">
        <h4 className="font-medium mb-3">
          All Foods ({sortedFoods.length})
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : sortedFoods.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No foods in the database. Upload a CSV to get started.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
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
                  title="Protein"
                  onClick={() => handleSort("protein_score")}
                >
                  P
                  <SortIcon field="protein_score" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Veggie"
                  onClick={() => handleSort("veggie_score")}
                >
                  V
                  <SortIcon field="veggie_score" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Sugar"
                  onClick={() => handleSort("sugar_score")}
                >
                  S
                  <SortIcon field="sugar_score" />
                </th>
                <th
                  className="pb-2 px-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Water"
                  onClick={() => handleSort("water_score")}
                >
                  W
                  <SortIcon field="water_score" />
                </th>
                <th
                  className="pb-2 pl-2 cursor-pointer hover:text-slate-800 select-none text-center"
                  title="Vitamin"
                  onClick={() => handleSort("vitamin_score")}
                >
                  Vi
                  <SortIcon field="vitamin_score" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFoods.map((food) => (
                <tr
                  key={food.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-1.5 pr-2 font-medium">{food.name}</td>
                  <td className="py-1.5 px-2 text-center text-lg">
                    {food.emoji}
                  </td>
                  <td className="py-1.5 px-2 text-slate-500 text-xs">
                    {(food.meal_categories || []).join(", ")}
                  </td>
                  <td className="py-1.5 px-2 text-center">{food.protein_score}</td>
                  <td className="py-1.5 px-2 text-center">{food.veggie_score}</td>
                  <td className="py-1.5 px-2 text-center">{food.sugar_score}</td>
                  <td className="py-1.5 px-2 text-center">{food.water_score}</td>
                  <td className="py-1.5 pl-2 text-center">{food.vitamin_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
