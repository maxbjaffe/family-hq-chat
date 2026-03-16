import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/nutrition/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    // Parse optional ?days= query param (default 7)
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    if (isNaN(days) || days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'days must be a number between 1 and 90' },
        { status: 400 }
      );
    }

    const history = await getHistory(memberId, days);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[Nutrition API] Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition history' },
      { status: 500 }
    );
  }
}
