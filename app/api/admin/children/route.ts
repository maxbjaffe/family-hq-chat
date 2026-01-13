import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";

const FAMILY_USER_ID = "00879c1b-a586-4d52-96be-8f4b7ddf7257";

// GET - Fetch all children with their checklist items
export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    const { data: children, error } = await supabase
      .from("children")
      .select("id, name, age, grade")
      .eq("user_id", FAMILY_USER_ID)
      .order("name");

    if (error) {
      console.error("Error fetching children:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch checklist items for each child
    const childrenWithItems = await Promise.all(
      (children || []).map(async (child) => {
        const { data: items } = await supabase
          .from("checklist_items")
          .select("id, title, icon, display_order, weekdays_only, is_active")
          .eq("child_id", child.id)
          .order("display_order");

        return { ...child, checklist_items: items || [] };
      })
    );

    return NextResponse.json({ children: childrenWithItems });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new child
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { name, age, grade } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("children")
      .insert({
        user_id: FAMILY_USER_ID,
        name,
        age: age || null,
        grade: grade || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating child:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ child: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a child
export async function PUT(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { id, name, age, grade } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("children")
      .update({ name, age, grade })
      .eq("id", id)
      .eq("user_id", FAMILY_USER_ID)
      .select()
      .single();

    if (error) {
      console.error("Error updating child:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ child: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
