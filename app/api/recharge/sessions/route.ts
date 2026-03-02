import { NextRequest, NextResponse } from "next/server";
import {
  createRechargeSession,
  completeRechargeSession,
  getRecentRechargeSession,
} from "@/lib/supabase";

const COOLDOWN_MINUTES = 30;

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

    const recentSession = await getRecentRechargeSession(childId, COOLDOWN_MINUTES);

    if (recentSession) {
      const sessionStart = new Date(recentSession.started_at).getTime();
      const cooldownEndsAt = new Date(sessionStart + COOLDOWN_MINUTES * 60 * 1000);
      const remainingMinutes = Math.ceil(
        (cooldownEndsAt.getTime() - Date.now()) / (60 * 1000)
      );

      if (remainingMinutes > 0) {
        return NextResponse.json({
          onCooldown: true,
          remainingMinutes,
          cooldownEndsAt: cooldownEndsAt.toISOString(),
        });
      }
    }

    return NextResponse.json({ onCooldown: false });
  } catch (error) {
    console.error("[Recharge API] Error checking cooldown:", error);
    return NextResponse.json(
      { error: "Failed to check cooldown" },
      { status: 500 }
    );
  }
}

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

    // Cooldown check
    const recentSession = await getRecentRechargeSession(child_id, COOLDOWN_MINUTES);
    if (recentSession) {
      const sessionStart = new Date(recentSession.started_at).getTime();
      const cooldownEndsAt = new Date(sessionStart + COOLDOWN_MINUTES * 60 * 1000);
      const remainingMinutes = Math.ceil(
        (cooldownEndsAt.getTime() - Date.now()) / (60 * 1000)
      );

      if (remainingMinutes > 0) {
        return NextResponse.json(
          {
            error: "Cooldown active — too soon for another recharge",
            cooldown: {
              remainingMinutes,
              cooldownEndsAt: cooldownEndsAt.toISOString(),
            },
          },
          { status: 429 }
        );
      }
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
