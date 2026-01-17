# Deferred File Deletion System

This system allows instant deletion of image metadata while deferring slow file storage operations to background processing.

## How It Works

1. **Instant Delete**: When you delete images, the metadata is removed from the database immediately
2. **Queue Files**: File paths are added to a `PendingFileDeletion` queue
3. **Background Cleanup**: Files are deleted from storage later via a simple cleanup process

## Benefits

- ✅ **Fast Response**: Users get instant feedback (no waiting for slow file deletions)
- ✅ **Simple Architecture**: No Redis, Celery, or complex infrastructure needed
- ✅ **Retry Logic**: Failed deletions are automatically retried
- ✅ **Error Tracking**: Failed deletions are logged and tracked

## Running Cleanup

### Option 1: Management Command (Recommended for Cron)

```bash
# Basic usage
python manage.py cleanup_files

# Process more files at once
python manage.py cleanup_files --batch-size 500

# Allow more retry attempts
python manage.py cleanup_files --max-attempts 5
```

### Option 2: API Endpoint

```bash
# Run cleanup via HTTP POST
curl -X POST "https://gallery.imcbs.com/api/cleanup/run/?batch_size=100"

# Check queue stats via HTTP GET
curl "https://gallery.imcbs.com/api/cleanup/stats/"
```

### Option 3: Django Admin

Visit `/admin/assets/pendingfiledeletion/` to view and manage the deletion queue manually.

## Setup Automated Cleanup

### Using Cron (Linux/Mac)

Add to crontab (`crontab -e`):

```cron
# Run cleanup every 5 minutes
*/5 * * * * cd /path/to/server && source venv/bin/activate && python manage.py cleanup_files >> /var/log/cleanup_files.log 2>&1

# Or run once per hour
0 * * * * cd /path/to/server && source venv/bin/activate && python manage.py cleanup_files
```

### Using systemd Timer (Linux)

Create `/etc/systemd/system/cleanup-files.service`:

```ini
[Unit]
Description=Cleanup Pending File Deletions

[Service]
Type=oneshot
WorkingDirectory=/path/to/server
ExecStart=/path/to/server/venv/bin/python manage.py cleanup_files
User=your-user
```

Create `/etc/systemd/system/cleanup-files.timer`:

```ini
[Unit]
Description=Run cleanup files every 10 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=10min

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl enable cleanup-files.timer
sudo systemctl start cleanup-files.timer
```

### Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 10 minutes)
4. Action: Start a program
   - Program: `C:\path\to\venv\Scripts\python.exe`
   - Arguments: `manage.py cleanup_files`
   - Start in: `C:\path\to\server`

## Monitoring

### Check Queue Stats via API

```bash
curl https://gallery.imcbs.com/api/cleanup/stats/
```

Response:
```json
{
  "success": true,
  "stats": {
    "total_pending": 156,
    "oldest_queued": "2026-01-17T10:30:00Z",
    "newest_queued": "2026-01-17T12:45:00Z",
    "by_attempts": [
      {"attempts": 0, "count": 120},
      {"attempts": 1, "count": 30},
      {"attempts": 2, "count": 6}
    ]
  }
}
```

### Check Django Admin

Visit `/admin/assets/pendingfiledeletion/` to:
- View all pending deletions
- See retry attempts and errors
- Manually delete queue entries if needed

## Configuration

Edit these values in the cleanup command or API call:

- **batch_size**: Number of files to process per run (default: 100, max: 1000)
- **max_attempts**: Number of retry attempts before giving up (default: 3)

## Troubleshooting

### Queue Growing Too Large

Run cleanup more frequently or increase batch size:

```bash
python manage.py cleanup_files --batch-size 1000
```

### Files Failing to Delete

Check the `last_error` field in Django admin to see why deletions are failing. Common causes:
- File already deleted
- Permission issues
- Network/storage connectivity problems

### Manual Queue Clear

If needed, clear the entire queue (files will remain in storage):

```python
from assets.models import PendingFileDeletion
PendingFileDeletion.objects.all().delete()
```

## Database Tables

### PendingFileDeletion

| Field | Type | Description |
|-------|------|-------------|
| file_path | CharField | Path to file in storage |
| client_id | CharField | Client ID (for logging) |
| queued_at | DateTimeField | When queued |
| attempts | IntegerField | Deletion attempt count |
| last_error | TextField | Last error message |

## Performance Notes

- Metadata deletion is instant (milliseconds)
- File cleanup runs in background (seconds to minutes)
- No blocking of user requests
- Failed deletions auto-retry on next cleanup run
- Old failed entries (max_attempts reached) are auto-removed
