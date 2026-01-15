import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";

// POST - Create a new checklist item
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { child_id, title, icon, weekdays_only } = body;

    if (!child_id || !title) {
      return NextResponse.json(
        { error: "child_id and title are required" },
        { status: 400 }
      );
    }

    // Get the max display_order for this child
    const { data: existing } = await supabase
      .from("checklist_items")
      .select("display_order")
      .eq("child_id", child_id)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing[0] ? existing[0].display_order + 1 : 0;

    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        user_id: FAMILY_USER_ID,
        child_id,
        title,
        icon: icon || null,
        display_order: nextOrder,
        weekdays_only: weekdays_only ?? true,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating checklist item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a checklist item
export async function PUT(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { id, title, icon, weekdays_only, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (icon !== undefined) updates.icon = icon;
    if (weekdays_only !== undefined) updates.weekdays_only = weekdays_only;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from("checklist_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating checklist item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a checklist item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("checklist_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting checklist item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Reorder checklist items
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { items } = body; // Array of { id, display_order }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      );
    }

    // Update each item's display_order
    for (const item of items) {
      const { error } = await supabase
        .from("checklist_items")
        .update({ display_order: item.display_order })
        .eq("id", item.id);

      if (error) {
        console.error("Error reordering item:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
