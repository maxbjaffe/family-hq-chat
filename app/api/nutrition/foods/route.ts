import { NextResponse } from 'next/server';
import { getFoods } from '@/lib/nutrition/db';

export async function GET() {
  try {
    const foods = await getFoods();
    return NextResponse.json({ foods });
  } catch (error) {
    console.error('[Nutrition API] Error fetching foods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}
