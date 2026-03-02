import { NextRequest, NextResponse } from "next/server";
import {
  getFamilyDataClient,
  getRechargeBreaks,
  getRechargeProfile,
  RechargeBreak,
} from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "Missing required parameter: childId" },
        { status: 400 }
      );
    }

    // Fetch breaks and profile in parallel
    const [breaks, profile] = await Promise.all([
      getRechargeBreaks(childId),
      getRechargeProfile(childId),
    ]);

    // Filter out hidden breaks if the child has a profile with hidden_breaks
    let filteredBreaks: RechargeBreak[] = breaks;
    if (profile && profile.hidden_breaks && profile.hidden_breaks.length > 0) {
      const hiddenSet = new Set(profile.hidden_breaks);
      filteredBreaks = breaks.filter((b) => !hiddenSet.has(b.id));
    }

    return NextResponse.json({
      breaks: filteredBreaks,
      profile: profile || null,
    });
  } catch (error) {
    console.error("[Recharge API] Error fetching breaks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recharge breaks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { child_id, category, duration, name, emoji, description } = body;

    if (!child_id || !category || !duration || !name || !emoji) {
      return NextResponse.json(
        { error: "Missing required fields: child_id, category, duration, name, emoji" },
        { status: 400 }
      );
    }

    const validCategories = ["energy", "calm", "creative", "fun"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const validDurations = [5, 10, 15];
    if (!validDurations.includes(duration)) {
      return NextResponse.json(
        { error: `Invalid duration. Must be one of: ${validDurations.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getFamilyDataClient();

    const { data, error } = await supabase
      .from("recharge_breaks")
      .insert({
        child_id,
        category,
        duration,
        name,
        emoji,
        description: description || null,
        is_foundation: false,
        is_active: true,
        source: "parent_added",
        sort_order: 99,
      })
      .select()
      .single();

    if (error) {
      console.error("[Recharge API] Error creating break:", error);
      return NextResponse.json(
        { error: "Failed to create recharge break" },
        { status: 500 }
      );
    }

    return NextResponse.json({ break: data }, { status: 201 });
  } catch (error) {
    console.error("[Recharge API] Error creating break:", error);
    return NextResponse.json(
      { error: "Failed to create recharge break" },
      { status: 500 }
    );
  }
}
