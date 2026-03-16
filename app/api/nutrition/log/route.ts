import { NextRequest, NextResponse } from 'next/server';
import { logFood, deleteLog } from '@/lib/nutrition/db';
import type { MealCategory } from '@/lib/nutrition/types';

const VALID_MEALS: MealCategory[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'drink',
];

export async function POST(request: NextRequest) {
  try {
    const { memberId, foodId, mealCategory } = await request.json();

    if (!memberId || !foodId || !mealCategory) {
      return NextResponse.json(
        { error: 'memberId, foodId, and mealCategory are required' },
        { status: 400 }
      );
    }

    if (!VALID_MEALS.includes(mealCategory)) {
      return NextResponse.json(
        { error: `Invalid mealCategory. Must be one of: ${VALID_MEALS.join(', ')}` },
        { status: 400 }
      );
    }

    const log = await logFood(memberId, foodId, mealCategory);

    if (!log) {
      return NextResponse.json(
        { error: 'Failed to log food' },
        { status: 500 }
      );
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('[Nutrition API] Error logging food:', error);
    return NextResponse.json(
      { error: 'Failed to log food' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { logId } = await request.json();

    if (!logId) {
      return NextResponse.json(
        { error: 'logId is required' },
        { status: 400 }
      );
    }

    const success = await deleteLog(logId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Nutrition API] Error deleting log:', error);
    return NextResponse.json(
      { error: 'Failed to delete log' },
      { status: 500 }
    );
  }
}
