const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 80;

/**
 * Clean up uploaded images:
 * - Auto-rotate based on EXIF orientation (iPhone photos)
 * - Strip EXIF metadata (privacy)
 * - Resize if larger than MAX_DIMENSION
 * - Compress to JPEG quality 80
 * Returns processed buffer and the output content type.
 * Falls back to original if sharp is unavailable.
 */
export async function cleanupImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; contentType: string }> {
  // Only process raster images (not PDFs, not GIFs with animation)
  const processable = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!processable.includes(mimeType)) {
    return { buffer, contentType: mimeType };
  }

  // Dynamic import so the module loads even if sharp isn't available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sharp: any;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[image-cleanup] sharp not available, skipping cleanup');
    return { buffer, contentType: mimeType };
  }

  let pipeline = sharp(buffer)
    .rotate() // auto-rotate based on EXIF orientation
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });

  // Output as WebP for best compression, except JPEG stays JPEG for compatibility
  if (mimeType === 'image/jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    const output = await pipeline.toBuffer();
    return { buffer: output, contentType: 'image/jpeg' };
  }

  // Everything else → WebP
  pipeline = pipeline.webp({ quality: JPEG_QUALITY });
  const output = await pipeline.toBuffer();
  return { buffer: output, contentType: 'image/webp' };
}
