import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const secretKey = request.headers.get('X-Shortcut-Key');
    if (secretKey !== process.env.SHORTCUTS_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, reminders } = await request.json();

    if (!user || !Array.isArray(reminders)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Look up user by name
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .ilike('name', user)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert reminders
    for (const reminder of reminders) {
      await supabase
        .from('cached_reminders')
        .upsert({
          reminder_id: reminder.id || reminder.title + reminder.list_name,
          user_id: userData.id,
          title: reminder.title,
          due_date: reminder.due_date,
          list_name: reminder.list_name,
          priority: reminder.priority || 0,
          is_completed: reminder.is_completed || false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'reminder_id',
        });
    }

    return NextResponse.json({ success: true, count: reminders.length });
  } catch (error) {
    console.error('Reminders sync error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
