import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    // Auth via shortcut key
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

    // Read and clean up image
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);
    let contentType = file.type;

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

    // Upload
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error('[Board Shortcut] Upload error:', uploadError);
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
