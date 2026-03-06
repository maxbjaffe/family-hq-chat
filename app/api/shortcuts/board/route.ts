import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    const secretKey = request.headers.get('X-Shortcut-Key');
    if (secretKey !== process.env.SHORTCUTS_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const supabase = getFamilyDataClient();

    const ext = file.name.split('.').pop() || 'bin';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 60);
    const filename = `${safeName}-${Date.now()}.${ext}`;
    const storagePath = `${BOARD_FOLDER}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Board Shortcut] Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const { data: item, error: insertError } = await supabase
      .from('family_board_items')
      .insert({ title, file_url: urlData.publicUrl, file_type: file.type, storage_path: storagePath })
      .select()
      .single();

    if (insertError) {
      console.error('[Board Shortcut] Insert error:', insertError);
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: { id: item.id, title: item.title, file_url: item.file_url },
    }, { status: 201 });
  } catch (error) {
    console.error('[Board Shortcut] Error:', error);
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}
