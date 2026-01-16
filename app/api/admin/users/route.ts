import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';
import { createHash } from 'crypto';

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, name, role, created_at')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, role, pin } = await request.json();

    if (!name || !role || !pin) {
      return NextResponse.json({ error: 'Name, role, and PIN are required' }, { status: 400 });
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();
    const pinHash = hashPin(pin);

    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        role,
        pin_hash: pinHash,
        integrations: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, pin } = await request.json();

    if (!id || !pin) {
      return NextResponse.json({ error: 'User ID and PIN are required' }, { status: 400 });
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();
    const pinHash = hashPin(pin);

    const { error } = await supabase
      .from('users')
      .update({ pin_hash: pinHash })
      .eq('id', id);

    if (error) {
      console.error('Error updating PIN:', error);
      return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Users PUT error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
