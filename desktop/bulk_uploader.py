"""
Bulk Image Uploader - Desktop Application
Upload images from Excel file to Django REST API with progress tracking
"""

import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import pandas as pd
import requests
from pathlib import Path
import threading
from datetime import datetime


class BulkImageUploader:
    def __init__(self, root):
        self.root = root
        self.root.title("Bulk Image Uploader")
        self.root.geometry("800x600")
        self.root.resizable(False, False)
        
        # Variables
        self.excel_file_path = tk.StringVar()
        self.api_endpoint = tk.StringVar(value="http://localhost:8000/api/upload/")
        self.is_uploading = False
        self.success_count = 0
        self.fail_count = 0
        
        # Setup UI
        self.setup_ui()
        
    def setup_ui(self):
        """Create the main UI layout"""
        # Main container with padding
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="Bulk Image Uploader", 
            font=("Arial", 18, "bold")
        )
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # API Endpoint Section
        ttk.Label(main_frame, text="API Endpoint:", font=("Arial", 10, "bold")).grid(
            row=1, column=0, sticky=tk.W, pady=5
        )
        api_entry = ttk.Entry(main_frame, textvariable=self.api_endpoint, width=60)
        api_entry.grid(row=1, column=1, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        # File Selection Section
        ttk.Label(main_frame, text="Excel File:", font=("Arial", 10, "bold")).grid(
            row=2, column=0, sticky=tk.W, pady=5
        )
        
        file_entry = ttk.Entry(main_frame, textvariable=self.excel_file_path, width=50)
        file_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=5, padx=(0, 5))
        
        select_btn = ttk.Button(
            main_frame, 
            text="Select Excel File", 
            command=self.select_file
        )
        select_btn.grid(row=2, column=2, pady=5)
        
        # Start Upload Button
        self.upload_btn = ttk.Button(
            main_frame, 
            text="Start Upload", 
            command=self.start_upload,
            state=tk.DISABLED
        )
        self.upload_btn.grid(row=3, column=0, columnspan=3, pady=20)
        
        # Progress Section
        progress_frame = ttk.LabelFrame(main_frame, text="Upload Progress", padding="10")
        progress_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        
        # Progress Label
        self.progress_label = ttk.Label(
            progress_frame, 
            text="Ready to upload", 
            font=("Arial", 9)
        )
        self.progress_label.grid(row=0, column=0, sticky=tk.W, pady=(0, 5))
        
        # Progress Bar
        self.progress_bar = ttk.Progressbar(
            progress_frame, 
            mode='determinate', 
            length=700
        )
        self.progress_bar.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 5))
        
        # Status Counts
        self.status_label = ttk.Label(
            progress_frame, 
            text="Success: 0 | Failed: 0", 
            font=("Arial", 9, "bold")
        )
        self.status_label.grid(row=2, column=0, sticky=tk.W)
        
        # Log Section
        log_frame = ttk.LabelFrame(main_frame, text="Upload Log", padding="10")
        log_frame.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        
        # Scrolled Text for logs
        self.log_text = scrolledtext.ScrolledText(
            log_frame, 
            height=15, 
            width=90,
            font=("Consolas", 9),
            state=tk.DISABLED
        )
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
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
        """Add message to log text area"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}\n"
        
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, log_entry)
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)
        
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
        
        # Disable button during upload
        self.upload_btn.config(state=tk.DISABLED)
        self.is_uploading = True
        self.success_count = 0
        self.fail_count = 0
        
        # Start upload in separate thread to prevent UI freeze
        upload_thread = threading.Thread(target=self.process_upload, daemon=True)
        upload_thread.start()
        
    def process_upload(self):
        """Main upload processing logic"""
        try:
            # Read Excel file
            self.log_message("Reading Excel file...", "INFO")
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
            self.log_message(f"Found {total_rows} rows to process", "INFO")
            
            # Process each row
            for index, row in df.iterrows():
                current_row = index + 1
                
                # Update progress
                self.root.after(0, self.update_progress, current_row, total_rows)
                
                # Get data from row
                image_path = str(row['image_path']).strip()
                name = str(row['name']) if pd.notna(row['name']) else ''
                description = str(row['description']) if pd.notna(row['description']) else ''
                serial_number = row['serial_number']
                
                self.log_message(
                    f"Processing row {current_row}/{total_rows} - Serial: {serial_number}", 
                    "INFO"
                )
                
                # Check if image file exists
                if not os.path.exists(image_path):
                    df.at[index, 'status'] = 'file not found'
                    df.at[index, 'image_url'] = ''
                    self.fail_count += 1
                    self.log_message(f"File not found: {image_path}", "ERROR")
                    self.root.after(0, self.update_status_counts)
                    continue
                
                # Upload image
                try:
                    result = self.upload_image(image_path, name, description)
                    
                    if result['success']:
                        df.at[index, 'image_url'] = result['url']
                        df.at[index, 'status'] = 'success'
                        self.success_count += 1
                        self.log_message(
                            f"✓ Uploaded successfully - URL: {result['url']}", 
                            "SUCCESS"
                        )
                    else:
                        df.at[index, 'image_url'] = ''
                        df.at[index, 'status'] = result.get('error', 'unknown error')
                        self.fail_count += 1
                        self.log_message(
                            f"✗ Upload failed: {result.get('error', 'unknown error')}", 
                            "ERROR"
                        )
                        
                except Exception as e:
                    df.at[index, 'image_url'] = ''
                    df.at[index, 'status'] = str(e)
                    self.fail_count += 1
                    self.log_message(f"✗ Exception occurred: {str(e)}", "ERROR")
                
                # Update status counts
                self.root.after(0, self.update_status_counts)
            
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
                files = {
                    'file': (os.path.basename(image_path), image_file, 'image/jpeg')
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
                if response.status_code == 200 or response.status_code == 201:
                    result = response.json()
                    
                    # Handle different response formats
                    if 'url' in result:
                        return {'success': True, 'url': result['url']}
                    elif 'image' in result and 'url' in result['image']:
                        return {'success': True, 'url': result['image']['url']}
                    else:
                        return {'success': False, 'error': 'URL not found in response'}
                else:
                    return {
                        'success': False, 
                        'error': f'HTTP {response.status_code}: {response.text[:100]}'
                    }
                    
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
        """Update progress bar and label"""
        progress_percentage = (current / total) * 100
        self.progress_bar['value'] = progress_percentage
        self.progress_label.config(text=f"Uploading row {current} of {total}")
        
    def update_status_counts(self):
        """Update success/fail count label"""
        self.status_label.config(
            text=f"Success: {self.success_count} | Failed: {self.fail_count}"
        )
        
    def show_completion_message(self):
        """Show completion popup with summary"""
        message = (
            f"Upload Complete!\n\n"
            f"✓ Successful uploads: {self.success_count}\n"
            f"✗ Failed uploads: {self.fail_count}\n\n"
            f"Updated file saved to:\n{getattr(self, 'updated_file_path', 'N/A')}"
        )
        messagebox.showinfo("Upload Complete", message)
        
    def reset_upload_state(self):
        """Reset upload state and enable button"""
        self.is_uploading = False
        self.upload_btn.config(state=tk.NORMAL)
        self.progress_label.config(text="Upload completed")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = BulkImageUploader(root)
    root.mainloop()


if __name__ == "__main__":
    main()
