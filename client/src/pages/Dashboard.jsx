import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { imageService } from '../services/api';

const Dashboard = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await imageService.listImages();
      setImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      setMessage({ type: 'error', text: 'Failed to load images' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await imageService.uploadImage(selectedFile, customName, description);
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      setSelectedFile(null);
      setCustomName('');
      setDescription('');
      // Clear file input
      document.getElementById('fileInput').value = '';
      // Refresh images list
      fetchImages();
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'URL copied to clipboard!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap justify-between gap-3 mb-8">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Image Management Dashboard
          </h1>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">
            Recent Uploads
          </h2>
          <div className="overflow-x-auto bg-white dark:bg-[#1c2127] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            {loading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading...</div>
            ) : images.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">No images uploaded yet</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 w-24" scope="col">Preview</th>
                    <th className="px-6 py-3" scope="col">Name</th>
                    <th className="px-6 py-3" scope="col">Description</th>
                    <th className="px-6 py-3" scope="col">Size</th>
                    <th className="px-6 py-3" scope="col">Date</th>
                    <th className="px-6 py-3 text-right" scope="col">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {images.slice(0, 5).map((image) => (
                    <tr key={image.id} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="px-6 py-4">
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-md h-12 w-12"
                          style={{ backgroundImage: `url("${image.url}")` }}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {image.name || image.original_filename}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {image.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {formatSize(image.size)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {formatDate(image.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => copyToClipboard(image.url)}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                        >
                          <span className="material-symbols-outlined !text-xl">content_copy</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c2127] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-5">
            Upload a New Image
          </h2>
          
          <div className="flex flex-col p-4 mb-6">
            <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-[#3b4754] px-6 py-14">
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 !text-5xl">
                cloud_upload
              </span>
              <div className="flex max-w-[480px] flex-col items-center gap-2">
                <p className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">
                  Drag & drop your image here, or browse files
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal text-center">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Select a file to upload from your computer.'}
                </p>
              </div>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('fileInput').click()}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-slate-200 dark:bg-[#283039] text-slate-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em]"
              >
                <span className="truncate">Browse files</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
            <label className="flex flex-col">
              <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">
                Custom Name (Optional)
              </p>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[var(--gradient-start)]/50 border border-slate-300 dark:border-[#3b4754] bg-background-light dark:bg-[#101922] h-12 placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] p-3 text-base font-normal leading-normal"
                placeholder="Enter a custom name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </label>
            
            <label className="flex flex-col md:col-span-2">
              <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">
                Description (Optional)
              </p>
              <textarea
                className="form-textarea flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[var(--gradient-start)]/50 border border-slate-300 dark:border-[#3b4754] bg-background-light dark:bg-[#101922] h-24 placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] p-3 text-base font-normal leading-normal"
                placeholder="Add a short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>
          
          <div className="px-4 pt-6">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex w-full md:w-auto min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">{uploading ? 'Uploading...' : 'Upload Image'}</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
