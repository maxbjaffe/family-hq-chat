import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";

// GET - Fetch a single drawing by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getFamilyDataClient();

    const { data: drawing, error } = await supabase
      .from("doodle_drawings")
      .select("*")
      .eq("id", id)
      .eq("user_id", FAMILY_USER_ID)
      .single();

    if (error) {
      console.error("Error fetching drawing:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    return NextResponse.json({ drawing });
  } catch (error) {
    console.error("Unexpected error in GET /api/doodles/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
