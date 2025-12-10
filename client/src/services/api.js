import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key':'imcbs-secret-key-2025' ,  
  },
});

export const imageService = {
  // Upload a single image
  uploadImage: async (file, name = '', description = '') => {
    const formData = new FormData();
    formData.append('image', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);

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
  updateImage: async (imageId, name, description) => {
    const response = await api.put(`/update/${imageId}/`, {
      name,
      description,
    });
    return response.data;
  },

  // Delete an image
  deleteImage: async (imageId) => {
    const response = await api.delete(`/delete/${imageId}/`);
    return response.data;
  },
};

export default api;
