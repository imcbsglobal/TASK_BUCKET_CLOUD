import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_KEY = import.meta.env.VITE_API_KEY || 'imcbs-secret-key-2025';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach API key header globally (axios common headers)
if (API_KEY) {
  api.defaults.headers.common['X-API-Key'] = API_KEY;
} else {
  // If missing, warn (do not print the key itself to logs)
  console.warn('VITE_API_KEY is not set; requests will be sent without API key header');
}

export const imageService = {
  // Upload a single image
  uploadImage: async (file, name = '', description = '', clientId = '') => {
    const formData = new FormData();
    formData.append('image', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    if (clientId) formData.append('client_id', clientId);

    const response = await api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },


  // List all images with optional filters
  listImages: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.client_id) queryParams.append('client_id', params.client_id);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    
    const url = `/list/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/stats/');
    return response.data;
  },

  // Update image metadata
  updateImage: async (imageId, name, description, clientId = undefined) => {
    const body = { name, description };
    if (typeof clientId !== 'undefined') body.client_id = clientId;
    const response = await api.put(`/update/${imageId}/`, body);
    return response.data;
  },

  // Delete an image
  deleteImage: async (imageId) => {
    const response = await api.delete(`/delete/${imageId}/`);
    return response.data;
  },

  // Bulk delete multiple images by IDs
  bulkDeleteImages: async (imageIds) => {
    const response = await api.post('/bulk-delete/', {
      image_ids: imageIds,
    });
    return response.data;
  },

  // Delete all images for a client
  deleteAllByClient: async (clientId) => {
    const response = await api.delete(`/clients/${encodeURIComponent(clientId)}/delete-all/`, {
      timeout: 300000, // 5 minutes timeout for bulk operations
    });
    return response.data;
  },

  // List all clients with counts
  listClients: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    
    const url = `/clients/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Validate client ID
  validateClientId: async (clientId) => {
    const response = await api.post('/validate-client/', {
      client_id: clientId,
    });
    return response.data;
  },
};

export default api;
