import { NextResponse } from 'next/server';
import { getUserByPin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string' || pin.length !== 4) {
      return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
    }

    const user = await getUserByPin(pin);

    if (!user) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
