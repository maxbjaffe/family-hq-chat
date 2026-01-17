import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";
import { createHash } from "crypto";

function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

// GET - Fetch all family members with their checklist items
export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    const { data: members, error } = await supabase
      .from("family_members")
      .select("id, name, role, pin_hash, avatar_url, has_checklist, created_at")
      .order("name");

    if (error) {
      console.error("Error fetching family members:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch checklist items for members with has_checklist=true
    const membersWithItems = await Promise.all(
      (members || []).map(async (member) => {
        if (!member.has_checklist) {
          return { ...member, checklist_items: [] };
        }

        const { data: items } = await supabase
          .from("checklist_items")
          .select("id, title, icon, display_order, weekdays_only, is_active")
          .eq("member_id", member.id)
          .order("display_order");

        return { ...member, checklist_items: items || [] };
      })
    );

    return NextResponse.json({ members: membersWithItems });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new family member
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { name, role, pin, avatar_url, has_checklist } = body;

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "adult", "kid", "pet"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be one of: admin, adult, kid, pet" },
        { status: 400 }
      );
    }

    // Validate and hash PIN if provided (pets don't need PINs)
    let pinHash: string | null = null;
    if (pin) {
      if (role === "pet") {
        return NextResponse.json(
          { error: "Pets cannot have a PIN" },
          { status: 400 }
        );
      }
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 }
        );
      }
      pinHash = hashPin(pin);
    }

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        name,
        role,
        pin_hash: pinHash,
        avatar_url: avatar_url || null,
        has_checklist: has_checklist ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating family member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a family member
export async function PUT(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { id, name, role, pin, avatar_url, has_checklist } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (role !== undefined) {
      const validRoles = ["admin", "adult", "kid", "pet"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Role must be one of: admin, adult, kid, pet" },
          { status: 400 }
        );
      }
      updates.role = role;
    }
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (has_checklist !== undefined) updates.has_checklist = has_checklist;

    // Handle PIN update
    if (pin !== undefined) {
      if (pin === null || pin === "") {
        // Clear the PIN
        updates.pin_hash = null;
      } else {
        // Validate and hash new PIN
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          return NextResponse.json(
            { error: "PIN must be exactly 4 digits" },
            { status: 400 }
          );
        }
        updates.pin_hash = hashPin(pin);
      }
    }

    const { data, error } = await supabase
      .from("family_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating family member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a family member and associated data
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // First, get all checklist item IDs for this member
    const { data: checklistItems } = await supabase
      .from("checklist_items")
      .select("id")
      .eq("member_id", id);

    const itemIds = (checklistItems || []).map((item) => item.id);

    // Delete checklist completions for these items
    if (itemIds.length > 0) {
      const { error: completionsError } = await supabase
        .from("checklist_completions")
        .delete()
        .in("item_id", itemIds);

      if (completionsError) {
        console.error("Error deleting checklist completions:", completionsError);
      }
    }

    // Also delete completions by member_id (in case there are any with member_id reference)
    const { error: memberCompletionsError } = await supabase
      .from("checklist_completions")
      .delete()
      .eq("member_id", id);

    if (memberCompletionsError) {
      console.error("Error deleting member completions:", memberCompletionsError);
    }

    // Delete checklist items for this member
    const { error: itemsError } = await supabase
      .from("checklist_items")
      .delete()
      .eq("member_id", id);

    if (itemsError) {
      console.error("Error deleting checklist items:", itemsError);
    }

    // Finally, delete the family member
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting family member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
