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


  // List all images
  listImages: async () => {
    const response = await api.get('/list/');
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

  // Validate client ID
  validateClientId: async (clientId) => {
    const response = await api.post('/validate-client/', {
      client_id: clientId,
    });
    return response.data;
  },
};

export default api;
