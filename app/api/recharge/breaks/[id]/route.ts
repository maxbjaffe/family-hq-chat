import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = getFamilyDataClient();

    const { data, error } = await supabase
      .from("recharge_breaks")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Recharge API] Error updating break:", error);
      return NextResponse.json(
        { error: "Failed to update recharge break" },
        { status: 500 }
      );
    }

    return NextResponse.json({ break: data });
  } catch (error) {
    console.error("[Recharge API] Error updating break:", error);
    return NextResponse.json(
      { error: "Failed to update recharge break" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = getFamilyDataClient();

    // Check if it's a foundation break
    const { data: breakData, error: fetchError } = await supabase
      .from("recharge_breaks")
      .select("is_foundation")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("[Recharge API] Error fetching break:", fetchError);
      return NextResponse.json(
        { error: "Break not found" },
        { status: 404 }
      );
    }

    if (breakData.is_foundation) {
      return NextResponse.json(
        { error: "Cannot delete foundation breaks" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("recharge_breaks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Recharge API] Error deleting break:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete recharge break" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Recharge API] Error deleting break:", error);
    return NextResponse.json(
      { error: "Failed to delete recharge break" },
      { status: 500 }
    );
  }
}
