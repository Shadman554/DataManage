import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  firstName?: string;
  lastName?: string;
  lastLoginAt?: Date;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export function useAdminAuthProvider() {
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  // Check if admin is logged in
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/admin/profile'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update admin state when profile data changes
  useEffect(() => {
    if (profileData?.admin) {
      setAdmin(profileData.admin);
    } else {
      setAdmin(null);
    }
  }, [profileData]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data) => {
      setAdmin(data.admin);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/profile'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setAdmin(null);
      queryClient.clear();
    },
  });

  const login = async (credentials: { username: string; password: string }) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
  };
}

export { AdminAuthContext, AdminAuthContextType };