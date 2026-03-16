import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyState,
  getTodayLogs,
  getTodayWaterCount,
} from '@/lib/nutrition/db';
import type { DailyState } from '@/lib/nutrition/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    const [state, logs, waterCount] = await Promise.all([
      getDailyState(memberId),
      getTodayLogs(memberId),
      getTodayWaterCount(memberId),
    ]);

    // If no state exists yet, return a default zeroed state
    const effectiveState: DailyState = state ?? {
      member_id: memberId,
      date: new Date().toISOString().split('T')[0],
      protein_total: 0,
      veggie_total: 0,
      sugar_total: 0,
      water_total: 0,
      vitamin_total: 0,
      avatar_state: 'pebble',
    };

    return NextResponse.json({
      state: effectiveState,
      logs,
      waterCount,
    });
  } catch (error) {
    console.error('[Nutrition API] Error fetching state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition state' },
      { status: 500 }
    );
  }
}
