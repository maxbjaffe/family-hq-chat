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

// ---------------------------------------------------------------------------
// GET — Export all foods as CSV download (read-only reference)
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
// DELETE — Remove a single food by id
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const supabase = getFamilyDataClient();

    const { error } = await supabase
      .from("nutrition_foods")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[Admin Nutrition] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[Admin Nutrition] Unexpected error in DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
