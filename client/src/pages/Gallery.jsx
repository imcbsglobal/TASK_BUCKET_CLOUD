import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { MdSearch, MdOpenInNew, MdContentCopy, MdVisibility, MdDelete } from 'react-icons/md';
import { useImages, useDeleteImage } from '../hooks/useImages';

const Gallery = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // React Query hooks
  const { data: images = [], isLoading: loading } = useImages();
  const deleteMutation = useDeleteImage();

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'URL copied to clipboard!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handleDeleteClick = (imageId) => {
    setImageToDelete(imageId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      await deleteMutation.mutateAsync(imageToDelete);
      setMessage({ type: 'success', text: 'Image deleted successfully!' });
    } catch (error) {
      console.error('Failed to delete image:', error);
      setMessage({ type: 'error', text: 'Failed to delete image' });
    } finally {
      setImageToDelete(null);
    }
  };

  const filteredImages = images.filter((image) => {
    const query = searchQuery.toLowerCase();
    return (
      (image.name && image.name.toLowerCase().includes(query)) ||
      (image.original_filename && image.original_filename.toLowerCase().includes(query)) ||
      (image.description && image.description.toLowerCase().includes(query))
    );
  });

  return (
    <Layout>
      <Toast 
        type={message.type} 
        message={message.text} 
        onClose={() => setMessage({ type: '', text: '' })}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <div className="mx-auto max-w-7xl mt-12 md:mt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <h1 className="gradient-text text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Image Gallery
          </h1>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl sm:text-2xl" />
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-purple-neon/30 bg-card h-10 sm:h-11 placeholder:text-text-secondary p-3 text-sm sm:text-base font-normal leading-normal pl-10 sm:pl-11"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-secondary">
            Loading images...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            {searchQuery ? 'No images found matching your search' : 'No images uploaded yet'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl bg-card border border-purple-neon/30 hover:border-primary/50 transition-all neon-glow hover:shadow-neon-pink cursor-pointer"
                onClick={() => navigate(`/image/${image.id}`)}
              >
                <div
                  className="aspect-square bg-cover bg-center"
                  style={{ backgroundImage: `url("${image.url}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90"></div>
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4">
                  <p className="text-text-primary text-xs sm:text-sm font-medium leading-tight truncate">
                    {image.name || image.original_filename}
                  </p>
                  {image.description && (
                    <p className="text-text-secondary text-[10px] sm:text-xs mt-1 truncate hidden sm:block">
                      {image.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 sm:gap-2 mt-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/image/${image.id}`);
                      }}
                      className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-primary/30 hover:bg-primary text-white backdrop-blur-sm transition-all"
                      title="View Details"
                    >
                      <MdVisibility className="text-base sm:text-xl" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(image.url, '_blank');
                      }}
                      className="hidden sm:inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-primary/30 hover:bg-primary text-white backdrop-blur-sm transition-all"
                      title="Open in New Tab"
                    >
                      <MdOpenInNew className="text-base sm:text-xl" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(image.url);
                      }}
                      className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-primary/30 hover:bg-primary text-white backdrop-blur-sm transition-all"
                      title="Copy URL"
                    >
                      <MdContentCopy className="text-base sm:text-xl" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(image.id);
                      }}
                      className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-red-500/30 hover:bg-red-500 text-white backdrop-blur-sm transition-all"
                      title="Delete Image"
                    >
                      <MdDelete className="text-base sm:text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Gallery;
