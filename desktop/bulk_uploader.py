"""
Bulk Image Uploader - Desktop Application
Upload images from Excel file to Django REST API with concurrent processing
"""

import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import pandas as pd
import requests
import mimetypes
from pathlib import Path
import threading
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from queue import Queue


class BulkImageUploader:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulk Image Uploader")
        self.root.geometry("800x600")
        self.root.resizable(True, True)
        
        # Variables
        self.excel_file_path = tk.StringVar()
        self.api_endpoint = tk.StringVar(value="http://localhost:8000/api/upload/")
        self.file_field_name = tk.StringVar(value="image")
        self.max_workers = tk.IntVar(value=5)
        self.is_uploading = False
        self.is_paused = False
        self.success_count = 0
        self.fail_count = 0
        self.start_time = None
        self.executor = None
        self.log_queue = Queue()
        
        # Setup UI
        self.setup_ui()
        
        # Start log processor
        self.process_log_queue()
        
    def setup_ui(self):
        """Create the main UI layout"""
        # Configure styles
        style = ttk.Style()
        style.theme_use('clam')
        
        # Main container with padding
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title with subtitle
        title_frame = ttk.Frame(main_frame)
        title_frame.grid(row=0, column=0, columnspan=5, pady=(0, 15))
        
        title_label = ttk.Label(
            title_frame, 
            text="Bulk Image Uploader Pro", 
            font=("Segoe UI", 20, "bold"),
            foreground="#2c3e50"
        )
        title_label.pack()
        
        subtitle_label = ttk.Label(
            title_frame,
            text="Concurrent Multi-threaded Upload System",
            font=("Segoe UI", 9),
            foreground="#7f8c8d"
        )
        subtitle_label.pack()
        
        # Configuration Section
        config_frame = ttk.LabelFrame(main_frame, text="Configuration", padding="15")
        config_frame.grid(row=1, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # API Endpoint
        ttk.Label(config_frame, text="API Endpoint:", font=("Arial", 10, "bold")).grid(
            row=0, column=0, sticky=tk.W, pady=5, padx=(0, 10)
        )
        api_entry = ttk.Entry(config_frame, textvariable=self.api_endpoint, width=45)
        api_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), pady=5)

        # File field name
        ttk.Label(config_frame, text="Field Name:", font=("Arial", 10)).grid(
            row=0, column=2, sticky=tk.W, padx=(15, 5), pady=5
        )
        file_field_entry = ttk.Entry(config_frame, textvariable=self.file_field_name, width=10)
        file_field_entry.grid(row=0, column=3, sticky=tk.W, pady=5)
        
        # Max workers (concurrent threads)
        ttk.Label(config_frame, text="Threads:", font=("Arial", 10)).grid(
            row=0, column=4, sticky=tk.W, padx=(15, 5), pady=5
        )
        workers_spinbox = ttk.Spinbox(
            config_frame, 
            from_=1, 
            to=20, 
            textvariable=self.max_workers,
            width=5,
            state='readonly'
        )
        workers_spinbox.grid(row=0, column=5, sticky=tk.W, pady=5)
        
        # File Selection Section
        file_frame = ttk.LabelFrame(main_frame, text="Excel File", padding="15")
        file_frame.grid(row=2, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 15))
        
        file_entry = ttk.Entry(file_frame, textvariable=self.excel_file_path, width=60)
        file_entry.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=5, padx=(0, 10))
        
        select_btn = ttk.Button(
            file_frame, 
            text="📁 Browse", 
            command=self.select_file,
            width=12
        )
        select_btn.grid(row=0, column=1, pady=5)
        
        # Control Buttons
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=3, column=0, columnspan=5, pady=(0, 15))
        
        self.upload_btn = ttk.Button(
            control_frame, 
            text="▶ Start Upload", 
            command=self.start_upload,
            state=tk.DISABLED,
            width=15
        )
        self.upload_btn.pack(side=tk.LEFT, padx=5)
        
        self.pause_btn = ttk.Button(
            control_frame,
            text="⏸ Pause",
            command=self.toggle_pause,
            state=tk.DISABLED,
            width=12
        )
        self.pause_btn.pack(side=tk.LEFT, padx=5)
        
        self.stop_btn = ttk.Button(
            control_frame,
            text="⏹ Stop",
            command=self.stop_upload,
            state=tk.DISABLED,
            width=12
        )
        self.stop_btn.pack(side=tk.LEFT, padx=5)
        
        config_frame.columnconfigure(1, weight=1)
        file_frame.columnconfigure(0, weight=1)
        
        # Progress Section
        progress_frame = ttk.LabelFrame(main_frame, text="Upload Progress", padding="15")
        progress_frame.grid(row=4, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Progress info row
        info_row = ttk.Frame(progress_frame)
        info_row.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 8))
        
        self.progress_label = ttk.Label(
            info_row, 
            text="Ready to upload", 
            font=("Segoe UI", 9)
        )
        self.progress_label.pack(side=tk.LEFT)
        
        self.speed_label = ttk.Label(
            info_row,
            text="",
            font=("Segoe UI", 9),
            foreground="#27ae60"
        )
        self.speed_label.pack(side=tk.RIGHT)
        
        # Progress Bar
        self.progress_bar = ttk.Progressbar(
            progress_frame, 
            mode='determinate', 
            length=800
        )
        self.progress_bar.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 8))
        
        # Stats row
        stats_row = ttk.Frame(progress_frame)
        stats_row.grid(row=2, column=0, sticky=(tk.W, tk.E))
        
        self.status_label = ttk.Label(
            stats_row, 
            text="✓ Success: 0 | ✗ Failed: 0 | ⏱ Time: 0s", 
            font=("Segoe UI", 10, "bold"),
            foreground="#2c3e50"
        )
        self.status_label.pack(side=tk.LEFT)
        
        self.eta_label = ttk.Label(
            stats_row,
            text="",
            font=("Segoe UI", 9),
            foreground="#95a5a6"
        )
        self.eta_label.pack(side=tk.RIGHT)
        
        progress_frame.columnconfigure(0, weight=1)
        
        # Log Section
        log_frame = ttk.LabelFrame(main_frame, text="Upload Log", padding="15")
        log_frame.grid(row=5, column=0, columnspan=5, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 0))
        
        # Scrolled Text for logs
        self.log_text = scrolledtext.ScrolledText(
            log_frame, 
            height=18, 
            width=100,
            font=("Consolas", 9),
            state=tk.DISABLED,
            background="#f8f9fa",
            foreground="#2c3e50"
        )
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure tags for colored logs
        self.log_text.tag_config("INFO", foreground="#3498db")
        self.log_text.tag_config("SUCCESS", foreground="#27ae60", font=("Consolas", 9, "bold"))
        self.log_text.tag_config("ERROR", foreground="#e74c3c", font=("Consolas", 9, "bold"))
        self.log_text.tag_config("WARNING", foreground="#f39c12")
        self.log_text.tag_config("DEBUG", foreground="#95a5a6")
        
        # Configure grid weights for responsive layout
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(5, weight=1)
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
    def select_file(self):
        """Open file dialog to select Excel file"""
        file_path = filedialog.askopenfilename(
            title="Select Excel File",
            filetypes=[("Excel Files", "*.xlsx"), ("All Files", "*.*")]
        )
        
        if file_path:
            self.excel_file_path.set(file_path)
            self.log_message(f"Selected file: {file_path}", "INFO")
            self.upload_btn.config(state=tk.NORMAL)
            
    def log_message(self, message, level="INFO"):
        """Add message to log queue for thread-safe logging"""
        self.log_queue.put((message, level))
    
    def process_log_queue(self):
        """Process log messages from queue (thread-safe)"""
        try:
            while not self.log_queue.empty():
                message, level = self.log_queue.get_nowait()
                timestamp = datetime.now().strftime("%H:%M:%S")
                log_entry = f"[{timestamp}] [{level}] {message}\n"
                
                self.log_text.config(state=tk.NORMAL)
                self.log_text.insert(tk.END, log_entry, level)
                self.log_text.see(tk.END)
                self.log_text.config(state=tk.DISABLED)
        except:
            pass
        
        # Schedule next check
        self.root.after(100, self.process_log_queue)
        
    def start_upload(self):
        """Start the upload process in a separate thread"""
        if self.is_uploading:
            messagebox.showwarning("Upload in Progress", "An upload is already in progress.")
            return
            
        if not self.excel_file_path.get():
            messagebox.showerror("No File Selected", "Please select an Excel file first.")
            return
            
        if not self.api_endpoint.get():
            messagebox.showerror("No API Endpoint", "Please enter the API endpoint URL.")
            return
        
        # Update UI state
        self.upload_btn.config(state=tk.DISABLED, text="⏳ Uploading...")
        self.pause_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.NORMAL)
        self.is_uploading = True
        self.is_paused = False
        self.success_count = 0
        self.fail_count = 0
        self.start_time = time.time()
        
        # Start upload in separate thread to prevent UI freeze
        upload_thread = threading.Thread(target=self.process_upload, daemon=True)
        upload_thread.start()
    
    def toggle_pause(self):
        """Toggle pause state"""
        self.is_paused = not self.is_paused
        if self.is_paused:
            self.pause_btn.config(text="▶ Resume")
            self.log_message("Upload paused by user", "WARNING")
        else:
            self.pause_btn.config(text="⏸ Pause")
            self.log_message("Upload resumed", "INFO")
    
    def stop_upload(self):
        """Stop the upload process"""
        if messagebox.askyesno("Stop Upload", "Are you sure you want to stop the upload?"):
            self.is_uploading = False
            if self.executor:
                self.executor.shutdown(wait=False)
            self.log_message("Upload stopped by user", "WARNING")
            self.reset_upload_state()
        
    def process_upload(self):
        """Main upload processing logic with concurrent execution"""
        try:
            # Read Excel file
            self.log_message("📖 Reading Excel file...", "INFO")
            df = pd.read_excel(self.excel_file_path.get())
            
            # Validate required columns
            required_columns = ['serial_number', 'image_path', 'name', 'description']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                error_msg = f"Missing required columns: {', '.join(missing_columns)}"
                self.log_message(error_msg, "ERROR")
                messagebox.showerror("Invalid Excel File", error_msg)
                self.reset_upload_state()
                return
            
            # Add new columns for results
            df['image_url'] = ''
            df['status'] = ''
            
            total_rows = len(df)
            workers = self.max_workers.get()
            self.log_message(f"🚀 Starting concurrent upload: {total_rows} rows, {workers} threads", "INFO")
            
            # Prepare tasks
            tasks = []
            for index, row in df.iterrows():
                image_path = str(row['image_path']).strip()
                image_path = os.path.expanduser(image_path)
                image_path = os.path.normpath(image_path)
                name = str(row['name']) if pd.notna(row['name']) else ''
                description = str(row['description']) if pd.notna(row['description']) else ''
                serial_number = row['serial_number']
                
                tasks.append({
                    'index': index,
                    'image_path': image_path,
                    'name': name,
                    'description': description,
                    'serial_number': serial_number,
                    'row_num': index + 1
                })
            
            # Process with ThreadPoolExecutor
            completed_count = 0
            self.executor = ThreadPoolExecutor(max_workers=workers)
            
            # Submit all tasks
            future_to_task = {
                self.executor.submit(self.upload_task, task): task 
                for task in tasks
            }
            
            # Process results as they complete
            for future in as_completed(future_to_task):
                if not self.is_uploading:
                    break
                
                # Wait if paused
                while self.is_paused and self.is_uploading:
                    time.sleep(0.1)
                
                task = future_to_task[future]
                try:
                    result = future.result()
                    index = task['index']
                    
                    # Update DataFrame
                    if result['success']:
                        df.at[index, 'image_url'] = result['url']
                        df.at[index, 'status'] = 'success'
                        self.success_count += 1
                    else:
                        df.at[index, 'image_url'] = ''
                        df.at[index, 'status'] = result.get('error', 'unknown error')
                        self.fail_count += 1
                    
                    completed_count += 1
                    
                    # Update UI
                    self.root.after(0, self.update_progress, completed_count, total_rows)
                    self.root.after(0, self.update_status_counts)
                    
                except Exception as e:
                    self.log_message(f"Task execution error: {str(e)}", "ERROR")
            
            # Cleanup executor
            self.executor.shutdown(wait=True)
            self.executor = None
            
            if self.is_uploading:
                # Save updated Excel file
                self.save_updated_excel(df)
                
                # Show completion message
                self.root.after(0, self.show_completion_message)
            
        except Exception as e:
            error_msg = f"Fatal error during processing: {str(e)}"
            self.log_message(error_msg, "ERROR")
            messagebox.showerror("Processing Error", error_msg)
        
        finally:
            self.reset_upload_state()
    
    def upload_task(self, task):
        """Process single upload task (runs in thread pool)"""
        try:
            image_path = task['image_path']
            name = task['name']
            description = task['description']
            serial_number = task['serial_number']
            row_num = task['row_num']
            
            # Check if file exists
            if not os.path.exists(image_path):
                self.log_message(f"Row {row_num}: File not found - {image_path}", "ERROR")
                return {'success': False, 'error': 'file not found'}
            
            # Upload image
            self.log_message(f"Row {row_num}: Uploading {os.path.basename(image_path)}...", "INFO")
            result = self.upload_image(image_path, name, description)
            
            if result['success']:
                self.log_message(f"Row {row_num}: ✓ Success", "SUCCESS")
            else:
                self.log_message(f"Row {row_num}: ✗ Failed - {result.get('error', 'unknown')}", "ERROR")
            
            return result
            
        except Exception as e:
            self.log_message(f"Row {row_num}: Exception - {str(e)}", "ERROR")
            return {'success': False, 'error': str(e)}
    
    def upload_image(self, image_path, name, description):
        """
        Upload image to Django API endpoint
        
        Args:
            image_path: Local path to image file
            name: Name from Excel
            description: Description from Excel
            
        Returns:
            dict: {'success': bool, 'url': str} or {'success': False, 'error': str}
        """
        try:
            # Prepare the multipart form data
            with open(image_path, 'rb') as image_file:
                # Detect mimetype (e.g., 'image/png', 'image/jpeg')
                mimetype = mimetypes.guess_type(image_path)[0] or 'application/octet-stream'
                # Use key 'image' by default; some servers expect that key
                field_name = self.file_field_name.get().strip() or 'image'
                files = {
                    field_name: (os.path.basename(image_path), image_file, mimetype)
                }
                data = {
                    'name': name,
                    'description': description
                }
                
                # Make POST request
                self.log_message(f"POST {self.api_endpoint.get()} file={os.path.basename(image_path)} type={mimetype}", "DEBUG")
                response = requests.post(
                    self.api_endpoint.get(),
                    files=files,
                    data=data,
                    timeout=30
                )
                
                # Check response
                try:
                    result = response.json()
                except Exception:
                    result = None

                if response.status_code == 200 or response.status_code == 201:
                    # If we have JSON, try to get the URL
                    
                    # Handle different response formats
                    if isinstance(result, dict) and 'url' in result:
                        return {'success': True, 'url': result['url']}
                    elif isinstance(result, dict) and 'image' in result and 'url' in result['image']:
                        return {'success': True, 'url': result['image']['url']}
                    else:
                        return {'success': False, 'error': 'URL not found in response'}
                else:
                    # Try to parse structured error message if present
                    err_text = response.text
                    if isinstance(result, dict) and 'error' in result:
                        err_text = result.get('error')
                    self.log_message(f"HTTP {response.status_code}: {err_text}", "DEBUG")
                    return {'success': False, 'error': f'HTTP {response.status_code}: {err_text}'}
                    
        except requests.exceptions.Timeout:
            return {'success': False, 'error': 'Request timeout'}
        except requests.exceptions.ConnectionError:
            return {'success': False, 'error': 'Connection error - check API endpoint'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def save_updated_excel(self, df):
        """Save the updated DataFrame to a new Excel file"""
        try:
            original_path = Path(self.excel_file_path.get())
            new_filename = f"{original_path.stem}_updated{original_path.suffix}"
            new_path = original_path.parent / new_filename
            
            self.log_message(f"Saving updated file to: {new_path}", "INFO")
            df.to_excel(new_path, index=False, engine='openpyxl')
            self.log_message("✓ File saved successfully", "SUCCESS")
            
            self.updated_file_path = str(new_path)
            
        except Exception as e:
            error_msg = f"Failed to save Excel file: {str(e)}"
            self.log_message(error_msg, "ERROR")
            messagebox.showerror("Save Error", error_msg)
    
    def update_progress(self, current, total):
        """Update progress bar and label with speed metrics"""
        progress_percentage = (current / total) * 100
        self.progress_bar['value'] = progress_percentage
        
        # Calculate stats
        elapsed = time.time() - self.start_time if self.start_time else 0
        speed = current / elapsed if elapsed > 0 else 0
        remaining = total - current
        eta = remaining / speed if speed > 0 else 0
        
        # Update labels
        self.progress_label.config(text=f"📤 Uploading: {current} of {total} ({progress_percentage:.1f}%)")
        self.speed_label.config(text=f"⚡ {speed:.2f} img/sec")
        
        if eta > 0:
            eta_mins = int(eta / 60)
            eta_secs = int(eta % 60)
            self.eta_label.config(text=f"ETA: {eta_mins}m {eta_secs}s")
        
    def update_status_counts(self):
        """Update success/fail count label with timing"""
        elapsed = time.time() - self.start_time if self.start_time else 0
        mins = int(elapsed / 60)
        secs = int(elapsed % 60)
        
        self.status_label.config(
            text=f"✓ Success: {self.success_count} | ✗ Failed: {self.fail_count} | ⏱ Time: {mins}m {secs}s"
        )
        
    def show_completion_message(self):
        """Show completion popup with summary"""
        elapsed = time.time() - self.start_time if self.start_time else 0
        mins = int(elapsed / 60)
        secs = int(elapsed % 60)
        total = self.success_count + self.fail_count
        avg_speed = total / elapsed if elapsed > 0 else 0
        
        message = (
            f"🎉 Upload Complete!\n\n"
            f"✓ Successful uploads: {self.success_count}\n"
            f"✗ Failed uploads: {self.fail_count}\n"
            f"⏱ Total time: {mins}m {secs}s\n"
            f"⚡ Average speed: {avg_speed:.2f} img/sec\n\n"
            f"📄 Updated file saved to:\n{getattr(self, 'updated_file_path', 'N/A')}"
        )
        messagebox.showinfo("Upload Complete", message)
        
    def reset_upload_state(self):
        """Reset upload state and enable button"""
        self.is_uploading = False
        self.is_paused = False
        self.upload_btn.config(state=tk.NORMAL, text="▶ Start Upload")
        self.pause_btn.config(state=tk.DISABLED, text="⏸ Pause")
        self.stop_btn.config(state=tk.DISABLED)
        
        if self.start_time:
            elapsed = time.time() - self.start_time
            mins = int(elapsed / 60)
            secs = int(elapsed % 60)
            self.progress_label.config(text=f"✓ Upload completed in {mins}m {secs}s")
        else:
            self.progress_label.config(text="Ready to upload")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = BulkImageUploader(root)
    root.mainloop()


if __name__ == "__main__":
    main()
