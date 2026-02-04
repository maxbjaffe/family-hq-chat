import { NextRequest, NextResponse } from "next/server";
import { getFamilyMembersWithChecklists, getChecklistForMember, toggleMemberChecklistItem } from "@/lib/supabase";

export async function GET() {
  try {
    const members = await getFamilyMembersWithChecklists();

    // Fetch checklist data for each member
    const membersWithChecklists = await Promise.all(
      members.map(async (member) => {
        const { items, stats } = await getChecklistForMember(member.id);
        return {
          id: member.id,
          name: member.name,
          role: member.role,
          avatar_url: member.avatar_url,
          checklist: items,
          stats,
        };
      })
    );

    return NextResponse.json({ members: membersWithChecklists });
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
    const { memberId, itemId, isCompleted } = await request.json();

    console.log("[Checklist API] Toggle request:", { memberId, itemId, isCompleted });

    if (!memberId || !itemId || typeof isCompleted !== "boolean") {
      console.error("[Checklist API] Missing required fields:", { memberId, itemId, isCompleted });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const success = await toggleMemberChecklistItem(memberId, itemId, isCompleted);

    console.log("[Checklist API] Toggle result:", { success, memberId, itemId });

    if (!success) {
      console.error("[Checklist API] Toggle failed for:", { memberId, itemId, isCompleted });
      return NextResponse.json(
        { error: "Failed to update checklist item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Checklist API] Error toggling checklist item:", error);
    return NextResponse.json(
      { error: "Failed to toggle checklist item" },
      { status: 500 }
    );
  }
}
