import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { imageService } from '../services/api';
import { 
  MdSearch, MdFilterList, MdSort, MdDelete, MdPhotoLibrary,
  MdRefresh, MdChevronLeft, MdChevronRight, MdStorage,
  MdSchedule, MdWarning, MdClear
} from 'react-icons/md';

const Clients = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || '-count');
  const [showFilters, setShowFilters] = useState(false);
  
  // Size filter (in MB)
  const [minSize, setMinSize] = useState(searchParams.get('min_size') || '');
  const [maxSize, setMaxSize] = useState(searchParams.get('max_size') || '');
  
  // Image count filter
  const [minCount, setMinCount] = useState(searchParams.get('min_count') || '');
  const [maxCount, setMaxCount] = useState(searchParams.get('max_count') || '');
  
  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, client: null });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await imageService.listClients({
        search: search,
        sort_by: sortBy,
        page: pagination.page,
        page_size: pagination.pageSize,
      });
      
      if (response.success) {
        let filteredClients = response.clients;
        
        // Apply client-side filters for size and count
        if (minSize) {
          const minBytes = parseFloat(minSize) * 1024 * 1024;
          filteredClients = filteredClients.filter(c => c.total_size >= minBytes);
        }
        if (maxSize) {
          const maxBytes = parseFloat(maxSize) * 1024 * 1024;
          filteredClients = filteredClients.filter(c => c.total_size <= maxBytes);
        }
        if (minCount) {
          filteredClients = filteredClients.filter(c => c.image_count >= parseInt(minCount));
        }
        if (maxCount) {
          filteredClients = filteredClients.filter(c => c.image_count <= parseInt(maxCount));
        }
        
        setClients(filteredClients);
        setPagination(prev => ({
          ...prev,
          totalCount: response.pagination.total_count,
          totalPages: response.pagination.total_pages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      showToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, pagination.page, pagination.pageSize, minSize, maxSize, minCount, maxCount]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sortBy !== '-count') params.set('sort_by', sortBy);
    if (minSize) params.set('min_size', minSize);
    if (maxSize) params.set('max_size', maxSize);
    if (minCount) params.set('min_count', minCount);
    if (maxCount) params.set('max_count', maxCount);
    setSearchParams(params);
  }, [search, sortBy, minSize, maxSize, minCount, maxCount, setSearchParams]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearch('');
    setSortBy('-count');
    setMinSize('');
    setMaxSize('');
    setMinCount('');
    setMaxCount('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewImages = (clientId) => {
    navigate(`/clients/${encodeURIComponent(clientId)}/gallery`);
  };

  const handleDeleteClient = (client) => {
    setDeleteModal({ isOpen: true, client });
  };

  const confirmDelete = async () => {
    if (!deleteModal.client) return;
    
    setIsDeleting(true);
    try {
      showToast('Deleting images... This may take a few minutes for large collections.', 'info');
      const response = await imageService.deleteAllByClient(deleteModal.client.client_id);
      if (response.success) {
        showToast(`Successfully deleted ${response.deleted_count} images for ${deleteModal.client.client_id}`, 'success');
        fetchClients();
      } else {
        showToast(response.error || 'Delete failed', 'error');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete client images';
      showToast(errorMsg, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, client: null });
    }
  };

  const hasActiveFilters = search || sortBy !== '-count' || minSize || maxSize || minCount || maxCount;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary neon-text">Client Management</h1>
            <p className="text-text-secondary text-sm mt-1">
              {pagination.totalCount} clients with uploaded images
            </p>
          </div>
          <button
            onClick={fetchClients}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-purple-neon/30 rounded-lg text-text-secondary hover:text-primary hover:border-purple-neon transition-all"
          >
            <MdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl" />
              <input
                type="text"
                placeholder="Search clients by ID..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-card border border-purple-neon/30 rounded-lg text-text-primary placeholder-text-secondary focus:border-purple-neon focus:outline-none transition-all"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <MdSort className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xl" />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="pl-10 pr-8 py-2 bg-card border border-purple-neon/30 rounded-lg text-text-primary focus:border-purple-neon focus:outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="-count">Most Images</option>
                <option value="count">Least Images</option>
                <option value="-total_size">Largest Size</option>
                <option value="total_size">Smallest Size</option>
                <option value="-latest_upload">Recently Active</option>
                <option value="latest_upload">Oldest Activity</option>
                <option value="client_id">Client ID (A-Z)</option>
                <option value="-client_id">Client ID (Z-A)</option>
              </select>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-purple-neon/20 border-purple-neon text-primary'
                  : 'bg-card border-purple-neon/30 text-text-secondary hover:border-purple-neon'
              }`}
            >
              <MdFilterList className="text-lg" />
              Filters
              {hasActiveFilters && (
                <span className="bg-purple-neon text-background text-xs px-1.5 rounded-full">!</span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-error/30 rounded-lg text-error hover:border-error transition-all"
              >
                <MdClear className="text-lg" />
                Clear
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-card border border-purple-neon/20 rounded-lg">
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs">Min Size (MB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={minSize}
                  onChange={(e) => setMinSize(e.target.value)}
                  className="px-3 py-2 bg-background border border-purple-neon/30 rounded text-text-primary focus:border-purple-neon focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs">Max Size (MB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="∞"
                  value={maxSize}
                  onChange={(e) => setMaxSize(e.target.value)}
                  className="px-3 py-2 bg-background border border-purple-neon/30 rounded text-text-primary focus:border-purple-neon focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs">Min Image Count</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minCount}
                  onChange={(e) => setMinCount(e.target.value)}
                  className="px-3 py-2 bg-background border border-purple-neon/30 rounded text-text-primary focus:border-purple-neon focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs">Max Image Count</label>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={maxCount}
                  onChange={(e) => setMaxCount(e.target.value)}
                  className="px-3 py-2 bg-background border border-purple-neon/30 rounded text-text-primary focus:border-purple-neon focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <MdPhotoLibrary className="text-lg" />
              <span className="text-xs">Total Clients</span>
            </div>
            <p className="text-xl font-bold text-primary">{pagination.totalCount}</p>
          </div>
          <div className="bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <MdPhotoLibrary className="text-lg" />
              <span className="text-xs">Total Images</span>
            </div>
            <p className="text-xl font-bold text-yellow-neon">
              {clients.reduce((sum, c) => sum + c.image_count, 0)}
            </p>
          </div>
          <div className="bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <MdStorage className="text-lg" />
              <span className="text-xs">Total Storage</span>
            </div>
            <p className="text-xl font-bold text-pink-neon">
              {formatBytes(clients.reduce((sum, c) => sum + c.total_size, 0))}
            </p>
          </div>
          <div className="bg-card border border-purple-neon/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <MdSchedule className="text-lg" />
              <span className="text-xs">Avg Images/Client</span>
            </div>
            <p className="text-xl font-bold text-green-500">
              {clients.length > 0
                ? Math.round(clients.reduce((sum, c) => sum + c.image_count, 0) / clients.length)
                : 0}
            </p>
          </div>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-neon"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
            <MdPhotoLibrary className="text-6xl mb-4 opacity-50" />
            <p className="text-lg">No clients found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-purple-neon/20 text-primary rounded-lg hover:bg-purple-neon/30 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-neon/30">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Client ID</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Images</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Total Size</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Latest Upload</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">First Upload</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.client_id}
                    className="border-b border-purple-neon/10 hover:bg-purple-neon/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => handleViewImages(client.client_id)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-neon to-pink-neon flex items-center justify-center text-white font-bold text-sm group-hover:shadow-neon-purple transition-all">
                          {client.client_id.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-text-primary font-medium truncate max-w-[200px] group-hover:text-primary transition-colors">
                            {client.client_id}
                          </p>
                          <p className="text-text-secondary text-xs group-hover:text-purple-neon/70 transition-colors">
                            Click to view images
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-neon/20 text-primary rounded-full text-sm font-medium">
                        <MdPhotoLibrary />
                        {client.image_count}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-text-secondary">
                      {formatBytes(client.total_size)}
                    </td>
                    <td className="py-4 px-4 text-center text-text-secondary">
                      {formatDate(client.latest_upload)}
                    </td>
                    <td className="py-4 px-4 text-center text-text-secondary">
                      {formatDate(client.oldest_upload)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewImages(client.client_id)}
                          className="p-2 bg-purple-neon/20 text-primary rounded-lg hover:bg-purple-neon/30 transition-all"
                          title="View Images"
                        >
                          <MdPhotoLibrary className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="p-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-all"
                          title="Delete All Images"
                        >
                          <MdDelete className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-purple-neon/20 pt-4">
            <p className="text-text-secondary text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 bg-card border border-purple-neon/30 rounded-lg text-text-secondary hover:text-primary hover:border-purple-neon disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <MdChevronLeft className="text-xl" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 bg-card border border-purple-neon/30 rounded-lg text-text-secondary hover:text-primary hover:border-purple-neon disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <MdChevronRight className="text-xl" />
              </button>
            </div>
          </div>
        )}

    
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !isDeleting && setDeleteModal({ isOpen: false, client: null })}
        onConfirm={confirmDelete}
        title="Delete All Client Images"
        message={
          deleteModal.client ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-error">
                <MdWarning className="text-xl" />
                This action cannot be undone!
              </p>
              <p>
                Are you sure you want to delete all <strong>{deleteModal.client.image_count}</strong> images 
                for client <strong>{deleteModal.client.client_id}</strong>?
              </p>
              <p className="text-text-secondary text-sm">
                This will free up {formatBytes(deleteModal.client.total_size)} of storage.
              </p>
              {isDeleting && (
                <p className="text-purple-neon text-sm font-semibold flex items-center gap-2 mt-3">
                  <MdRefresh className="animate-spin" />
                  Deleting... This may take a few minutes for large collections.
                </p>
              )}
            </div>
          ) : ''
        }
        confirmText={isDeleting ? "Deleting..." : "Delete All"}
        confirmColor="error"
        disabled={isDeleting}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </Layout>
  );
};

export default Clients;
