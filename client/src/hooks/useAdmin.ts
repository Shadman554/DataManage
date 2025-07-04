import { useQuery } from '@tanstack/react-query';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  firstName?: string;
  lastName?: string;
  lastLoginAt?: string;
}

export function useAdmin() {
  const { data: admin, isLoading, error } = useQuery<AdminUser>({
    queryKey: ['/api/admin/profile'],
    queryFn: async () => {
      const response = await fetch('/api/admin/profile', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not logged in
        }
        throw new Error('Failed to fetch admin profile');
      }
      
      const data = await response.json();
      return data.admin;
    },
    retry: false,
  });

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === 'super_admin',
    error,
  };
}

export async function logoutAdmin() {
  const response = await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to logout');
  }
  
  return response.json();
}