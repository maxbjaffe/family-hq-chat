import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// GET — Export all foods as CSV download
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    const { data, error } = await supabase
      .from("nutrition_foods")
      .select("*")
      .order("meal_categories")
      .order("name");

    if (error) {
      console.error("[Admin Nutrition] Error fetching foods:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const foods = data || [];

    // Build CSV
    const header =
      "id,name,emoji,meal_categories,protein_score,veggie_score,sugar_score,water_score,vitamin_score";

    const rows = foods.map((food) => {
      const categories = Array.isArray(food.meal_categories)
        ? food.meal_categories.join("|")
        : String(food.meal_categories || "");

      return [
        food.id,
        escapeCsvField(food.name),
        escapeCsvField(food.emoji || ""),
        escapeCsvField(categories),
        food.protein_score,
        food.veggie_score,
        food.sugar_score,
        food.water_score,
        food.vitamin_score,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n") + "\n";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="nutrition-foods.csv"',
      },
    });
  } catch (error) {
    console.error("[Admin Nutrition] Unexpected error in GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Bulk import/update from CSV
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();

    // Accept CSV as text/csv body or JSON { csv: "..." }
    let csvText: string;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      csvText = body.csv;
      if (!csvText) {
        return NextResponse.json(
          { error: 'Missing "csv" field in JSON body' },
          { status: 400 }
        );
      }
    } else {
      csvText = await request.text();
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty CSV body" },
        { status: 400 }
      );
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in CSV" },
        { status: 400 }
      );
    }

    // Validate expected columns
    const requiredColumns = [
      "name",
      "meal_categories",
      "protein_score",
      "veggie_score",
      "sugar_score",
      "water_score",
      "vitamin_score",
    ];
    const firstRow = rows[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(", ")}` },
        { status: 400 }
      );
    }

    let updated = 0;
    let created = 0;
    let deleted = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for 1-based + header

      try {
        // Check for delete flag
        if (row._delete === "true" || row._delete === "TRUE" || row._delete === "1") {
          if (row.id && row.id !== "new" && row.id.trim().length > 0) {
            const { error: delError } = await supabase
              .from("nutrition_foods")
              .delete()
              .eq("id", row.id);

            if (delError) {
              errors.push(`Row ${rowNum}: delete failed — ${delError.message}`);
            } else {
              deleted++;
            }
          } else {
            errors.push(`Row ${rowNum}: _delete=true but no valid id`);
          }
          continue;
        }

        // Build the food record
        const mealCategories = (row.meal_categories || "")
          .split("|")
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0);

        const foodData = {
          name: row.name?.trim(),
          emoji: row.emoji?.trim() || "",
          meal_categories: mealCategories,
          protein_score: parseInt(row.protein_score) || 0,
          veggie_score: parseInt(row.veggie_score) || 0,
          sugar_score: parseInt(row.sugar_score) || 0,
          water_score: parseInt(row.water_score) || 0,
          vitamin_score: parseInt(row.vitamin_score) || 0,
        };

        if (!foodData.name) {
          errors.push(`Row ${rowNum}: missing name`);
          continue;
        }

        // Clamp scores to 0-3
        const scoreFields = [
          "protein_score",
          "veggie_score",
          "sugar_score",
          "water_score",
          "vitamin_score",
        ] as const;
        for (const field of scoreFields) {
          foodData[field] = Math.max(0, Math.min(3, foodData[field]));
        }

        const hasValidId =
          row.id && row.id !== "new" && row.id.trim().length > 0;

        if (hasValidId) {
          // Update existing
          const { error: updateError } = await supabase
            .from("nutrition_foods")
            .update(foodData)
            .eq("id", row.id);

          if (updateError) {
            errors.push(
              `Row ${rowNum} (${foodData.name}): update failed — ${updateError.message}`
            );
          } else {
            updated++;
          }
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from("nutrition_foods")
            .insert(foodData);

          if (insertError) {
            errors.push(
              `Row ${rowNum} (${foodData.name}): insert failed — ${insertError.message}`
            );
          } else {
            created++;
          }
        }
      } catch (rowError) {
        errors.push(
          `Row ${rowNum}: unexpected error — ${rowError instanceof Error ? rowError.message : String(rowError)}`
        );
      }
    }

    return NextResponse.json({
      updated,
      created,
      deleted,
      errors,
      total: rows.length,
    });
  } catch (error) {
    console.error("[Admin Nutrition] Unexpected error in PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
