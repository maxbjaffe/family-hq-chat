import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function GET() {
  const analytics = await getAnalyticsSummary();

  if (!analytics) {
    return NextResponse.json(
      { error: "Analytics not available" },
      { status: 503 }
    );
  }

  return NextResponse.json(analytics);
}
