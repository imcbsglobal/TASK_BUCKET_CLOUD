import { useState } from 'react';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { MdCloudUpload, MdContentCopy } from 'react-icons/md';
import { useImages, useUploadImage } from '../hooks/useImages';

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // React Query hooks
  const { data: images = [], isLoading: loading } = useImages();
  const uploadMutation = useUploadImage();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // If the user hasn't provided a custom name, use the filename (without extension)
      if (!customName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setCustomName(nameWithoutExt);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        name: customName,
        description: description,
      });
      
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      setSelectedFile(null);
      setCustomName('');
      setDescription('');
      // Clear file input
      document.getElementById('fileInput').value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Upload failed' });
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
      <Toast 
        type={message.type} 
        message={message.text} 
        onClose={() => setMessage({ type: '', text: '' })}
      />
      <div className="mx-auto max-w-4xl mt-12 md:mt-0">
        <div className="flex flex-wrap justify-between gap-3 mb-6 sm:mb-8">
          <h1 className="gradient-text text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Image Management Dashboard
          </h1>
        </div>

    
        <div className="bg-card rounded-xl border border-purple-neon/30 neon-glow p-4 sm:p-6">
          <h2 className="text-text-primary text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4 sm:pb-5">
            Upload a New Image
          </h2>
          
          <div className="flex flex-col p-4 mb-6">
            <div 
              onClick={() => document.getElementById('fileInput').click()}
              className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-primary/50 px-6 py-14 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer"
            >
              {selectedFile ? (
                <>
                  <div
                    className="w-32 h-32 bg-cover bg-center rounded-lg border border-primary/50 neon-glow"
                    style={{ backgroundImage: `url("${URL.createObjectURL(selectedFile)}")` }}
                  />
                  <div className="text-center">
                    <p className="text-text-primary text-lg font-bold leading-tight tracking-[-0.015em]">
                      {selectedFile.name}
                    </p>
                    <p className="text-text-secondary text-sm mt-2">
                      Click to change image
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <MdCloudUpload className="text-primary text-6xl" />
                  <div className="flex max-w-[480px] flex-col items-center gap-2">
                    <p className="text-text-primary text-lg font-bold leading-tight tracking-[-0.015em] text-center">
                      Drag & drop your image here, or browse files
                    </p>
                    <p className="text-text-secondary text-sm font-normal leading-normal text-center">
                      Select a file to upload from your computer.
                    </p>
                  </div>
                </>
              )}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 px-2 sm:px-4">
            <label className="flex flex-col">
              <p className="text-text-primary text-sm sm:text-base font-medium leading-normal pb-2">
                Name (Optional)
              </p>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-purple-neon/30 bg-background h-11 sm:h-12 placeholder:text-text-secondary p-3 text-sm sm:text-base font-normal leading-normal"
                placeholder="Enter a custom name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </label>
            
            <label className="flex flex-col">
              <p className="text-text-primary text-sm sm:text-base font-medium leading-normal pb-2">
                Description (Optional)
              </p>
              <textarea
                className="form-textarea flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-purple-neon/30 bg-background h-20 sm:h-24 placeholder:text-text-secondary p-3 text-sm sm:text-base font-normal leading-normal"
                placeholder="Add a short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>
          
          <div className="px-4 pt-6">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex w-full md:w-auto min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 gradient-bg text-white text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed neon-glow hover:shadow-neon-pink transition-all"
            >
              <span className="truncate">{uploadMutation.isPending ? 'Uploading...' : 'Upload Image'}</span>
            </button>
          </div>
        </div>
    <div className="mb-10">
          <h2 className="text-text-primary text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4 mt-8 sm:mt-10">
            Recent Uploads
          </h2>
          <div className="bg-card rounded-xl border border-purple-neon/30 neon-glow">
            {loading ? (
              <div className="p-6 sm:p-8 text-center text-text-secondary">Loading...</div>
            ) : images.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-text-secondary">No images uploaded yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-text-secondary uppercase bg-background/50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 w-16 sm:w-24" scope="col">Preview</th>
                      <th className="px-3 sm:px-6 py-3" scope="col">Name</th>
                      <th className="px-3 sm:px-6 py-3 hidden md:table-cell" scope="col">Description</th>
                      <th className="px-3 sm:px-6 py-3 hidden sm:table-cell" scope="col">Size</th>
                      <th className="px-3 sm:px-6 py-3 hidden lg:table-cell" scope="col">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-right" scope="col">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.slice(0, 5).map((image) => (
                      <tr key={image.id} className="border-b border-purple-neon/20 hover:bg-primary/5 transition-colors">
                        <td className="px-3 sm:px-6 py-4">
                          <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-md h-10 w-10 sm:h-12 sm:w-12 border border-purple-neon/30"
                            style={{ backgroundImage: `url("${image.url}")` }}
                          />
                        </td>
                        <td className="px-3 sm:px-6 py-4 font-medium text-text-primary text-xs sm:text-sm">
                          <div className="max-w-[120px] sm:max-w-none truncate">
                            {image.name || image.original_filename}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-text-secondary hidden md:table-cell">
                          <div className="max-w-[200px] truncate">
                            {image.description || '-'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-text-secondary text-xs sm:text-sm hidden sm:table-cell">
                          {formatSize(image.size)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-text-secondary text-xs sm:text-sm hidden lg:table-cell">
                          {formatDate(image.uploaded_at)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right">
                          <button
                            onClick={() => copyToClipboard(image.url)}
                            className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg hover:bg-primary/20 text-primary transition-all"
                            title="Copy URL"
                          >
                            <MdContentCopy className="text-lg sm:text-xl" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
