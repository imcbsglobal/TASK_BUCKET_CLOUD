import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { 
  MdSearch, MdOpenInNew, MdContentCopy, MdVisibility, MdDelete, 
  MdArrowBack, MdArrowForward, MdSort, MdCalendarToday,
  MdStorage, MdPhotoLibrary, MdPerson, MdImage, MdDownload,
  MdGridView, MdViewList, MdInfo, MdCheckBox, MdCheckBoxOutlineBlank,
  MdSelectAll, MdDeleteSweep
} from 'react-icons/md';
import { useImages, useDeleteImage } from '../hooks/useImages';

const ClientGallery = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-uploaded_at');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);

  // Build query params with client_id from URL
  const queryParams = {
    search: searchQuery,
    client_id: clientId,
    sort_by: sortBy,
    page,
    page_size: pageSize
  };

  // React Query hooks
  const { data, isLoading: loading } = useImages(queryParams);
  const deleteMutation = useDeleteImage();

  const images = data?.images || [];
  const pagination = data?.pagination || {};

  // Calculate stats for this client
  const totalImages = pagination.total_count || 0;
  const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  // Clear selections when changing pages or filters
  useEffect(() => {
    setSelectedImages([]);
  }, [page, searchQuery, sortBy]);

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
      setShowDeleteModal(false);
    }
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedImages.length === 0) return;
    setImageToDelete(selectedImages);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      if (Array.isArray(imageToDelete)) {
        // Bulk delete
        await Promise.all(
          imageToDelete.map(id => deleteMutation.mutateAsync(id))
        );
        setMessage({ 
          type: 'success', 
          text: `${imageToDelete.length} image(s) deleted successfully!` 
        });
        setSelectedImages([]);
      } else {
        // Single delete
        await deleteMutation.mutateAsync(imageToDelete);
        setMessage({ type: 'success', text: 'Image deleted successfully!' });
      }
    } catch (error) {
      console.error('Failed to delete image(s):', error);
      setMessage({ type: 'error', text: 'Failed to delete image(s)' });
    } finally {
      setImageToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        onConfirm={handleBulkDeleteConfirm}
        title={Array.isArray(imageToDelete) ? `Delete ${imageToDelete.length} Images` : "Delete Image"}
        message={Array.isArray(imageToDelete) 
          ? `Are you sure you want to delete ${imageToDelete.length} selected image(s)? This action cannot be undone.`
          : "Are you sure you want to delete this image? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
      />

      <div className="flex flex-col gap-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 bg-card border border-purple-neon/30 rounded-lg text-text-secondary hover:text-primary hover:border-purple-neon transition-all"
            title="Back to Clients"
          >
            <MdArrowBack className="text-xl" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-neon to-pink-neon flex items-center justify-center text-white font-bold neon-glow">
                {clientId.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary neon-text">{clientId}</h1>
                <p className="text-text-secondary text-sm">Client Gallery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <MdPhotoLibrary className="text-lg" />
              <span className="text-xs">Total Images</span>
            </div>
            <p className="text-2xl font-bold text-primary">{totalImages}</p>
          </div>
          <div className="bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <MdStorage className="text-lg" />
              <span className="text-xs">Total Storage</span>
            </div>
            <p className="text-2xl font-bold text-yellow-neon">{formatSize(totalSize)}</p>
          </div>
          <div className="bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <MdCalendarToday className="text-lg" />
              <span className="text-xs">Latest Upload</span>
            </div>
            <p className="text-sm font-medium text-pink-neon">
              {images.length > 0 ? formatDate(images[0].uploaded_at) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl" />
            <input
              type="text"
              placeholder="Search by name, description, filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-purple-neon/30 rounded-lg text-text-primary placeholder-text-secondary focus:border-purple-neon focus:outline-none transition-all"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <MdSort className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-2 bg-card border border-purple-neon/30 rounded-lg text-text-primary focus:border-purple-neon focus:outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="-uploaded_at">Newest First</option>
              <option value="uploaded_at">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="-size">Largest First</option>
              <option value="size">Smallest First</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-all ${
                viewMode === 'list'
                  ? 'bg-purple-neon text-white border-purple-neon shadow-neon-purple'
                  : 'bg-card border-purple-neon/30 text-text-secondary hover:border-purple-neon'
              }`}
              title="List View"
            >
              <MdViewList className="text-xl" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-all ${
                viewMode === 'grid'
                  ? 'bg-purple-neon text-white border-purple-neon shadow-neon-purple'
                  : 'bg-card border-purple-neon/30 text-text-secondary hover:border-purple-neon'
              }`}
              title="Grid View"
            >
              <MdGridView className="text-xl" />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {images.length > 0 && (
          <div className="flex items-center justify-between bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-4 py-2 bg-purple-neon/20 text-primary rounded-lg hover:bg-purple-neon/30 transition-all"
              >
                {selectedImages.length === images.length && images.length > 0 ? (
                  <MdCheckBox className="text-xl text-purple-neon" />
                ) : (
                  <MdCheckBoxOutlineBlank className="text-xl" />
                )}
                <span className="text-sm font-medium">
                  {selectedImages.length === images.length && images.length > 0 ? 'Deselect All' : 'Select All'}
                </span>
              </button>
              {selectedImages.length > 0 && (
                <span className="text-text-secondary text-sm">
                  {selectedImages.length} selected
                </span>
              )}
            </div>
            {selectedImages.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-error/20 text-error rounded-lg hover:bg-error hover:text-white transition-all"
              >
                <MdDeleteSweep className="text-xl" />
                <span className="text-sm font-medium">Delete Selected</span>
              </button>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-neon"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-secondary bg-card border border-purple-neon/20 rounded-lg">
            <MdPhotoLibrary className="text-6xl mb-4 opacity-50" />
            <p className="text-lg">No images found for this client</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-purple-neon/20 text-primary rounded-lg hover:bg-purple-neon/30 transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' ? (
              <div className="bg-card border border-purple-neon/20 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-background/50 border-b border-purple-neon/20 text-text-secondary text-sm font-semibold">
                  <div className="col-span-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.length === images.length && images.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-purple-neon/30 text-purple-neon focus:ring-purple-neon cursor-pointer"
                    />
                    Preview
                  </div>
                  <div className="col-span-3">Name & Description</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-3">Upload Date</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-purple-neon/10">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => navigate(`/image/${image.id}`)}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-purple-neon/5 transition-all group cursor-pointer ${
                        selectedImages.includes(image.id) ? 'bg-purple-neon/10' : ''
                      }`}
                    >
                      {/* Checkbox & Preview */}
                      <div className="col-span-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedImages.includes(image.id)}
                          onChange={() => toggleImageSelection(image.id)}
                          className="w-4 h-4 rounded border-purple-neon/30 text-purple-neon focus:ring-purple-neon cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-background border border-purple-neon/20 group-hover:border-purple-neon transition-all">
                          <img
                            src={image.url}
                            alt={image.name || image.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <MdImage className="text-white text-xl" />
                          </div>
                        </div>
                      </div>

                      {/* Name & Description */}
                      <div className="col-span-3 flex flex-col justify-center">
                        <h3 className="text-text-primary font-semibold text-sm truncate group-hover:text-purple-neon transition-colors">
                          {image.name || image.filename}
                        </h3>
                        {image.description ? (
                          <p className="text-text-secondary text-xs truncate mt-1">
                            {image.description}
                          </p>
                        ) : (
                          <p className="text-text-secondary text-xs italic mt-1">
                            No description
                          </p>
                        )}
                        <p className="text-text-secondary text-xs mt-1 opacity-60">
                          ID: {image.id}
                        </p>
                      </div>

                      {/* Size */}
                      <div className="col-span-2 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <MdStorage className="text-yellow-neon" />
                          <span className="text-text-primary font-medium text-sm">
                            {formatSize(image.size)}
                          </span>
                        </div>
                      </div>

                      {/* Upload Date */}
                      <div className="col-span-3 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <MdCalendarToday className="text-pink-neon" />
                          <div>
                            <p className="text-text-primary text-sm">
                              {new Date(image.uploaded_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-text-secondary text-xs">
                              {new Date(image.uploaded_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/image/${image.id}`);
                          }}
                          className="p-2 bg-purple-neon/20 text-purple-neon rounded-lg hover:bg-purple-neon hover:text-white transition-all"
                          title="View Details"
                        >
                          <MdVisibility className="text-lg" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(image.url);
                          }}
                          className="p-2 bg-yellow-neon/20 text-yellow-neon rounded-lg hover:bg-yellow-neon hover:text-background transition-all"
                          title="Copy URL"
                        >
                          <MdContentCopy className="text-lg" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(image.url, '_blank');
                          }}
                          className="p-2 bg-pink-neon/20 text-pink-neon rounded-lg hover:bg-pink-neon hover:text-white transition-all"
                          title="Open in New Tab"
                        >
                          <MdOpenInNew className="text-lg" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(image.id);
                          }}
                          className="p-2 bg-error/20 text-error rounded-lg hover:bg-error hover:text-white transition-all"
                          title="Delete"
                        >
                          <MdDelete className="text-lg" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`group bg-card rounded-lg border overflow-hidden hover:border-purple-neon hover:shadow-neon-purple transition-all ${
                      selectedImages.includes(image.id) 
                        ? 'border-purple-neon ring-2 ring-purple-neon/50' 
                        : 'border-purple-neon/20'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-background overflow-hidden">
                      {/* Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedImages.includes(image.id)}
                          onChange={() => toggleImageSelection(image.id)}
                          className="w-5 h-5 rounded border-2 border-white bg-black/50 text-purple-neon focus:ring-purple-neon cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <img
                        src={image.url}
                        alt={image.name || image.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/image/${image.id}`)}
                          className="p-2 bg-purple-neon text-white rounded-lg hover:bg-purple-neon/80 transition-all"
                          title="View Details"
                        >
                          <MdVisibility className="text-xl" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(image.url)}
                          className="p-2 bg-yellow-neon text-background rounded-lg hover:bg-yellow-neon/80 transition-all"
                          title="Copy URL"
                        >
                          <MdContentCopy className="text-xl" />
                        </button>
                        <button
                          onClick={() => window.open(image.url, '_blank')}
                          className="p-2 bg-pink-neon text-white rounded-lg hover:bg-pink-neon/80 transition-all"
                          title="Open in New Tab"
                        >
                          <MdOpenInNew className="text-xl" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(image.id)}
                          className="p-2 bg-error text-white rounded-lg hover:bg-error/80 transition-all"
                          title="Delete"
                        >
                          <MdDelete className="text-xl" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-text-primary font-medium text-sm truncate mb-1">
                        {image.name || image.filename}
                      </h3>
                      {image.description && (
                        <p className="text-text-secondary text-xs truncate mb-2">
                          {image.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-text-secondary text-xs">
                        <span>{formatSize(image.size)}</span>
                        <span>{new Date(image.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between border-t border-purple-neon/20 pt-4">
                <p className="text-text-secondary text-sm">
                  Page {pagination.page} of {pagination.total_pages}
                  <span className="ml-2">
                    ({pagination.total_count} images)
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="p-2 bg-card border border-purple-neon/30 rounded-lg text-text-secondary hover:text-primary hover:border-purple-neon disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <MdArrowBack className="text-xl" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.total_pages}
                    className="p-2 bg-card border border-purple-neon/30 rounded-lg text-text-secondary hover:text-primary hover:border-purple-neon disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <MdArrowForward className="text-xl" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ClientGallery;
