# Bulk Image Uploader - Desktop Application

A Windows desktop application built with Python and Tkinter for batch uploading images from Excel to your Django REST API.

---

## 📋 Features

- **Excel File Processing**: Read image paths, names, and descriptions from Excel
- **Batch Upload**: Upload multiple images to Django API automatically
- **Progress Tracking**: Real-time progress bar and status updates
- **Error Handling**: Graceful handling of missing files and API errors
- **Result Export**: Generate updated Excel file with image URLs and status
- **User-Friendly UI**: Clean Tkinter interface with detailed logging

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install pandas openpyxl requests
```

### 2. Prepare Your Excel File

Create an Excel file (.xlsx) with these columns:

| serial_number | image_path | name | description |
|---------------|------------|------|-------------|
| 1 | C:\Images\photo1.jpg | Product A | High quality product |
| 2 | C:\Images\photo2.jpg | Product B | Premium item |
| 3 | C:\Images\photo3.jpg | Product C | Best seller |

**Required columns:**
- `serial_number`: Unique identifier for each row
- `image_path`: Full local path to the image file
- `name`: Name/title for the image (sent to API)
- `description`: Description text (sent to API)

### 3. Configure Your API Endpoint

Update the API endpoint in the application to match your Django server:
```
http://localhost:8000/api/upload/
```

Or change it in the UI when the app is running.

### 4. Run the Application

```bash
python bulk_uploader.py
```

---

## 🎯 How It Works

1. **Select Excel File**: Click "Select Excel File" and choose your prepared Excel file
2. **Verify API Endpoint**: Ensure the API endpoint URL is correct
3. **Start Upload**: Click "Start Upload" to begin the batch process
4. **Monitor Progress**: Watch the progress bar and live logs
5. **Get Results**: After completion, find the updated Excel file in the same directory as the original:
   - `originalFileName_updated.xlsx`

---

## 📊 Excel Output Format

After processing, the Excel file will include two new columns:

| serial_number | image_path | name | description | **image_url** | **status** |
|---------------|------------|------|-------------|---------------|------------|
| 1 | C:\Images\photo1.jpg | Product A | ... | https://cdn.example.com/img1.jpg | success |
| 2 | C:\Images\photo2.jpg | Product B | ... | | file not found |
| 3 | C:\Images\photo3.jpg | Product C | ... | https://cdn.example.com/img3.jpg | success |

- **image_url**: The returned URL from the API (empty if failed)
- **status**: 
  - `success` - Upload successful
  - `file not found` - Image file doesn't exist at specified path
  - `<error message>` - Any other error details

---

## 🔧 API Endpoint Requirements

Your Django API should accept:

**Endpoint:** `POST /api/upload/`

**Request Format:**
```
Content-Type: multipart/form-data

Form Data:
- file: <image_file> (binary)
- name: <string>
- description: <string>
```

**Expected Response (Success):**
```json
{
  "success": true,
  "url": "https://cdn.example.com/path/image.jpg"
}
```

Or:
```json
{
  "image": {
    "url": "https://cdn.example.com/path/image.jpg",
    "name": "Product A",
    "description": "..."
  }
}
```

**Status Codes:**
- `200` or `201` - Success
- `4xx` / `5xx` - Error (will be logged)

---

## 🎨 UI Features

### Main Window
- **API Endpoint Field**: Configure your Django server URL
- **File Selection**: Browse and select your Excel file
- **Start Upload Button**: Begin the batch upload process

### Progress Section
- **Live Progress Bar**: Visual progress indicator
- **Current Status**: "Uploading row X of Y"
- **Success/Fail Counts**: Real-time statistics

### Log Area
- Timestamped log entries
- Color-coded messages (INFO, SUCCESS, ERROR)
- Scrollable text area for detailed tracking

---

## ⚙️ Configuration

### Change API Endpoint
Edit the default endpoint in the code:
```python
self.api_endpoint = tk.StringVar(value="http://your-server.com/api/upload/")
```

Or change it directly in the UI before uploading.

### Timeout Settings
Adjust the request timeout (default: 30 seconds):
```python
response = requests.post(
    self.api_endpoint.get(),
    files=files,
    data=data,
    timeout=30  # Change this value
)
```

---

## 🛠️ Troubleshooting

### Common Issues

**"File not found" errors**
- Verify image paths in Excel are absolute paths
- Check that image files exist at specified locations
- Use forward slashes `/` or double backslashes `\\` in paths

**"Connection error - check API endpoint"**
- Ensure Django server is running
- Verify the API endpoint URL is correct
- Check firewall settings

**"HTTP 500" errors**
- Check Django server logs
- Verify API accepts multipart/form-data
- Ensure required fields (file, name, description) are handled

**UI freezing**
- The app uses threading to prevent freezing
- If issues persist, check Python version (3.7+ recommended)

---

## 📦 Project Structure

```
TaskBucketCloud/
├── bulk_uploader.py          # Main desktop application
├── requirements_desktop.txt  # Python dependencies
├── README_DESKTOP.md         # This file
└── sample_template.xlsx      # (Create your own Excel template)
```

---

## 🔐 Security Notes

- The app does not store or transmit credentials
- API authentication should be handled by your Django backend
- Ensure HTTPS is used for production API endpoints
- Validate and sanitize file paths to prevent directory traversal

---

## 🚀 Advanced Usage

### Batch Processing Large Files
For Excel files with 1000+ rows:
- Process runs in background thread (non-blocking)
- Memory-efficient pandas operations
- Progress updates every row

### Custom Response Handling
Modify the `upload_image()` method to handle different API response formats:
```python
if 'url' in result:
    return {'success': True, 'url': result['url']}
elif 'data' in result and 'image_url' in result['data']:
    return {'success': True, 'url': result['data']['image_url']}
```

### Adding Authentication
To add API authentication (e.g., Bearer token):
```python
headers = {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
}
response = requests.post(
    self.api_endpoint.get(),
    files=files,
    data=data,
    headers=headers,
    timeout=30
)
```

---

## 📝 License

This desktop application is part of the TaskBucketCloud project.

---

## 🤝 Support

For issues or questions:
1. Check the log output in the UI
2. Review Django server logs
3. Verify Excel file format matches template
4. Ensure all dependencies are installed

---

## 🎯 Next Steps

1. **Test with Sample Data**: Create a small Excel file with 2-3 test images
2. **Verify API**: Test your Django endpoint with Postman/curl first
3. **Run Upload**: Execute the desktop app and monitor the logs
4. **Check Results**: Review the generated `*_updated.xlsx` file

---

**Happy Uploading! 🚀**
