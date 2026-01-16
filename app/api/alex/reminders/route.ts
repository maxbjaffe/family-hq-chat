import { NextResponse } from 'next/server';
import { getCachedReminders } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const reminders = await getCachedReminders(userId);

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Reminders API error:', error);
    return NextResponse.json({ reminders: [] });
  }
}
