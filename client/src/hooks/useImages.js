import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { imageService } from '../services/api';

// Query keys
export const imageKeys = {
  all: ['images'],
  list: () => [...imageKeys.all, 'list'],
  detail: (id) => [...imageKeys.all, 'detail', id],
};

/**
 * Hook to fetch all images
 */
export const useImages = () => {
  return useQuery({
    queryKey: imageKeys.list(),
    queryFn: async () => {
      const data = await imageService.listImages();
      return data.images || [];
    },
  });
};

/**
 * Hook to fetch a single image by ID
 */
export const useImage = (id) => {
  return useQuery({
    queryKey: imageKeys.detail(id),
    queryFn: async () => {
      const data = await imageService.listImages();
      const image = data.images.find(img => img.id === parseInt(id));
      if (!image) {
        throw new Error('Image not found');
      }
      return image;
    },
    enabled: !!id,
  });
};

/**
 * Hook to upload a new image
 */
export const useUploadImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, name, description, clientId }) => {
      return imageService.uploadImage(file, name, description, clientId);
    },
    onSuccess: () => {
      // Invalidate and refetch images list
      queryClient.invalidateQueries({ queryKey: imageKeys.list() });
    },
  });
};

/**
 * Hook to update an image
 */
export const useUpdateImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, description, clientId }) => {
      return imageService.updateImage(id, name, description, clientId);
    },
    onSuccess: (data, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: imageKeys.list() });
      queryClient.invalidateQueries({ queryKey: imageKeys.detail(variables.id) });
    },
  });
};

/**
 * Hook to delete an image
 */
export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      return imageService.deleteImage(id);
    },
    onSuccess: () => {
      // Invalidate images list
      queryClient.invalidateQueries({ queryKey: imageKeys.list() });
    },
  });
};
