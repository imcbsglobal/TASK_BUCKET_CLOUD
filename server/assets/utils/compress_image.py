import io
import os
from django.core.files.base import ContentFile

try:
    from PIL import Image, ImageOps
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False


def _has_alpha(img):
    return img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)


def compress_image_file(uploaded_file, max_size_mb=1.0, initial_quality=80, min_quality=45):
    """Compress a Django uploaded file if it's larger than `max_size_mb`.

    Options:
      - initial_quality: 0..1 or 1..100 initial quality for lossy formats (JPEG/WEBP)
      - min_quality: 0..1 or 1..100 minimum quality to try before giving up
      - max_size_mb: try to compress to be under this size (in MB)

    Note: This function preserves the original image dimensions (no resizing), and only
    changes encoding quality to reduce file size. It preserves the original image
    format/extension (JPEG, PNG, WEBP) when possible and will NOT convert formats.

    Returns: the original uploaded file (unchanged) or a Django `ContentFile` with
    `.name` and `.size` containing compressed data.

    Behavior:
      - Skips compression when Pillow is not available.
      - Skips animated GIFs and unsupported formats.
      - If compression doesn't produce a smaller file, the original file is returned.
    """
    if not PIL_AVAILABLE:
        return uploaded_file

    # Normalize quality parameters (allow 0..1 or 1..100 inputs)
    try:
        if 0 < initial_quality <= 1:
            initial_quality = int(initial_quality * 100)
        initial_quality = max(1, min(100, int(initial_quality)))
    except Exception:
        initial_quality = 80

    try:
        if 0 < min_quality <= 1:
            min_quality = int(min_quality * 100)
        min_quality = max(1, min(100, int(min_quality)))
    except Exception:
        min_quality = 45

    try:
        # If already under threshold, return original
        max_bytes = int(max_size_mb * 1024 * 1024)
        if uploaded_file.size <= max_bytes:
            return uploaded_file

        # Open image
        uploaded_file.seek(0)
        img = Image.open(uploaded_file)

        # Apply EXIF-based transpose so images appear with the correct orientation
        # (many phones store orientation in EXIF instead of rotating pixel data)
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            # If EXIF data is missing or transformation fails, continue with original image
            pass

        # Skip animated GIFs (Pillow may raise for n_frames)
        if getattr(img, "is_animated", False) and img.format == "GIF":
            return uploaded_file

        # Determine output format and preserve it (do not convert formats)
        original_format = (img.format or '').upper()
        if not original_format:
            # Fall back to file extension if PIL didn't detect format
            ext = os.path.splitext(uploaded_file.name)[1].lower().lstrip('.')
            ext_map = {'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'webp': 'WEBP', 'bmp': 'BMP', 'tif': 'TIFF', 'tiff': 'TIFF'}
            original_format = ext_map.get(ext, '')

        # Only attempt compression for formats we support without converting
        if original_format not in ('JPEG', 'PNG', 'WEBP'):
            # If format isn't handled for safe compression, leave original file unchanged
            return uploaded_file

        out_format = original_format
        out_ext = os.path.splitext(uploaded_file.name)[1].lower() or ('.' + out_format.lower())

        # Special-case: BMP/TIFF are not useful to compress lossily here — skip
        if out_format in ('BMP', 'TIFF'):
            return uploaded_file

        buffer = io.BytesIO()

        if out_format in ('JPEG', 'WEBP'):
            # Ensure correct mode for JPEG
            if out_format == 'JPEG' and img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGB")

            quality = initial_quality
            min_q = min_quality
            step = 10

            save_kwargs = {"format": out_format, "quality": quality}
            if out_format == 'WEBP':
                save_kwargs["method"] = 6

            img.save(buffer, **save_kwargs)

            # Reduce quality until under target size or hit min_quality
            while buffer.tell() > max_bytes and quality > min_q:
                quality = max(min_q, quality - step)
                buffer.seek(0)
                buffer.truncate(0)
                save_kwargs["quality"] = quality
                img.save(buffer, **save_kwargs)

        elif out_format == 'PNG':
            # Try PNG with optimization and high compression level
            # If image has alpha, avoid quantize as it may remove alpha information
            try_levels = [9]  # compress_level values (Pillow uses 'compress_level' 0-9)
            saved_ok = False
            for level in try_levels:
                buffer.seek(0)
                buffer.truncate(0)
                try:
                    img.save(buffer, format='PNG', optimize=True, compress_level=level)
                except Exception:
                    # Some PIL builds may not accept compress_level; try without it
                    buffer.seek(0)
                    buffer.truncate(0)
                    img.save(buffer, format='PNG', optimize=True)

                if buffer.tell() <= max_bytes:
                    saved_ok = True
                    break

            # If still too large and image is not alpha, try quantize to reduce colors
            if buffer.tell() > max_bytes and not _has_alpha(img):
                for colors in (256, 128, 64, 32):
                    buffer.seek(0)
                    buffer.truncate(0)
                    try:
                        q = img.convert('RGB').quantize(colors=colors, method=Image.MEDIANCUT)
                        q.save(buffer, format='PNG', optimize=True)
                    except Exception:
                        continue

                    if buffer.tell() <= max_bytes:
                        saved_ok = True
                        break

            # If compression didn't get under size, we'll let it fall through and compare sizes
            # No additional loops here

        # If compression didn't help, keep original
        if buffer.tell() == 0 or buffer.tell() >= uploaded_file.size:
            return uploaded_file

        # Build a ContentFile (Django) to emulate uploaded file and preserve the original extension
        buffer.seek(0)
        new_content = buffer.read()
        base_name = os.path.splitext(uploaded_file.name)[0]
        new_name = base_name + out_ext
        content_file = ContentFile(new_content)
        content_file.name = new_name
        content_file.size = len(new_content)

        return content_file

    except Exception:
        # On any error, don't block upload; return original
        return uploaded_file
