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

// POST — two-step upload to bypass Vercel body size limit
// Step 1: client sends JSON { filename, contentType, title } → gets signed URL back
// Step 2: client uploads directly to Supabase Storage using signed URL
// Step 3: client calls PUT { storagePath, fileUrl, fileType, title } to create DB row
export async function POST(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { filename, contentType, title = '', icon_type = 'general-doc' } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: `File type ${contentType} not allowed` }, { status: 400 });
    }

    // Generate safe filename
    const ext = filename.split('.').pop() || 'bin';
    const safeName = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 60);
    const finalFilename = `${safeName}-${Date.now()}.${ext}`;
    const storagePath = `${BOARD_FOLDER}/${finalFilename}`;

    // Create signed upload URL (valid for 120 seconds)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error('[Board] Signed URL error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL for after upload
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
      publicUrl: publicUrlData.publicUrl,
      fileType: contentType,
      title,
      icon_type,
    });
  } catch (error) {
    console.error('[Board] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT — confirm upload: create DB row after client uploads to storage
export async function PUT(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const { storagePath, publicUrl, fileType, title = '', icon_type = 'general-doc' } = await request.json();

    if (!storagePath || !publicUrl || !fileType) {
      return NextResponse.json({ error: 'storagePath, publicUrl, fileType required' }, { status: 400 });
    }

    const { data: item, error: insertError } = await supabase
      .from('family_board_items')
      .insert({
        title,
        file_url: publicUrl,
        file_type: fileType,
        storage_path: storagePath,
        icon_type,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Board] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[Board] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — update title
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getFamilyDataClient();
    const body = await request.json();
    const { id, title, icon_type } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title ?? '';
    if (icon_type !== undefined) updates.icon_type = icon_type;

    const { data, error } = await supabase
      .from('family_board_items')
      .update(Object.keys(updates).length > 0 ? updates : { title: title ?? '' })
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
