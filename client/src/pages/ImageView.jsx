import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { MdEdit, MdDelete, MdSave, MdClose, MdArrowBack } from 'react-icons/md';
import { useImage, useUpdateImage, useDeleteImage } from '../hooks/useImages';

const ImageView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // React Query hooks
  const { data: image, isLoading: loading, isError, error } = useImage(id);
  const updateMutation = useUpdateImage();
  const deleteMutation = useDeleteImage();

  // Update local state when image data changes
  useEffect(() => {
    if (image) {
      setName(image.name || image.original_filename || '');
      setDescription(image.description || '');
    }
  }, [image]);

  useEffect(() => {
    if (isError) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load image' });
    }
  }, [isError, error]);

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        name,
        description,
      });
      setMessage({ type: 'success', text: 'Image updated successfully!' });
      setEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      setMessage({ type: 'error', text: 'Failed to update image' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      setMessage({ type: 'success', text: 'Image deleted successfully!' });
      setTimeout(() => navigate('/gallery'), 1500);
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ type: 'error', text: 'Failed to delete image' });
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'URL copied to clipboard!' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-text-secondary text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!image) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-text-secondary text-lg">Image not found</div>
          <button
            onClick={() => navigate('/gallery')}
            className="px-6 py-2 gradient-bg text-white rounded-lg neon-glow"
          >
            Back to Gallery
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Toast 
        type={message.type} 
        message={message.text} 
        onClose={() => setMessage({ type: '', text: '' })}
      />
      <div className="max-w-6xl mx-auto mt-12 md:mt-0">
        <button
          onClick={() => navigate('/gallery')}
          className="flex items-center gap-2 text-text-secondary hover:text-primary mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
        >
          <MdArrowBack className="text-lg sm:text-xl" />
          Back to Gallery
        </button>

        <div className="bg-card rounded-xl border border-purple-neon/30 neon-glow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="gradient-text text-xl sm:text-2xl md:text-3xl font-bold">Image Details</h1>
            <div className="flex gap-1.5 sm:gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="p-2 sm:p-3 rounded-lg gradient-bg text-white neon-glow hover:shadow-neon-pink transition-all"
                    title="Save"
                  >
                    <MdSave className="text-lg sm:text-xl" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setName(image.name || image.original_filename || '');
                      setDescription(image.description || '');
                    }}
                    className="p-2 sm:p-3 rounded-lg bg-error/20 text-error border border-error/50 hover:bg-error/30 transition-all"
                    title="Cancel"
                  >
                    <MdClose className="text-lg sm:text-xl" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 sm:p-3 rounded-lg bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-white transition-all"
                    title="Edit"
                  >
                    <MdEdit className="text-lg sm:text-xl" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 sm:p-3 rounded-lg bg-error/20 text-error border border-error/50 hover:bg-error hover:text-white transition-all"
                    title="Delete"
                  >
                    <MdDelete className="text-lg sm:text-xl" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Image on left */}
            <div className="w-full lg:w-1/2">
              <div
                className="w-full aspect-square bg-cover bg-center rounded-lg border border-purple-neon/30"
                style={{ backgroundImage: `url("${image.url}")` }}
              />
            </div>

            {/* Details on right */}
            <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
              {editing ? (
                <>
                  <div>
                    <label className="block text-text-primary text-xs sm:text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-purple-neon/30 bg-background text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 text-sm sm:text-base"
                      placeholder="Enter image name"
                    />
                  </div>
                  <div>
                    <label className="block text-text-primary text-xs sm:text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-purple-neon/30 bg-background text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 resize-y text-sm sm:text-base"
                      placeholder="Enter description"
                      rows="4"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-text-secondary text-xs sm:text-sm mb-2">Name</label>
                    <p className="text-text-primary text-base sm:text-lg font-medium break-words">
                      {image.name || image.original_filename}
                    </p>
                  </div>
                  <div>
                    <label className="block text-text-secondary text-xs sm:text-sm mb-2">Description</label>
                    <p className="text-text-primary text-sm sm:text-base break-words">
                      {image.description || 'No description provided'}
                    </p>
                  </div>
                </>
              )}

              <div className="border-t border-purple-neon/20 pt-4 sm:pt-6 space-y-2 sm:space-y-3">
                <div className="flex justify-between gap-2">
                  <span className="text-text-secondary text-xs sm:text-sm">Original Filename</span>
                  <span className="text-text-primary text-xs sm:text-sm font-medium truncate max-w-[60%]">{image.original_filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-xs sm:text-sm">File Size</span>
                  <span className="text-text-primary text-xs sm:text-sm font-medium">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-xs sm:text-sm">Uploaded</span>
                  <span className="text-text-primary text-xs sm:text-sm font-medium">
                    {new Date(image.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-xs sm:text-sm">Client ID</span>
                  <span className="text-text-primary text-xs sm:text-sm font-medium break-words">
                    {image.client_id || '-'}
                  </span>
                </div>
              </div>

              <div className="border-t border-purple-neon/20 pt-4 sm:pt-6">
                <label className="block text-text-secondary text-xs sm:text-sm mb-2">Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={image.url}
                    readOnly
                    className="flex-1 px-3 sm:px-4 py-2 rounded-lg border border-purple-neon/30 bg-background text-text-primary text-xs sm:text-sm truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(image.url)}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-white transition-all text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ImageView;
