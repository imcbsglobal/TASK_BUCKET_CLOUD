from django.test import SimpleTestCase
from django.core.files.uploadedfile import SimpleUploadedFile
import io

try:
    from PIL import Image
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False

from .utils.compress_image import compress_image_file


class CompressImageTests(TestCase):
    def test_compress_large_image(self):
        if not PIL_AVAILABLE:
            self.skipTest("Pillow not available")

        # Create a large JPEG in-memory (high quality) to ensure it's large
        img = Image.new('RGB', (4000, 3000), color='red')
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=100)
        data = buf.getvalue()

        upload = SimpleUploadedFile('big.jpg', data, content_type='image/jpeg')

        # Use a very small max_size_mb to force compression
        compressed = compress_image_file(upload, max_size_mb=0.01, initial_quality=60, min_quality=30)

        # Compression should have produced a different file (or smaller size)
        self.assertTrue(getattr(compressed, 'size', len(data)) < len(data) or compressed is not upload)
        # Ensure we preserved extension/format (was JPG)
        if compressed is not upload:
            self.assertTrue(str(compressed.name).lower().endswith('.jpg'))
