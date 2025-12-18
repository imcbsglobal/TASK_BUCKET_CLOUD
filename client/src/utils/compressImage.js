/**
 * Compress an image File using an offscreen canvas.
 *
 * Options:
 *  - quality: 0..1 initial quality for lossy formats
 *  - maxSizeMB: try to compress to be under this size (in MB)
 *
 * Note: This function preserves the original image dimensions (no resizing), and only
 * changes encoding/quality to reduce file size.
 *
 * Returns a Promise<File> with the compressed blob (or original file if compression
 * did not lead to a smaller file or if compression is not supported for the type).
 */
async function compressImage(file, options = {}) {
  const { quality = 0.8, maxSizeMB = 1 } = options;

  if (!file || !file.type.startsWith('image/')) return file;

  // Skip compressing formats that we don't handle well (animated GIFs/SVGs)
  if (file.type.includes('gif') || file.type.includes('svg')) return file;

  // If already small, skip
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= maxSizeBytes) return file;

  // Read the image
  const imageBitmap = await createImageBitmap(file);

  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;

  // Preserve original dimensions (do not resize). Draw image at original size to only change encoding/quality.
  const targetWidth = origWidth;
  const targetHeight = origHeight;

  // Use canvas to draw and compress
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  // improve down/up-sampling quality if browsers supports it
  if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  // free bitmap memory
  if (imageBitmap && typeof imageBitmap.close === 'function') imageBitmap.close();

  // Choose output type: use WebP for formats that may have alpha (PNG/WebP), otherwise JPEG
  const hasAlpha = file.type.includes('png') || file.type.includes('webp');
  const outputType = hasAlpha ? 'image/webp' : 'image/jpeg';

  // Try iterative quality reduction until we are under target size or hit minQuality
  let currentQuality = quality;
  const minQuality = 0.45;
  let blob = await new Promise((res) => canvas.toBlob(res, outputType, currentQuality));

  while (blob && blob.size > maxSizeBytes && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, currentQuality - 0.1);
    // eslint-disable-next-line no-await-in-loop
    blob = await new Promise((res) => canvas.toBlob(res, outputType, currentQuality));
  }

  // If compression produced a larger file for some reason, keep the original file
  if (!blob || blob.size >= file.size) return file;

  // Create a File so it can be appended as form-data (preserve original filename)
  const ext = outputType.split('/')[1];
  const nameParts = file.name.split('.');
  nameParts[nameParts.length - 1] = ext;
  const newName = nameParts.join('.');
  const compressedFile = new File([blob], newName, { type: outputType });

  return compressedFile;
}

export { compressImage };
export default compressImage;
