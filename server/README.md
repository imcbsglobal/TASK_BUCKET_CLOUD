# TaskBucketCloud - Image Upload API

A simple Django REST API for uploading images to Cloudflare R2 bucket and retrieving image URLs. API Key authentication is now enabled (see Authentication section).

## Features

- ✅ Upload images to Cloudflare R2 bucket
- ✅ Get public URLs for uploaded images
- ✅ List all uploaded images with their URLs
- ✅ Update image metadata (name, description)
- ✅ Delete images from storage and database
- ✅ Supported formats: JPG, JPEG, PNG, GIF, WEBP, BMP
- ✅ API key authentication (X-API-Key header required for API requests)
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
# API Key Authentication Guide

## Overview

TaskBucket Cloud now includes API key authentication for all API endpoints. This provides basic security for your image management API.

## API Key

**Hardcoded API Key:** `imcbs-secret-key-2025`

This key must be included in the `X-API-Key` header for all API requests.

## How to Use

### cURL Examples

#### 1. Upload Image
```bash
curl -X POST http://localhost:8000/api/upload/ \
  -H "X-API-Key: imcbs-secret-key-2025" \
  -F "image=@/path/to/your/image.jpg" \
  -F "name=My Photo" \
  -F "description=A beautiful sunset"
```

#### 2. List All Images
```bash
curl -X GET http://localhost:8000/api/list/ \
  -H "X-API-Key: imcbs-secret-key-2025"
```

#### 3. Update Image Metadata
```bash
curl -X PUT http://localhost:8000/api/update/1/ \
  -H "X-API-Key: imcbs-secret-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Title", "description": "New description"}'
```

#### 4. Delete Image
```bash
curl -X DELETE http://localhost:8000/api/delete/1/ \
  -H "X-API-Key: imcbs-secret-key-2025"
```

### JavaScript/Fetch Example

```javascript
// Upload image
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('name', 'My Photo');
formData.append('description', 'Description here');

const response = await fetch('http://localhost:8000/api/upload/', {
  method: 'POST',
  headers: {
    'X-API-Key': 'imcbs-secret-key-2025'
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

### Python Requests Example

```python
import requests

# API configuration
API_BASE = 'http://localhost:8000/api'
API_KEY = 'imcbs-secret-key-2025'

headers = {
    'X-API-Key': API_KEY
}

# Upload image
with open('image.jpg', 'rb') as f:
    files = {'image': f}
    data = {'name': 'My Photo', 'description': 'A sunset'}
    response = requests.post(f'{API_BASE}/upload/', 
                            headers=headers, 
                            files=files, 
                            data=data)
    print(response.json())

# List images
response = requests.get(f'{API_BASE}/list/', headers=headers)
print(response.json())

# Update image
response = requests.put(f'{API_BASE}/update/1/', 
                       headers=headers,
                       json={'name': 'Updated Name'})
print(response.json())

# Delete image
response = requests.delete(f'{API_BASE}/delete/1/', headers=headers)
print(response.json())
```

## Error Responses

### Missing API Key
```json
{
  "success": false,
  "error": "API key is required. Please provide X-API-Key header."
}
```
**Status Code:** 401

### Invalid API Key
```json
{
  "success": false,
  "error": "Invalid API key. Access denied."
}
```
**Status Code:** 401

## Accessing the Frontend API Documentation

1. Start the frontend: `npm run dev` (in the `client` directory)
2. Login to the application
3. Click on **"API Docs"** in the sidebar
4. View comprehensive documentation with:
   - All endpoint details
   - Request/response examples
   - cURL commands (copy-to-clipboard enabled)
   - Authentication instructions

## Configuration

### Changing the API Key

To change the hardcoded API key:

1. Open `server/tcb_project/settings.py`
2. Find the `API_KEY` setting at the bottom:
   ```python
   API_KEY = 'imcbs-secret-key-2025'
   ```
3. Change to your desired key
4. Update the frontend documentation in `client/src/pages/ApiDocs.jsx`:
   ```javascript
   const apiKey = 'your-new-api-key';
   ```
5. Restart both backend and frontend servers

### Disabling API Key Authentication (Not Recommended)

To disable API key authentication:

1. Open `server/tcb_project/settings.py`
2. Remove this line from `MIDDLEWARE`:
   ```python
   'tcb_project.middleware.APIKeyMiddleware',
   ```
3. Restart the backend server

## Security Notes

⚠️ **Important Security Considerations:**

- This is a **basic** authentication mechanism suitable for development and testing
- The API key is hardcoded and not environment-specific
- For production use, consider:
  - Using environment variables for the API key
  - Implementing user-specific API keys with a database
  - Adding rate limiting
  - Using HTTPS/TLS encryption
  - Implementing JWT tokens or OAuth2 for more robust authentication
  - Adding API key rotation mechanisms

## Testing with Postman

1. Create a new request in Postman
2. Set the method (GET, POST, PUT, DELETE)
3. Enter the URL (e.g., `http://localhost:8000/api/list/`)
4. Go to **Headers** tab
5. Add header:
   - Key: `X-API-Key`
   - Value: `imcbs-secret-key-2025`
6. For POST (upload), go to **Body** → **form-data**:
   - Add `image` field (type: File)
   - Add `name` field (type: Text)
   - Add `description` field (type: Text)
7. Send the request

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure:
- Backend CORS settings allow the frontend origin
- The `X-API-Key` header is included in `CORS_ALLOW_HEADERS` (already configured)

### 401 Unauthorized
- Check that the `X-API-Key` header is present
- Verify the API key matches exactly (case-sensitive)
- Ensure no extra spaces in the header value

### Admin Panel Still Accessible
The admin panel (`/admin/`) is exempt from API key authentication for convenience.

## Support

For more information, visit the **API Docs** page in the frontend application or check the backend `views.py` for endpoint implementation details.

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
  -F "description=Beautiful sunset at the beach" \
  -F "client_id=client-123"
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
  "client_id": "client-123",
  "name": "Sunset Photo",
  "description": "Beautiful sunset at the beach",
  "size": 245678,
  "uploaded_at": "2025-12-08T12:30:45.123456Z"
}
```

**Note:** The `client_id` field is required for all upload requests.

**Error Response (400):**

```json
{
  "success": false,
  "error": "No image file provided. Please send a file with key \"image\"."
}
```

### 2. List All Images

**Endpoint:** `GET /api/list/`

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
      "client_id": "client-123",
      "name": "Sunset Photo",
      "description": "Beautiful sunset at the beach",
      "size": 245678,
      "id": 2,
      "filename": "xyz789-uvw012.png",
      "url": "https://pub-xxxxxxxx.r2.dev/xyz789-uvw012.png",
      "original_filename": "mountain.png",
      "client_id": null,
      "name": "Mountain View",
      "description": null,
      "size": 512340,
      "uploaded_at": "2025-12-08T13:15:22.987654Z"
    }
  ]
}
```

response = requests.post(url, files=files, data=data, headers={'X-API-Key': 'imcbs-secret-key-2025'})

**Endpoint:** `PUT /api/update/<image_id>/`

**Request:**
- Content-Type: `application/json`
- Body:
  - `name` (optional): Update the image name
  - `description` (optional): Update the image description
  - `client_id` (optional): Update the client identifier associated with the image

**Example using curl:**

```bash
curl -X PUT http://127.0.0.1:8000/api/update/1/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Sunset",
    "description": "A beautiful sunset at the beach during summer"
  }'
```

**Example using Python requests:**

```python
import requests

url = "http://127.0.0.1:8000/api/update/1/"
data = {
    "name": "Updated Sunset",
    "description": "A beautiful sunset at the beach during summer"
}
response = requests.put(url, json=data)
print(response.json())
```

**Success Response (200):**

```json
{
  "success": true,
  "id": 1,
  "filename": "abc123-def456.jpg",
  "url": "https://pub-xxxxxxxx.r2.dev/abc123-def456.jpg",
  "original_filename": "sunset.jpg",
  "client_id": "client-123",
  "name": "Updated Sunset",
  "description": "A beautiful sunset at the beach during summer",
  "size": 245678,
  "uploaded_at": "2025-12-08T12:30:45.123456Z"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Image with id 1 not found."
}
```

### 4. Delete Image

**Endpoint:** `DELETE /api/delete/<image_id>/`

**Example using curl:**

```bash
curl -X DELETE http://127.0.0.1:8000/api/delete/1/
```

**Example using Python requests:**

```python
import requests

url = "http://127.0.0.1:8000/api/delete/1/"
response = requests.delete(url)
print(response.json())
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Image 1 deleted successfully."
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Image with id 1 not found."
response = requests.put(url, json=data, headers={'X-API-Key': 'imcbs-secret-key-2025'})
```

> **Note:** Deleting an image removes it from both the database and Cloudflare R2 storage. All references to the image URL will become invalid.

> **Note:** All image URLs returned by the API are public Cloudflare R2 URLs, not local `/media/` paths. Images are stored in your Cloudflare R2 bucket and served from there.

## Testing with Postman

### Upload Image

1. Create a new POST request to `http://127.0.0.1:8000/api/upload/`
2. Go to Headers tab → add header `X-API-Key: imcbs-secret-key-2025`
3. Go to Body tab → select `form-data`
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
