import { NextRequest, NextResponse } from 'next/server';
import { logWater } from '@/lib/nutrition/db';

export async function POST(request: NextRequest) {
  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    const success = await logWater(memberId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to log water' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[Nutrition API] Error logging water:', error);
    return NextResponse.json(
      { error: 'Failed to log water' },
      { status: 500 }
    );
  }
}
