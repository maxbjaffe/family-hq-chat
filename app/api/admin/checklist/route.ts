import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";

// GET - Fetch checklist items (optionally filtered by member_id or child_id)
export async function GET(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("member_id");
    const childId = searchParams.get("child_id");

    let query = supabase
      .from("checklist_items")
      .select("id, title, icon, display_order, weekdays_only, reset_daily, is_active, member_id, child_id")
      .order("display_order");

    // Filter by member_id or child_id if provided (prefer member_id)
    if (memberId) {
      query = query.eq("member_id", memberId);
    } else if (childId) {
      query = query.eq("child_id", childId);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("Error fetching checklist items:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new checklist item
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { member_id, child_id, title, icon, weekdays_only, reset_daily } = body;

    // Support both member_id and child_id during transition (prefer member_id)
    const effectiveMemberId = member_id || null;
    const effectiveChildId = child_id || null;

    if (!effectiveMemberId && !effectiveChildId) {
      return NextResponse.json(
        { error: "member_id or child_id is required" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Get the max display_order for this member/child
    let orderQuery = supabase
      .from("checklist_items")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    if (effectiveMemberId) {
      orderQuery = orderQuery.eq("member_id", effectiveMemberId);
    } else if (effectiveChildId) {
      orderQuery = orderQuery.eq("child_id", effectiveChildId);
    }

    const { data: existing } = await orderQuery;

    const nextOrder = existing && existing[0] ? existing[0].display_order + 1 : 0;

    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        member_id: effectiveMemberId,
        child_id: effectiveChildId,
        title,
        icon: icon || null,
        display_order: nextOrder,
        weekdays_only: weekdays_only ?? true,
        is_active: true,
        active_days: body.active_days || '["mon","tue","wed","thu","fri"]',
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
    const { id, title, icon, weekdays_only, reset_daily, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (icon !== undefined) updates.icon = icon;
    if (weekdays_only !== undefined) updates.weekdays_only = weekdays_only;
    if (reset_daily !== undefined) updates.reset_daily = reset_daily;
    if (is_active !== undefined) updates.is_active = is_active;
    if (body.active_days !== undefined) updates.active_days = body.active_days;

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
