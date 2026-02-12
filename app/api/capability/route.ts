import { NextRequest, NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';
import { calculateFamilyCapability } from '@/lib/analysis/capability-calculator';

// Simple in-memory cache (refreshes every 4 hours)
let cached: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 4 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const refresh = new URL(request.url).searchParams.get('refresh') === 'true';

  try {
    if (!refresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const supabase = getFamilyDataClient();
    const profile = await calculateFamilyCapability(supabase);
    cached = { data: profile, timestamp: Date.now() };
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Capability API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
