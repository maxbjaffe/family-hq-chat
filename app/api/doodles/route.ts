import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

// Hardcoded user ID for your family
const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";

// GET - Fetch all drawings
export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    const { data: drawings, error } = await supabase
      .from("doodle_drawings")
      .select("id, title, thumbnail_data, created_at")
      .eq("user_id", FAMILY_USER_ID)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching drawings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ drawings });
  } catch (error) {
    console.error("Unexpected error in GET /api/doodles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save a new drawing
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { title, imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Create a smaller thumbnail (for now, use same data)
    const thumbnailData = imageData;

    const { data, error } = await supabase
      .from("doodle_drawings")
      .insert({
        user_id: FAMILY_USER_ID,
        title: title || `Doodle ${new Date().toLocaleDateString()}`,
        image_data: imageData,
        thumbnail_data: thumbnailData,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving drawing:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ drawing: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/doodles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a drawing
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Drawing ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("doodle_drawings")
      .delete()
      .eq("id", id)
      .eq("user_id", FAMILY_USER_ID);

    if (error) {
      console.error("Error deleting drawing:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/doodles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
