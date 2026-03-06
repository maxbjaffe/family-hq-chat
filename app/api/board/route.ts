import { NextRequest, NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

const BUCKET_NAME = 'family-media';
const FAMILY_USER_ID = '00879c1b-a586-4d52-96be-8f4b7ddf7257';
const BOARD_FOLDER = `${FAMILY_USER_ID}/board`;

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

// GET — list all board items
export async function GET() {
  try {
    const supabase = getFamilyDataClient();
    const { data, error } = await supabase
      .from('family_board_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Board] List error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('[Board] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — upload file + create board item
// Mirrors the proven pattern from app/api/admin/media/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    // Generate safe filename
    const ext = file.name.split('.').pop() || 'bin';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 60);
    const filename = `${safeName}-${Date.now()}.${ext}`;
    const storagePath = `${BOARD_FOLDER}/${filename}`;

    // Upload to storage — use arrayBuffer directly (same as admin media route)
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Board] Upload error:', JSON.stringify(uploadError), 'path:', storagePath);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // Insert DB row
    const { data: item, error: insertError } = await supabase
      .from('family_board_items')
      .insert({ title, file_url: fileUrl, file_type: file.type, storage_path: storagePath })
      .select()
      .single();

    if (insertError) {
      console.error('[Board] Insert error:', insertError);
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[Board] POST error:', error instanceof Error ? `${error.message}\n${error.stack}` : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — update title
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { id, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('family_board_items')
      .update({ title: title ?? '' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Board] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('[Board] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — remove item + storage file
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data: item, error: fetchError } = await supabase
      .from('family_board_items')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await supabase.storage.from(BUCKET_NAME).remove([item.storage_path]);

    const { error: deleteError } = await supabase
      .from('family_board_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Board] Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Board] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
