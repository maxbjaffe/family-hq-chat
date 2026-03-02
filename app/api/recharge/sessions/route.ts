import { NextRequest, NextResponse } from "next/server";
import { createRechargeSession, completeRechargeSession } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { child_id, break_id, duration_planned, context } = body;

    if (!child_id || !break_id || !duration_planned) {
      return NextResponse.json(
        { error: "Missing required fields: child_id, break_id, duration_planned" },
        { status: 400 }
      );
    }

    const validContexts = ["homework", "frustrated", "celebration", "low_energy", "transition", "manual"];
    if (context && !validContexts.includes(context)) {
      return NextResponse.json(
        { error: `Invalid context. Must be one of: ${validContexts.join(", ")}` },
        { status: 400 }
      );
    }

    const session = await createRechargeSession({
      child_id,
      break_id,
      duration_planned,
      context,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Failed to create recharge session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("[Recharge API] Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create recharge session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, completed, duration_actual, paused_duration, rating } = body;

    if (!sessionId || typeof completed !== "boolean" || typeof duration_actual !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, completed (boolean), duration_actual (number)" },
        { status: 400 }
      );
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const session = await completeRechargeSession(sessionId, {
      completed,
      duration_actual,
      paused_duration,
      rating,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Failed to update recharge session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("[Recharge API] Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update recharge session" },
      { status: 500 }
    );
  }
}
