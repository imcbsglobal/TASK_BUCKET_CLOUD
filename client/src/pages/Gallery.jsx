import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { MdSearch, MdOpenInNew, MdContentCopy, MdVisibility, MdDelete, MdFilterList, MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useImages, useDeleteImage } from '../hooks/useImages';

const Gallery = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [clientIdFilter, setClientIdFilter] = useState('');
  const [sortBy, setSortBy] = useState('-uploaded_at');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const queryParams = {
    search: searchQuery,
    client_id: clientIdFilter,
    sort_by: sortBy,
    page,
    page_size: pageSize
  };

  // React Query hooks
  const { data, isLoading: loading } = useImages(queryParams);
  const deleteMutation = useDeleteImage();

  const images = data?.images || [];
  const pagination = data?.pagination || {};
  const uniqueClientIds = [...new Set(images.map(img => img.client_id).filter(Boolean))];

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, clientIdFilter, sortBy]);

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

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredImages = images;

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
          <div>
            <h1 className="gradient-text text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Image Gallery
            </h1>
            {pagination.total_count !== undefined && (
              <p className="text-text-secondary text-sm mt-2">
                {pagination.total_count} total images
              </p>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-purple-neon/30 hover:bg-card/90 transition-colors"
          >
            <MdFilterList className="text-xl" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-card rounded-xl border border-purple-neon/30 p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-text-primary mb-2">Search</label>
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl" />
                  <input
                    className="form-input w-full rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-purple-neon/30 bg-background h-11 placeholder:text-text-secondary p-3 pl-10 text-sm"
                    placeholder="Search by name, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Client ID Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-text-primary mb-2">Client ID</label>
                <input
                  className="form-input w-full rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-purple-neon/30 bg-background h-11 placeholder:text-text-secondary p-3 text-sm"
                  placeholder="Filter by client ID..."
                  value={clientIdFilter}
                  onChange={(e) => setClientIdFilter(e.target.value.toUpperCase())}
                />
              </div>

              {/* Sort By */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-text-primary mb-2">Sort By</label>
                <select
                  className="form-select w-full rounded-lg text-text-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-purple-neon/30 bg-background h-11 p-3 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="-uploaded_at">Newest First</option>
                  <option value="uploaded_at">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="-name">Name (Z-A)</option>
                  <option value="-size">Size (Largest)</option>
                  <option value="size">Size (Smallest)</option>
                  <option value="client_id">Client ID (A-Z)</option>
                  <option value="-client_id">Client ID (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || clientIdFilter || sortBy !== '-uploaded_at') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setClientIdFilter('');
                  setSortBy('-uploaded_at');
                }}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

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

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.has_previous}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-purple-neon/30 hover:bg-card/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdArrowBack />
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                Page {pagination.page} of {pagination.total_pages}
              </span>
            </div>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.has_next}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-purple-neon/30 hover:bg-card/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <MdArrowForward />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Gallery;
