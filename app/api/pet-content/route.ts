import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    // Fetch one random fact and one random joke in parallel
    const [factResult, jokeResult] = await Promise.all([
      supabase
        .from('pet_content')
        .select('content')
        .eq('type', 'fact')
        .order('random()')
        .limit(1)
        .single(),
      supabase
        .from('pet_content')
        .select('content')
        .eq('type', 'joke')
        .order('random()')
        .limit(1)
        .single(),
    ]);

    // Extract content, allowing null if no records found
    const fact = factResult.data?.content ?? null;
    const joke = jokeResult.data?.content ?? null;

    // Log errors but don't fail - just return null for missing content
    if (factResult.error && factResult.error.code !== 'PGRST116') {
      console.error('Error fetching pet fact:', factResult.error);
    }
    if (jokeResult.error && jokeResult.error.code !== 'PGRST116') {
      console.error('Error fetching pet joke:', jokeResult.error);
    }

    return NextResponse.json({ fact, joke });
  } catch (error) {
    console.error('Pet content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pet content' },
      { status: 500 }
    );
  }
}
