import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { CollectionName, CollectionData } from '@shared/schema';

export function useCollection<T extends keyof CollectionData>(collection: T) {
  return useQuery<CollectionData[T]>({
    queryKey: [`/api/collections/${collection}`],
  });
}

export function useDocument<T>(collection: CollectionName, id: string) {
  return useQuery<T>({
    queryKey: [`/api/collections/${collection}`, id],
    enabled: !!id,
  });
}

export function useCreateDocument(collection: CollectionName) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/collections/${collection}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/collections/${collection}`],
      });
    },
  });
}

export function useUpdateDocument(collection: CollectionName) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/collections/${collection}/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/collections/${collection}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/collections/${collection}`, id],
      });
    },
  });
}

export function useDeleteDocument(collection: CollectionName) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/collections/${collection}/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/collections/${collection}`],
      });
    },
  });
}

export function useSearchCollection<T>(collection: CollectionName) {
  return useMutation({
    mutationFn: async ({ query, field }: { query: string; field?: string }) => {
      const params = new URLSearchParams();
      params.append('q', query);
      if (field) params.append('field', field);
      
      const response = await apiRequest('GET', `/api/search/${collection}?${params}`);
      return response.json() as Promise<T[]>;
    },
  });
}

export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
  });
}

export function useBulkOperation(collection: CollectionName) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ action, ids, data }: { action: string; ids: string[]; data?: any }) => {
      const response = await apiRequest('POST', `/api/collections/${collection}/bulk`, {
        action,
        ids,
        data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/collections/${collection}`],
      });
    },
  });
}
