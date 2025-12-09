# 🚀 Concurrent Upload Guide

## New Features

### ⚡ **Concurrent Multi-threaded Upload**
- Uploads multiple images **simultaneously** using ThreadPoolExecutor
- **5 threads by default** (configurable 1-20)
- **Dramatically faster** - upload 100 images in minutes instead of hours

### 📊 **Real-time Metrics**
- **Speed tracking**: Images per second
- **ETA calculation**: Estimated time remaining
- **Elapsed time**: Total time spent
- **Live progress**: See uploads happening in real-time

### 🎛️ **Enhanced Controls**
- **Pause/Resume**: Pause uploads and resume when ready
- **Stop**: Cancel upload process immediately
- **Thread control**: Adjust concurrent workers (1-20)

### 🎨 **Professional UI**
- Modern Segoe UI fonts
- Color-coded logs (Info=Blue, Success=Green, Error=Red)
- Real-time stats display
- Responsive layout

## How to Use

### 1. **Configure Settings**
```
API Endpoint: http://localhost:8000/api/upload/
Field Name: image
Threads: 5 (increase to 10-15 for faster uploads)
```

### 2. **Select Excel File**
Click "📁 Browse" and choose your Excel file with columns:
- `serial_number`
- `image_path`
- `name`
- `description`

### 3. **Start Upload**
Click "▶ Start Upload" - watch the magic happen!

### 4. **Monitor Progress**
- Progress bar shows completion %
- Speed shows images/second
- ETA shows time remaining
- Log shows each upload status

## Performance Tips

### 🔥 **Speed Optimization**

**For Local Network/Fast Connection:**
- Set threads to **10-15**
- Expected speed: 10-20 images/sec

**For Remote API/Slow Connection:**
- Set threads to **5-8**
- Expected speed: 2-5 images/sec

**For Very Fast Server:**
- Set threads to **15-20**
- Expected speed: 20+ images/sec

### ⚠️ **Important Notes**

1. **Don't set threads too high** - your network/API might get overwhelmed
2. **Start with 5 threads** and increase gradually
3. **Monitor error rates** - if many fail, reduce threads
4. **Use Pause** if you need to check something
5. **Larger images** = slower uploads (consider resizing)

## Comparison

### Before (Sequential)
```
100 images × 3 seconds each = 300 seconds (5 minutes)
```

### After (5 threads)
```
100 images ÷ 5 threads × 3 seconds = 60 seconds (1 minute)
```

### After (10 threads)
```
100 images ÷ 10 threads × 3 seconds = 30 seconds
```

## Troubleshooting

### ❌ Too many errors?
- **Reduce threads** to 2-3
- Check your network connection
- Verify API endpoint is correct

### ⏰ Slow upload speed?
- **Increase threads** to 10-15
- Check image file sizes (compress large images)
- Verify server can handle load

### 🔄 Want to retry failed uploads?
- Open the generated `*_updated.xlsx` file
- Filter by `status != 'success'`
- Create new Excel with failed rows
- Run again!

## Example Session

```
[10:30:15] [INFO] 📖 Reading Excel file...
[10:30:15] [INFO] 🚀 Starting concurrent upload: 100 rows, 5 threads
[10:30:16] [INFO] Row 1: Uploading product1.jpg...
[10:30:16] [INFO] Row 2: Uploading product2.jpg...
[10:30:16] [INFO] Row 3: Uploading product3.jpg...
[10:30:16] [INFO] Row 4: Uploading product4.jpg...
[10:30:16] [INFO] Row 5: Uploading product5.jpg...
[10:30:17] [SUCCESS] Row 1: ✓ Success
[10:30:17] [SUCCESS] Row 2: ✓ Success
[10:30:17] [INFO] Row 6: Uploading product6.jpg...
...
[10:31:45] [INFO] ✓ File saved successfully

Progress: 100/100 (100.0%)
Speed: 8.5 img/sec
Success: 98 | Failed: 2 | Time: 1m 30s
```

## Features Summary

✅ Concurrent multi-threaded uploads  
✅ Real-time speed and ETA tracking  
✅ Pause/Resume/Stop controls  
✅ Configurable thread count (1-20)  
✅ Color-coded logging  
✅ Professional modern UI  
✅ Thread-safe queue-based logging  
✅ Automatic error handling  
✅ Results saved to Excel  

---

**Enjoy blazing fast uploads! 🚀**
