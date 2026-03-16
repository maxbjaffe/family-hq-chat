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
// DELETE — Remove one or more foods by id
// Supports: ?id=single-id or JSON body { ids: ["id1", "id2", ...] }
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();

    // Check for single id in query param
    const singleId = request.nextUrl.searchParams.get("id");

    if (singleId) {
      const { error } = await supabase
        .from("nutrition_foods")
        .delete()
        .eq("id", singleId);

      if (error) {
        console.error("[Admin Nutrition] Delete error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ deleted: 1 });
    }

    // Bulk delete via JSON body
    const body = await request.json().catch(() => null);
    const ids = body?.ids as string[] | undefined;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Provide ?id=... or JSON body { ids: [...] }" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("nutrition_foods")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("[Admin Nutrition] Bulk delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: ids.length });
  } catch (error) {
    console.error("[Admin Nutrition] Unexpected error in DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
