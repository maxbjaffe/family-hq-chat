import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('User lookup error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
