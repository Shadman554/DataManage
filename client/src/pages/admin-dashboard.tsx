import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import { useAdmin, logoutAdmin } from '@/hooks/useAdmin';
import { 
  Users, 
  Activity, 
  BarChart3,
  Shield,
  Database,
  LogOut
} from 'lucide-react';

// Types for admin data
interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  documentTitle: string;
  adminId: string;
  adminUsername: string;
  createdAt: string;
}

interface AdminStats {
  [adminId: string]: {
    create: number;
    update: number;
    delete: number;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { admin, isSuperAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out.",
        variant: "destructive",
      });
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Queries (only for super admin in some cases)
  const { data: admins = [], isLoading: adminsLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/all', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admins');
      return response.json();
    },
    enabled: isSuperAdmin, // Only fetch if super admin
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: activityLogs = [], isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/admin/activity'],
    queryFn: async () => {
      const url = '/api/admin/activity?limit=50';
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
  });

  // Calculate total actions for an admin
  const getTotalActions = (adminId: string) => {
    const adminStats = stats[adminId];
    if (!adminStats) return 0;
    return adminStats.create + adminStats.update + adminStats.delete;
  };

  // Get activity badge color
  const getActivityBadgeColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">
                  {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
                </h1>
              </div>
              <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline" 
                size="sm"
                onClick={handleGoToDashboard}
                className="flex items-center space-x-2"
              >
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Data Dashboard</span>
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="hidden md:inline">Welcome, {admin?.username}</span>
              </div>
              
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-7xl">
        <div className="mb-4 md:mb-6">
          <p className="text-sm md:text-base text-gray-600">
            {isSuperAdmin 
              ? 'Manage administrators and monitor system activity' 
              : 'View your admin statistics and recent activity'
            }
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="overview" className="text-xs md:text-sm px-2 py-2">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs md:text-sm px-2 py-2">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{admins.length}</div>
                  <p className="text-xs text-gray-500">
                    {isSuperAdmin ? 'Active administrators' : 'System administrators'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Actions</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{admin ? getTotalActions(admin.id) : 0}</div>
                  <p className="text-xs text-gray-500">Total actions performed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activityLogs.length}</div>
                  <p className="text-xs text-gray-500">Recent system activities</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                  <Shield className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{admin?.role === 'super_admin' ? 'Super' : 'Admin'}</div>
                  <p className="text-xs text-gray-500">Access level</p>
                </CardContent>
              </Card>
            </div>

            {isSuperAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Admins</CardTitle>
                  <CardDescription>Latest administrator accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {admins.slice(0, 5).map((adminUser) => (
                      <div key={adminUser.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{adminUser.username}</p>
                            <p className="text-xs text-gray-500">{adminUser.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {getTotalActions(adminUser.id)} actions
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 md:space-y-6">
            <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
              <h2 className="text-lg font-semibold">Activity Logs</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  {isSuperAdmin ? 'All administrator actions' : 'Your recent actions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getActivityBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {log.documentTitle} in {log.collection}
                          </p>
                          <p className="text-xs text-gray-500">
                            by {log.adminUsername} • {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {activityLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}