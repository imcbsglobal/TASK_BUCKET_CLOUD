# TaskBucketCloud - Image Upload API

A simple Django REST API for uploading images to Cloudflare R2 bucket and retrieving image URLs. No authentication required.

## Features

- ✅ Upload images to Cloudflare R2 bucket
- ✅ Get public URLs for uploaded images
- ✅ List all uploaded images with their URLs
- ✅ Supported formats: JPG, JPEG, PNG, GIF, WEBP, BMP
- ✅ No authentication required
- ✅ CSRF protection disabled for API endpoints

## Prerequisites

- Python 3.8+
- Cloudflare R2 bucket with credentials
- Virtual environment (recommended)

## Setup Instructions

### 1. Activate Virtual Environment

```cmd
venv\Scripts\activate.bat
```

### 2. Install Dependencies

```cmd
pip install -r requirements.txt
```

### 3. Configure Cloudflare R2

Edit the `.env` file with your Cloudflare R2 credentials:

```env
# Enable Cloudflare R2
CLOUDFLARE_R2_ENABLED=true

# Your bucket name
CLOUDFLARE_R2_BUCKET=your-bucket-name

# Your public bucket URL (without https://)
CLOUDFLARE_R2_PUBLIC_URL=pub-xxxxxxxx.r2.dev

# Your R2 endpoint
CLOUDFLARE_R2_BUCKET_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Your R2 access key
CLOUDFLARE_R2_ACCESS_KEY=your-access-key

# Your R2 secret key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key

# Your account ID
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
```

### 4. Run Migrations

```cmd
python manage.py migrate
```

### 5. Start Development Server

```cmd
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`

## API Endpoints

### 1. Upload Image

**Endpoint:** `POST /api/upload/`

**Request:**
- Content-Type: `multipart/form-data`
- Body: 
  - `image` (required): Image file
  - `name` (optional): Custom name for the image
  - `description` (optional): Description of the image

**Example using curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/upload/ \
  -F "image=@/path/to/your/image.jpg" \
  -F "name=Sunset Photo" \
  -F "description=Beautiful sunset at the beach"
```

**Example using Python requests:**

```python
import requests

url = "http://127.0.0.1:8000/api/upload/"
files = {'image': open('image.jpg', 'rb')}
data = {
    'name': 'Sunset Photo',
    'description': 'Beautiful sunset at the beach'
}
response = requests.post(url, files=files, data=data)
print(response.json())
```

**Success Response (201):**

```json
{
  "success": true,
  "id": 1,
  "url": "https://pub-xxxxxxxx.r2.dev/uuid-filename.jpg",
  "filename": "abc123-def456.jpg",
  "original_filename": "my-image.jpg",
  "name": "Sunset Photo",
  "description": "Beautiful sunset at the beach",
  "size": 245678,
  "uploaded_at": "2025-12-08T12:30:45.123456Z"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "No image file provided. Please send a file with key \"image\"."
}
```

### 2. List All Images

**Endpoint:** `GET /api/list/`

**Example using curl:**

```bash
curl http://127.0.0.1:8000/api/list/
```

**Example using Python requests:**

```python
import requests

url = "http://127.0.0.1:8000/api/list/"
response = requests.get(url)
print(response.json())
```

**Success Response (200):**

```json
{
  "success": true,
  "count": 2,
  "images": [
    {
      "id": 1,
      "filename": "abc123-def456.jpg",
      "url": "https://pub-xxxxxxxx.r2.dev/abc123-def456.jpg",
      "original_filename": "sunset.jpg",
      "name": "Sunset Photo",
      "description": "Beautiful sunset at the beach",
      "size": 245678,
      "uploaded_at": "2025-12-08T12:30:45.123456Z"
    },
    {
      "id": 2,
      "filename": "xyz789-uvw012.png",
      "url": "https://pub-xxxxxxxx.r2.dev/xyz789-uvw012.png",
      "original_filename": "mountain.png",
      "name": "Mountain View",
      "description": null,
      "size": 512340,
      "uploaded_at": "2025-12-08T13:15:22.987654Z"
    }
  ]
}
```

## Testing with Postman

### Upload Image

1. Create a new POST request to `http://127.0.0.1:8000/api/upload/`
2. Go to Body tab → select `form-data`
3. Add key `image` and change type to `File`
4. Choose an image file
5. Click Send

### List Images

1. Create a new GET request to `http://127.0.0.1:8000/api/list/`
2. Click Send

## Project Structure

```
TaskBucketCloud/
├── assets/                  # Django app for image handling
│   ├── views.py            # Upload & list endpoints
│   ├── urls.py             # URL routing
│   └── ...
├── tcb_project/            # Django project settings
│   ├── settings.py         # Cloudflare R2 configuration
│   ├── urls.py             # Main URL routing
│   └── ...
├── venv/                   # Virtual environment
├── .env                    # Environment variables
├── manage.py               # Django management script
└── requirements.txt        # Python dependencies
```

## Supported Image Formats

- JPG / JPEG
- PNG
- GIF
- WEBP
- BMP

## Security Notes

⚠️ **Important:** This API has no authentication and CSRF protection is disabled. It's designed for development/testing purposes. For production use, consider adding:

- API key authentication
- Rate limiting
- File size limits
- Content validation
- CORS configuration
- HTTPS enforcement

## Troubleshooting

### Images not uploading to R2

- Verify your `.env` file has correct Cloudflare R2 credentials
- Check that `CLOUDFLARE_R2_ENABLED=true`
- Ensure your R2 bucket is public or has appropriate access policies

### Virtual environment activation fails

- Use `venv\Scripts\activate.bat` for Command Prompt
- Use `venv\Scripts\Activate.ps1` for PowerShell

### Module not found errors

Make sure you've activated the virtual environment and installed all dependencies:

```cmd
venv\Scripts\activate.bat
pip install -r requirements.txt
```

## License

MIT
