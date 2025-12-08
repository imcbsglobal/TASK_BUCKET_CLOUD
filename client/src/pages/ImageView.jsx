import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { imageService } from '../services/api';
import { MdEdit, MdDelete, MdSave, MdClose, MdArrowBack } from 'react-icons/md';

const ImageView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchImage();
  }, [id]);

  const fetchImage = async () => {
    setLoading(true);
    try {
      const data = await imageService.listImages();
      const foundImage = data.images.find(img => img.id === parseInt(id));
      if (foundImage) {
        setImage(foundImage);
        // Use original_filename as fallback for name when not provided
        setName(foundImage.name || foundImage.original_filename || '');
        setDescription(foundImage.description || '');
      } else {
        setMessage({ type: 'error', text: 'Image not found' });
      }
    } catch (error) {
      console.error('Failed to fetch image:', error);
      setMessage({ type: 'error', text: 'Failed to load image' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await imageService.updateImage(id, name, description);
      setMessage({ type: 'success', text: 'Image updated successfully!' });
      setEditing(false);
      fetchImage();
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
      await imageService.deleteImage(id);
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
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/gallery')}
          className="flex items-center gap-2 text-text-secondary hover:text-primary mb-6 transition-colors"
        >
          <MdArrowBack className="text-xl" />
          Back to Gallery
        </button>

        <div className="bg-card rounded-xl border border-purple-neon/30 neon-glow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="gradient-text text-3xl font-bold">Image Details</h1>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="p-3 rounded-lg gradient-bg text-white neon-glow hover:shadow-neon-pink transition-all"
                    title="Save"
                  >
                    <MdSave className="text-xl" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setName(image.name || image.original_filename || '');
                      setDescription(image.description || '');
                    }}
                    className="p-3 rounded-lg bg-error/20 text-error border border-error/50 hover:bg-error/30 transition-all"
                    title="Cancel"
                  >
                    <MdClose className="text-xl" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-3 rounded-lg bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-white transition-all"
                    title="Edit"
                  >
                    <MdEdit className="text-xl" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-3 rounded-lg bg-error/20 text-error border border-error/50 hover:bg-error hover:text-white transition-all"
                    title="Delete"
                  >
                    <MdDelete className="text-xl" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Image on left */}
            <div className="lg:w-1/2">
              <div
                className="w-full aspect-square bg-cover bg-center rounded-lg border border-purple-neon/30"
                style={{ backgroundImage: `url("${image.url}")` }}
              />
            </div>

            {/* Details on right */}
            <div className="lg:w-1/2 space-y-6">
              {editing ? (
                <>
                  <div>
                    <label className="block text-text-primary text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-purple-neon/30 bg-background text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter image name"
                    />
                  </div>
                  <div>
                    <label className="block text-text-primary text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-purple-neon/30 bg-background text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 resize-y"
                      placeholder="Enter description"
                      rows="4"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Name</label>
                    <p className="text-text-primary text-lg font-medium">
                      {image.name || image.original_filename}
                    </p>
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Description</label>
                    <p className="text-text-primary">
                      {image.description || 'No description provided'}
                    </p>
                  </div>
                </>
              )}

              <div className="border-t border-purple-neon/20 pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary text-sm">Original Filename</span>
                  <span className="text-text-primary text-sm font-medium">{image.original_filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-sm">File Size</span>
                  <span className="text-text-primary text-sm font-medium">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-sm">Uploaded</span>
                  <span className="text-text-primary text-sm font-medium">
                    {new Date(image.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-purple-neon/20 pt-6">
                <label className="block text-text-secondary text-sm mb-2">Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={image.url}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-lg border border-purple-neon/30 bg-background text-text-primary text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(image.url)}
                    className="px-4 py-2 rounded-lg bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-white transition-all"
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
