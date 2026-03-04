import { NextRequest, NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';
import { cleanupImage } from '@/lib/image-cleanup';

const BUCKET_NAME = 'family-media';
const BOARD_FOLDER = 'board';

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

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);
    let contentType = file.type;

    // Clean up images (auto-rotate, strip EXIF, compress, resize)
    if (file.type.startsWith('image/')) {
      const cleaned = await cleanupImage(buffer, file.type);
      buffer = Buffer.from(cleaned.buffer);
      contentType = cleaned.contentType;
    }

    // Build filename
    const ext = contentType === 'image/webp'
      ? 'webp'
      : contentType === 'image/jpeg'
        ? 'jpg'
        : file.name.split('.').pop() || 'bin';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 60);
    const filename = `${safeName}-${Date.now()}.${ext}`;
    const storagePath = `${BOARD_FOLDER}/${filename}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error('[Board] Upload error:', uploadError);
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
      .insert({ title, file_url: fileUrl, file_type: contentType, storage_path: storagePath })
      .select()
      .single();

    if (insertError) {
      console.error('[Board] Insert error:', insertError);
      // Try to clean up the uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[Board] Unexpected error:', error);
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

    // Fetch the item to get storage path
    const { data: item, error: fetchError } = await supabase
      .from('family_board_items')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage.from(BUCKET_NAME).remove([item.storage_path]);

    // Delete DB row
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
