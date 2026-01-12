import { NextRequest, NextResponse } from "next/server";
import { getChildren, getChecklistForChild, toggleChecklistItem } from "@/lib/supabase";

export async function GET() {
  try {
    const children = await getChildren();

    // Fetch checklist data for each child
    const childrenWithChecklists = await Promise.all(
      children.map(async (child) => {
        const { items, stats } = await getChecklistForChild(child.id);
        return {
          ...child,
          checklist: items,
          stats,
        };
      })
    );

    return NextResponse.json({ children: childrenWithChecklists });
  } catch (error) {
    console.error("Error fetching checklist data:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { childId, itemId, isCompleted } = await request.json();

    if (!childId || !itemId || typeof isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const success = await toggleChecklistItem(childId, itemId, isCompleted);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update checklist item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling checklist item:", error);
    return NextResponse.json(
      { error: "Failed to toggle checklist item" },
      { status: 500 }
    );
  }
}
