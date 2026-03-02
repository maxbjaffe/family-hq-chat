import { NextRequest, NextResponse } from "next/server";
import { getFamilyDataClient, getRechargeProfile } from "@/lib/supabase";

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

    const profile = await getRechargeProfile(childId);

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error("[Recharge API] Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch recharge profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, ...fields } = body;

    if (!childId) {
      return NextResponse.json(
        { error: "Missing required field: childId" },
        { status: 400 }
      );
    }

    const supabase = getFamilyDataClient();

    const { data, error } = await supabase
      .from("recharge_profiles")
      .upsert(
        {
          child_id: childId,
          ...fields,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "child_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[Recharge API] Error upserting profile:", error);
      return NextResponse.json(
        { error: "Failed to update recharge profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("[Recharge API] Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update recharge profile" },
      { status: 500 }
    );
  }
}
