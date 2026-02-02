import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

function pickRandom<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    // Fetch all facts and jokes in parallel
    const [factsResult, jokesResult] = await Promise.all([
      supabase
        .from('pet_content')
        .select('content')
        .eq('type', 'fact'),
      supabase
        .from('pet_content')
        .select('content')
        .eq('type', 'joke'),
    ]);

    // Log errors if any
    if (factsResult.error) {
      console.error('Error fetching pet facts:', factsResult.error);
    }
    if (jokesResult.error) {
      console.error('Error fetching pet jokes:', jokesResult.error);
    }

    // Pick random fact and joke
    const fact = pickRandom(factsResult.data || [])?.content ?? null;
    const joke = pickRandom(jokesResult.data || [])?.content ?? null;

    return NextResponse.json({ fact, joke });
  } catch (error) {
    console.error('Pet content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pet content' },
      { status: 500 }
    );
  }
}
