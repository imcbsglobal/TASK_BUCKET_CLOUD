"""
Bulk Image Uploader - Desktop Application
Upload images from Excel file to Django REST API with concurrent processing
IMC Business Solutions - Professional Edition
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
        self.root.title("IMC Bulk Image Uploader")
        self.root.geometry("900x700")
        self.root.resizable(True, True)
        
        # Modern Professional Colors
        self.colors = {
            'primary': '#0078D4',
            'secondary': '#106EBE',
            'dark': '#1F1F1F',
            'light_gray': '#8A8A8A',
            'bg': '#FFFFFF',
            'secondary_bg': '#F3F2F1',
            'success': '#107C10',
            'error': '#D13438',
            'warning': '#F7630C',
            'info': '#0078D4'
        }
        
        self.root.configure(bg=self.colors['bg'])
        
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
        self.setup_styles()
        self.setup_ui()

        # Start log processor AFTER UI is ready (give it 200ms to fully initialize)
        self.root.after(200, self.process_log_queue)
        
        # Test logging to verify it works
        self.root.after(300, lambda: self.log_message("Application started successfully", "SUCCESS"))
        self.root.after(400, lambda: self.log_message("Ready to upload images", "INFO"))
        
    def setup_styles(self):
        """Configure custom styles for ttk widgets"""
        style = ttk.Style()
        style.theme_use('clam')
        
        style.configure('TFrame', background=self.colors['bg'])
        style.configure('TLabel', background=self.colors['bg'], foreground=self.colors['dark'])
        style.configure('TLabelframe', background=self.colors['bg'], foreground=self.colors['dark'], borderwidth=1, relief='solid')
        style.configure('TLabelframe.Label', background=self.colors['bg'], foreground=self.colors['dark'], font=('Segoe UI', 10, 'bold'))
        
        style.configure('Primary.TButton',
                       background=self.colors['primary'],
                       foreground='white',
                       borderwidth=0,
                       focuscolor='none',
                       font=('Segoe UI', 10, 'bold'),
                       padding=(20, 10))
        style.map('Primary.TButton',
                 background=[('active', self.colors['secondary']), ('pressed', self.colors['primary'])])
        
        style.configure('Secondary.TButton',
                       background=self.colors['secondary_bg'],
                       foreground=self.colors['dark'],
                       borderwidth=1,
                       focuscolor='none',
                       font=('Segoe UI', 9),
                       padding=(12, 8))
        style.map('Secondary.TButton',
                 background=[('active', '#E1DFDD'), ('pressed', self.colors['secondary_bg'])],
                 foreground=[('active', self.colors['dark'])])
        
        style.configure('TEntry',
                       fieldbackground='white',
                       borderwidth=1,
                       relief='solid')
        
        style.configure('Modern.Horizontal.TProgressbar',
                       troughcolor='#E1E1E1',
                       background=self.colors['primary'],
                       borderwidth=0,
                       thickness=20)
        
    def setup_ui(self):
        """Create the main UI layout"""
        # Create a scrollable area: container -> canvas -> main_frame
        container = ttk.Frame(self.root)
        container.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Vertical scrollbar and canvas for scrollable page
        self.canvas = tk.Canvas(container, bg=self.colors['bg'], highlightthickness=0)
        v_scroll = ttk.Scrollbar(container, orient=tk.VERTICAL, command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=v_scroll.set)

        v_scroll.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.canvas.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Put main_frame inside the canvas so the whole UI can scroll
        main_frame = ttk.Frame(self.canvas, padding="25")
        self.canvas_window = self.canvas.create_window((0, 0), window=main_frame, anchor='nw')
        
        # Header Section
        header_frame = tk.Frame(main_frame, bg=self.colors['bg'])
        header_frame.grid(row=0, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 25))
        
        title_label = tk.Label(
            header_frame,
            text="Bulk Image Uploader",
            font=("Segoe UI", 24, "bold"),
            fg=self.colors['dark'],
            bg=self.colors['bg']
        )
        title_label.pack(anchor='w')
        
        subtitle_label = tk.Label(
            header_frame,
            text="Concurrent multi-threaded upload system for efficient batch processing",
            font=("Segoe UI", 10),
            fg=self.colors['light_gray'],
            bg=self.colors['bg']
        )
        subtitle_label.pack(anchor='w', pady=(5, 0))
        
        # Configuration Section
        config_frame = ttk.LabelFrame(main_frame, text="Configuration", padding="20")
        config_frame.grid(row=1, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 20))
        
        api_row = ttk.Frame(config_frame)
        api_row.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 12))
        
        ttk.Label(api_row, text="API Endpoint:", font=("Segoe UI", 10, "bold")).pack(side=tk.LEFT, padx=(0, 10))
        api_entry = ttk.Entry(api_row, textvariable=self.api_endpoint, width=50, font=("Segoe UI", 9))
        api_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 15))
        
        ttk.Label(api_row, text="Field:", font=("Segoe UI", 9)).pack(side=tk.LEFT, padx=(0, 5))
        file_field_entry = ttk.Entry(api_row, textvariable=self.file_field_name, width=12, font=("Segoe UI", 9))
        file_field_entry.pack(side=tk.LEFT, padx=(0, 15))
        
        ttk.Label(api_row, text="Threads:", font=("Segoe UI", 9)).pack(side=tk.LEFT, padx=(0, 5))
        workers_spinbox = ttk.Spinbox(
            api_row,
            from_=1,
            to=20,
            textvariable=self.max_workers,
            width=6,
            state='readonly',
            font=("Segoe UI", 9)
        )
        workers_spinbox.pack(side=tk.LEFT)
        
        config_frame.columnconfigure(0, weight=1)
        
        # File Selection Section
        file_frame = ttk.LabelFrame(main_frame, text="Excel File Selection", padding="20")
        file_frame.grid(row=2, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 20))
        
        file_row = ttk.Frame(file_frame)
        file_row.pack(fill=tk.X)
        
        file_entry = ttk.Entry(file_row, textvariable=self.excel_file_path, font=("Segoe UI", 9))
        file_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        select_btn = ttk.Button(
            file_row,
            text="Browse",
            command=self.select_file,
            style='Secondary.TButton'
        )
        select_btn.pack(side=tk.LEFT)
        
        # Control Buttons Section
        control_frame = tk.Frame(main_frame, bg=self.colors['bg'])
        control_frame.grid(row=3, column=0, columnspan=5, pady=(0, 25))
        
        self.upload_btn = ttk.Button(
            control_frame,
            text="Start Upload",
            command=self.start_upload,
            state=tk.DISABLED,
            style='Primary.TButton'
        )
        self.upload_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.pause_btn = ttk.Button(
            control_frame,
            text="Pause",
            command=self.toggle_pause,
            state=tk.DISABLED,
            style='Secondary.TButton'
        )
        self.pause_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.stop_btn = ttk.Button(
            control_frame,
            text="Stop",
            command=self.stop_upload,
            state=tk.DISABLED,
            style='Secondary.TButton'
        )
        self.stop_btn.pack(side=tk.LEFT)
        
        # Progress Section
        progress_frame = ttk.LabelFrame(main_frame, text="Upload Progress", padding="20")
        progress_frame.grid(row=4, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(0, 20))
        
        info_row = ttk.Frame(progress_frame)
        info_row.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.progress_label = tk.Label(
            info_row,
            text="Ready to upload",
            font=("Segoe UI", 10),
            fg=self.colors['dark'],
            bg=self.colors['bg']
        )
        self.progress_label.pack(side=tk.LEFT)
        
        self.speed_label = tk.Label(
            info_row,
            text="",
            font=("Segoe UI", 10, "bold"),
            fg=self.colors['primary'],
            bg=self.colors['bg']
        )
        self.speed_label.pack(side=tk.RIGHT)
        
        self.progress_bar = ttk.Progressbar(
            progress_frame,
            mode='determinate',
            length=800,
            style='Modern.Horizontal.TProgressbar'
        )
        self.progress_bar.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        stats_row = ttk.Frame(progress_frame)
        stats_row.grid(row=2, column=0, sticky=(tk.W, tk.E))
        
        self.status_label = tk.Label(
            stats_row,
            text="✓ Success: 0 | ✗ Failed: 0 | ⏱ Time: 0s",
            font=("Segoe UI", 10, "bold"),
            fg=self.colors['dark'],
            bg=self.colors['bg']
        )
        self.status_label.pack(side=tk.LEFT)
        
        self.eta_label = tk.Label(
            stats_row,
            text="",
            font=("Segoe UI", 9),
            fg=self.colors['light_gray'],
            bg=self.colors['bg']
        )
        self.eta_label.pack(side=tk.RIGHT)
        
        progress_frame.columnconfigure(0, weight=1)
        
        # Log Section
        # log_frame = ttk.LabelFrame(main_frame, text="Upload Log", padding="20")
        log_frame = ttk.LabelFrame(main_frame, text="Upload Log", padding=20)   # 20 px on all sides
        log_frame.grid(row=15, column=0, columnspan=5, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 15))
        
        

        # Scrolled Text for logs
        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=15,
            width=100,
            font=("Consolas", 9),
            wrap=tk.WORD,
            background='white',
            foreground=self.colors['dark'],
            borderwidth=1,
            relief='solid'
        )
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure tags for colored logs
        self.log_text.tag_config("INFO", foreground=self.colors['info'])
        self.log_text.tag_config("SUCCESS", foreground=self.colors['success'], font=("Consolas", 9, "bold"))
        self.log_text.tag_config("ERROR", foreground=self.colors['error'], font=("Consolas", 9, "bold"))
        self.log_text.tag_config("WARNING", foreground=self.colors['warning'])
        self.log_text.tag_config("DEBUG", foreground=self.colors['light_gray'])
        
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
        # Footer
        footer_frame = tk.Frame(main_frame, bg=self.colors['bg'])
        footer_frame.grid(row=6, column=0, columnspan=5, sticky=(tk.W, tk.E), pady=(10, 0))
        
        footer_label = tk.Label(
            footer_frame,
            text="Professional Upload System v2.0",
            font=("Segoe UI", 8),
            fg=self.colors['light_gray'],
            bg=self.colors['bg']
        )
        footer_label.pack()
        
        # Configure grid weights for responsive layout
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        # Ensure the canvas container expands with the root
        try:
            container.columnconfigure(0, weight=1)
            container.rowconfigure(0, weight=1)
        except Exception:
            pass
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(5, weight=1)

        # Keep canvas and window size in sync and enable mouse-wheel scrolling
        def _on_frame_configure(event):
            try:
                self.canvas.configure(scrollregion=self.canvas.bbox('all'))
            except Exception:
                pass

        def _on_canvas_configure(event):
            try:
                self.canvas.itemconfig(self.canvas_window, width=event.width)
            except Exception:
                pass

        def _on_mousewheel(event):
            try:
                if event.delta:
                    self.canvas.yview_scroll(-1 * (event.delta // 120), 'units')
                else:
                    if event.num == 4:
                        self.canvas.yview_scroll(-1, 'units')
                    elif event.num == 5:
                        self.canvas.yview_scroll(1, 'units')
            except Exception:
                pass

        main_frame.bind('<Configure>', _on_frame_configure)
        self.canvas.bind('<Configure>', _on_canvas_configure)
        self.canvas.bind_all('<MouseWheel>', _on_mousewheel)
        # Optional Linux bindings for scroll wheel
        self.canvas.bind_all('<Button-4>', _on_mousewheel)
        self.canvas.bind_all('<Button-5>', _on_mousewheel)
        
    def select_file(self):
        """Open file dialog to select Excel file"""
        file_path = filedialog.askopenfilename(
            title="Select Excel File",
            filetypes=[("Excel Files", "*.xlsx *.xls"), ("All Files", "*.*")]
        )
        
        if file_path:
            self.excel_file_path.set(file_path)
            self.log_message(f"Selected file: {file_path}", "INFO")
            self.upload_btn.config(state=tk.NORMAL)
            
    def log_message(self, message, level="INFO"):
        """Add message to log queue for thread-safe logging"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_queue.put((timestamp, message, level))
    
    def process_log_queue(self):
        """Process log messages from queue (thread-safe)"""
        if not hasattr(self, 'log_text') or not self.log_text.winfo_exists():
            # Widget doesn't exist yet, try again later
            self.root.after(100, self.process_log_queue)
            return
            
        try:
            processed = 0
            # Process up to 50 messages per cycle to avoid UI blocking
            while not self.log_queue.empty() and processed < 50:
                try:
                    timestamp, message, level = self.log_queue.get_nowait()
                    log_entry = f"[{timestamp}] [{level}] {message}\n"
                    
                    # Enable widget for editing
                    self.log_text.config(state=tk.NORMAL)
                    
                    # Insert with appropriate tag
                    self.log_text.insert(tk.END, log_entry, level)
                    
                    # Auto-scroll to bottom
                    self.log_text.see(tk.END)
                    
                    # Force update to ensure text appears immediately
                    self.log_text.update_idletasks()
                    
                    # Disable widget to prevent user editing
                    self.log_text.config(state=tk.DISABLED)
                    
                    processed += 1
                    
                except Exception as insert_error:
                    # If insertion fails, just skip this message
                    print(f"Failed to insert log: {insert_error}")
                    break
                    
        except Exception as e:
            # Print error but don't crash
            print(f"Log processing error: {e}")
        
        # Schedule next check (100ms interval)
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
        self.upload_btn.config(state=tk.DISABLED, text="Uploading...")
        self.pause_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.NORMAL)
        self.is_uploading = True
        self.is_paused = False
        self.success_count = 0
        self.fail_count = 0
        self.start_time = time.time()
        
        # Clear log
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete(1.0, tk.END)
        self.log_text.config(state=tk.DISABLED)
        
        # Start upload in separate thread
        upload_thread = threading.Thread(target=self.process_upload, daemon=True)
        upload_thread.start()
    
    def toggle_pause(self):
        """Toggle pause state"""
        self.is_paused = not self.is_paused
        if self.is_paused:
            self.pause_btn.config(text="Resume")
            self.log_message("Upload paused by user", "WARNING")
        else:
            self.pause_btn.config(text="Pause")
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
            self.log_message("Reading Excel file...", "INFO")
            df = pd.read_excel(self.excel_file_path.get())
            
            # Validate required columns
            # Only the serial_number and image_path are required; name and description are optional
            required_columns = ['serial_number', 'image_path']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                error_msg = (
                    f"Missing required columns: {', '.join(missing_columns)}. "
                    "Only 'serial_number' and 'image_path' are required; 'name' and 'description' are optional.")
                self.log_message(error_msg, "ERROR")
                messagebox.showerror("Invalid Excel File", error_msg)
                self.reset_upload_state()
                return
            
            # Add new columns for results
            df['image_url'] = ''
            df['status'] = ''
            
            total_rows = len(df)
            workers = self.max_workers.get()
            self.log_message(f"Starting concurrent upload: {total_rows} rows, {workers} threads", "INFO")
            self.log_message("=" * 80, "DEBUG")
            
            # Prepare tasks
            tasks = []
            for index, row in df.iterrows():
                image_path = str(row['image_path']).strip()
                image_path = os.path.expanduser(image_path)
                image_path = os.path.normpath(image_path)
                # Name & description are optional; use them only if present in the DataFrame
                name = ''
                description = ''
                if 'name' in df.columns and pd.notna(row.get('name')):
                    name = str(row['name'])
                if 'description' in df.columns and pd.notna(row.get('description')):
                    description = str(row['description'])
                serial_number = row['serial_number']
                
                tasks.append({
                    'index': index,
                    'image_path': image_path,
                    'name': name,
                    'description': description,
                    'serial_number': serial_number,
                    'row_num': index + 2  # +2 because Excel row 1 is header
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
                self.log_message("=" * 80, "DEBUG")
                self.log_message("Upload process completed", "INFO")
                
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
                self.log_message(f"Row {row_num}: ✗ File not found - {image_path}", "ERROR")
                return {'success': False, 'error': 'file not found'}
            
            # Upload image
            self.log_message(f"Row {row_num}: Uploading '{os.path.basename(image_path)}'...", "INFO")
            result = self.upload_image(image_path, name, description)
            
            if result['success']:
                self.log_message(f"Row {row_num}: ✓ Upload successful - {result['url']}", "SUCCESS")
            else:
                self.log_message(f"Row {row_num}: ✗ Upload failed - {result.get('error', 'unknown')}", "ERROR")
            
            return result
            
        except Exception as e:
            self.log_message(f"Row {row_num}: ✗ Exception - {str(e)}", "ERROR")
            return {'success': False, 'error': str(e)}
    
    def upload_image(self, image_path, name, description):
        """Upload image to Django API endpoint"""
        try:
            # Prepare the multipart form data
            with open(image_path, 'rb') as image_file:
                # Detect mimetype
                mimetype = mimetypes.guess_type(image_path)[0] or 'application/octet-stream'
                field_name = self.file_field_name.get().strip() or 'image'
                files = {
                    field_name: (os.path.basename(image_path), image_file, mimetype)
                }
                data = {
                    'name': name,
                    'description': description
                }
                
                # Make POST request
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
                    # Handle different response formats
                    if isinstance(result, dict) and 'url' in result:
                        return {'success': True, 'url': result['url']}
                    elif isinstance(result, dict) and 'image' in result and 'url' in result['image']:
                        return {'success': True, 'url': result['image']['url']}
                    else:
                        return {'success': False, 'error': 'URL not found in response'}
                else:
                    err_text = response.text[:200]  # Limit error text length
                    if isinstance(result, dict) and 'error' in result:
                        err_text = result.get('error')
                    return {'success': False, 'error': f'HTTP {response.status_code}: {err_text}'}
                    
        except requests.exceptions.Timeout:
            return {'success': False, 'error': 'Request timeout (30s)'}
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
        self.progress_label.config(text=f"Uploading: {current} of {total} ({progress_percentage:.1f}%)")
        self.speed_label.config(text=f"{speed:.2f} images/sec")
        
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
            f"Upload Complete!\n\n"
            f"✓ Successful uploads: {self.success_count}\n"
            f"✗ Failed uploads: {self.fail_count}\n"
            f"⏱ Total time: {mins}m {secs}s\n"
            f"⚡ Average speed: {avg_speed:.2f} images/sec\n\n"
            f"Updated file saved to:\n{getattr(self, 'updated_file_path', 'N/A')}"
        )
        messagebox.showinfo("Upload Complete", message)
        
    def reset_upload_state(self):
        """Reset upload state and enable button"""
        self.is_uploading = False
        self.is_paused = False
        self.upload_btn.config(state=tk.NORMAL, text="Start Upload")
        self.pause_btn.config(state=tk.DISABLED, text="Pause")
        self.stop_btn.config(state=tk.DISABLED)
        
        if self.start_time:
            elapsed = time.time() - self.start_time
            mins = int(elapsed / 60)
            secs = int(elapsed % 60)
            self.progress_label.config(text=f"Upload completed in {mins}m {secs}s")
        else:
            self.progress_label.config(text="Ready to upload")


# def main():
#     """Main entry point"""
#     root = tk.Tk()

#     # Pre-login: hide the main window until the user authenticates
#     root.withdraw()

#     def show_login_dialog(parent):
#         """Show a modal login dialog and return True if credentials are valid.

#         This dialog uses a hardcoded username/password as requested:
#         username: 'imcbs' and password: 'imcbs'.
#         """
#         login_win = tk.Toplevel(parent)
#         login_win.title("Login")
#         login_win.resizable(False, False)
#         # keep standard decorations; '-toolwindow' hides maximize/restore which may cause issues
#         # login_win.attributes('-toolwindow', True)
#         login_win.transient(parent)
#         login_win.grab_set()

#         # Make sure the dialog is visible and focused
#         try:
#             login_win.lift()
#             login_win.focus_force()
#             login_win.wait_visibility()
#         except Exception:
#             pass

#         width = 380
#         height = 150
#         screen_w = parent.winfo_screenwidth()
#         screen_h = parent.winfo_screenheight()
#         x = int((screen_w / 2) - (width / 2))
#         y = int((screen_h / 2) - (height / 2))
#         login_win.geometry(f"{width}x{height}+{x}+{y}")

#         frame = ttk.Frame(login_win, padding=12)
#         frame.pack(fill=tk.BOTH, expand=True)

#         ttk.Label(frame, text="Username:", font=("Segoe UI", 10)).grid(row=0, column=0, sticky=tk.W, pady=(0, 6))
#         user_var = tk.StringVar(value='')
#         user_entry = ttk.Entry(frame, textvariable=user_var, width=30)
#         user_entry.grid(row=0, column=1, pady=(0, 6))

#         ttk.Label(frame, text="Password:", font=("Segoe UI", 10)).grid(row=1, column=0, sticky=tk.W)
#         pass_var = tk.StringVar(value='')
#         pass_entry = ttk.Entry(frame, textvariable=pass_var, width=30, show='*')
#         pass_entry.grid(row=1, column=1)

#         # Helper to display message and clear password
#         def _fail_message():
#             messagebox.showerror("Login Failed", "Incorrect username or password.")
#             pass_var.set('')
#             pass_entry.focus_set()

#         # Attempt login with hard-coded credentials
#         def _attempt_login():
#             username = user_var.get().strip()
#             password = pass_var.get()
#             if username == 'imcbs' and password == 'imcbs':
#                 login_win.user_authenticated = True
#                 login_win.destroy()
#             else:
#                 login_win.user_authenticated = False
#                 _fail_message()

#         # Cancel/close behavior
#         def _cancel():
#             login_win.user_authenticated = False
#             login_win.destroy()

#         # Handle window close button as cancel
#         login_win.protocol("WM_DELETE_WINDOW", _cancel)

#         # Buttons
#         btn_frame = ttk.Frame(frame)
#         btn_frame.grid(row=2, column=0, columnspan=2, pady=(12, 0))
#         login_btn = ttk.Button(btn_frame, text="Login", command=_attempt_login, style='Primary.TButton')
#         login_btn.pack(side=tk.LEFT, padx=(0, 8))
#         cancel_btn = ttk.Button(btn_frame, text="Cancel", command=_cancel, style='Secondary.TButton')
#         cancel_btn.pack(side=tk.LEFT)

#         # Bind Enter to login
#         login_win.bind('<Return>', lambda e: _attempt_login())

#         # Focus username first
#         user_entry.focus_set()

#         print("Login dialog shown")
#         parent.wait_window(login_win)
#         result = getattr(login_win, 'user_authenticated', False)
#         print(f"Login dialog closed; authenticated={result}")
#         return result

#     # Show the login dialog, and if successful show the app else exit
#     if not show_login_dialog(root):
#         root.destroy()
#         return

#     # Show the main window now that the user is authenticated
#     root.deiconify()
#     app = BulkImageUploader(root)
#     root.mainloop()


# if __name__ == "__main__":
#     main()

def show_login_dialog():
    """Show a modal login dialog and return True if credentials are valid.
    
    This dialog uses a hardcoded username/password:
    username: 'imcbs' and password: 'imcbs'.
    """
    login_root = tk.Tk()
    login_root.title("IMC Bulk Image Uploader - Login")
    login_root.resizable(False, False)
    
    width = 400
    height = 180
    screen_w = login_root.winfo_screenwidth()
    screen_h = login_root.winfo_screenheight()
    x = int((screen_w / 2) - (width / 2))
    y = int((screen_h / 2) - (height / 2))
    login_root.geometry(f"{width}x{height}+{x}+{y}")
    
    # Style the login window
    login_root.configure(bg='#FFFFFF')
    
    # Configure styles
    style = ttk.Style()
    style.theme_use('clam')
    style.configure('Login.TFrame', background='#FFFFFF')
    style.configure('Login.TLabel', background='#FFFFFF', foreground='#1F1F1F', font=('Segoe UI', 10))
    style.configure('Login.TButton', font=('Segoe UI', 10))
    
    frame = ttk.Frame(login_root, padding=20, style='Login.TFrame')
    frame.pack(fill=tk.BOTH, expand=True)
    
    # Title
    title_label = tk.Label(
        frame,
        text="Please Login",
        font=("Segoe UI", 14, "bold"),
        fg='#0078D4',
        bg='#FFFFFF'
    )
    title_label.grid(row=0, column=0, columnspan=2, pady=(0, 15))
    
    # Username
    ttk.Label(frame, text="Username:", style='Login.TLabel').grid(row=1, column=0, sticky=tk.W, pady=(0, 10), padx=(0, 10))
    user_var = tk.StringVar(value='')
    user_entry = ttk.Entry(frame, textvariable=user_var, width=25, font=("Segoe UI", 10))
    user_entry.grid(row=1, column=1, pady=(0, 10), sticky=tk.EW)
    
    # Password
    ttk.Label(frame, text="Password:", style='Login.TLabel').grid(row=2, column=0, sticky=tk.W, padx=(0, 10))
    pass_var = tk.StringVar(value='')
    pass_entry = ttk.Entry(frame, textvariable=pass_var, width=25, show='●', font=("Segoe UI", 10))
    pass_entry.grid(row=2, column=1, sticky=tk.EW)
    
    authenticated = [False]  # Use list to allow modification in nested function
    
    def attempt_login():
        username = user_var.get().strip()
        password = pass_var.get()
        if username == 'imcbs' and password == 'imcbs':
            authenticated[0] = True
            login_root.destroy()
        else:
            messagebox.showerror("Login Failed", "Incorrect username or password.", parent=login_root)
            pass_var.set('')
            pass_entry.focus_set()
    
    def cancel_login():
        authenticated[0] = False
        login_root.destroy()
    
    # Handle window close
    login_root.protocol("WM_DELETE_WINDOW", cancel_login)
    
    # Buttons
    btn_frame = ttk.Frame(frame, style='Login.TFrame')
    btn_frame.grid(row=3, column=0, columnspan=2, pady=(20, 0))
    
    login_btn = ttk.Button(btn_frame, text="Login", command=attempt_login)
    login_btn.pack(side=tk.LEFT, padx=(0, 10))
    
    cancel_btn = ttk.Button(btn_frame, text="Cancel", command=cancel_login)
    cancel_btn.pack(side=tk.LEFT)
    
    # Bind Enter key
    login_root.bind('<Return>', lambda e: attempt_login())
    
    # Configure grid weights
    frame.columnconfigure(1, weight=1)
    
    # Focus username
    user_entry.focus_set()
    
    # Start the login window event loop
    login_root.mainloop()
    
    return authenticated[0]


def main():
    """Main entry point"""
    # Show login dialog first
    if not show_login_dialog():
        return  # User cancelled or failed login
    
    # Create main application window
    root = tk.Tk()
    app = BulkImageUploader(root)
    root.mainloop()


if __name__ == "__main__":
    main()
