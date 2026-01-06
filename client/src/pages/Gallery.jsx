import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { 
  MdSearch, MdOpenInNew, MdContentCopy, MdVisibility, MdDelete, MdFilterList, 
  MdArrowBack, MdArrowForward, MdGridView, MdViewList, MdImage, MdStorage, 
  MdCalendarToday, MdCheckBox, MdCheckBoxOutlineBlank, MdDeleteSweep 
} from 'react-icons/md';
import { useImages, useDeleteImage } from '../hooks/useImages';

const Gallery = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [clientIdFilter, setClientIdFilter] = useState(searchParams.get('client_id') || '');
  const [sortBy, setSortBy] = useState('-uploaded_at');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(!!searchParams.get('client_id'));
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [selectedImages, setSelectedImages] = useState([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query params (memoized)
  const queryParams = useMemo(() => ({
    search: debouncedSearch,
    client_id: clientIdFilter,
    sort_by: sortBy,
    page,
    page_size: pageSize
  }), [debouncedSearch, clientIdFilter, sortBy, page, pageSize]);

  // React Query hooks
  const { data, isLoading: loading } = useImages(queryParams);
  const deleteMutation = useDeleteImage();

  const images = data?.images || [];
  const pagination = data?.pagination || {};
  const uniqueClientIds = [...new Set(images.map(img => img.client_id).filter(Boolean))];

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, clientIdFilter, sortBy]);

  // Clear selections when changing pages or filters
  useEffect(() => {
    setSelectedImages([]);
  }, [page, debouncedSearch, clientIdFilter, sortBy]);

  const copyToClipboard = useCallback((url) => {
    navigator.clipboard.writeText(url);
    setMessage({ type: 'success', text: 'URL copied to clipboard!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  }, []);

  const handleDeleteClick = useCallback((imageId) => {
    setImageToDelete(imageId);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = async () => {
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

  const toggleImageSelection = useCallback((imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  }, [selectedImages.length, images]);

  const handleBulkDelete = useCallback(() => {
    if (selectedImages.length === 0) return;
    setImageToDelete(selectedImages);
    setShowDeleteModal(true);
  }, [selectedImages]);

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
        title={Array.isArray(imageToDelete) ? `Delete ${imageToDelete.length} Images` : "Delete Image"}
        message={Array.isArray(imageToDelete) 
          ? `Are you sure you want to delete ${imageToDelete.length} selected image(s)? This action cannot be undone.`
          : "Are you sure you want to delete this image? This action cannot be undone."
        }
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

            {/* Clear Filters and View Toggle */}
            <div className="flex items-center justify-between mt-4">
              {(searchQuery || clientIdFilter || sortBy !== '-uploaded_at') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setClientIdFilter('');
                    setSortBy('-uploaded_at');
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all filters
                </button>
              )}
              <div className="flex gap-2 ml-auto">
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
          </div>
        )}

        {/* Bulk Actions Bar */}
        {!loading && filteredImages.length > 0 && (
          <div className="flex items-center justify-between bg-card border border-purple-neon/20 rounded-lg p-4 mb-6">
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-neon mb-4"></div>
            <p>Loading images...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            {searchQuery ? 'No images found matching your search' : 'No images uploaded yet'}
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
                  <div className="col-span-2">Client ID</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Upload Date</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-purple-neon/10">
                  {filteredImages.map((image) => (
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
                            alt={image.name || image.original_filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            style={{ contentVisibility: 'auto' }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <MdImage className="text-white text-xl" />
                          </div>
                        </div>
                      </div>

                      {/* Name & Description */}
                      <div className="col-span-3 flex flex-col justify-center">
                        <h3 className="text-text-primary font-semibold text-sm truncate group-hover:text-purple-neon transition-colors">
                          {image.name || image.original_filename}
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

                      {/* Client ID */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-text-primary font-medium text-sm bg-purple-neon/20 px-2 py-1 rounded">
                          {image.client_id || 'N/A'}
                        </span>
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
                      <div className="col-span-2 flex flex-col justify-center">
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
                      <div className="col-span-2 flex items-center justify-end gap-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className={`group relative overflow-hidden rounded-xl bg-card border transition-all neon-glow hover:shadow-neon-pink cursor-pointer ${
                      selectedImages.includes(image.id) 
                        ? 'border-purple-neon ring-2 ring-purple-neon/50' 
                        : 'border-purple-neon/30 hover:border-primary/50'
                    }`}
                    onClick={() => navigate(`/image/${image.id}`)}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.name || image.original_filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        style={{ contentVisibility: 'auto' }}
                      />
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
                    </div>
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
          </>
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
