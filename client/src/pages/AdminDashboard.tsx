import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Activity, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Clock, 
  Shield,
  BarChart3,
  LogOut,
  Database
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  firstName?: string;
  lastName?: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  documentTitle?: string;
  timestamp: string;
  ipAddress?: string;
  adminUsername: string;
  adminEmail: string;
  adminRole: string;
}

interface AdminStats {
  [adminId: string]: {
    create: number;
    update: number;
    delete: number;
  };
}

export function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [activityLimit, setActivityLimit] = useState<number>(50);

  // Fetch all admins (super admin only)
  const { data: allAdmins } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/all'],
    enabled: admin?.role === 'super_admin',
  });

  // Fetch admin statistics (super admin only)
  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: admin?.role === 'super_admin',
  });

  // Fetch activity logs
  const { data: activityLogs } = useQuery<ActivityLog[]>({
    queryKey: ['/api/admin/activity', selectedAdmin, activityLimit],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: activityLimit.toString(),
        ...(selectedAdmin !== 'all' && { adminId: selectedAdmin }),
      });
      return fetch(`/api/admin/activity?${params}`).then(res => res.json());
    },
    enabled: admin?.role === 'super_admin',
  });

  const handleLogout = async () => {
    await logout();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <PlusCircle className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalStats = () => {
    if (!adminStats) return { create: 0, update: 0, delete: 0 };
    
    return Object.values(adminStats).reduce(
      (total, stats) => ({
        create: total.create + stats.create,
        update: total.update + stats.update,
        delete: total.delete + stats.delete,
      }),
      { create: 0, update: 0, delete: 0 }
    );
  };

  const totalStats = calculateTotalStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Veterinary Dictionary Admin Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {admin?.firstName} {admin?.lastName} ({admin?.username})
                </p>
                <Badge variant={admin?.role === 'super_admin' ? 'default' : 'secondary'}>
                  {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {admin?.role === 'super_admin' ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity Logs</TabsTrigger>
              <TabsTrigger value="admins">Admin Management</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Creations</CardTitle>
                    <PlusCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{totalStats.create}</div>
                    <p className="text-xs text-muted-foreground">Items created by all admins</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
                    <Edit className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{totalStats.update}</div>
                    <p className="text-xs text-muted-foreground">Items updated by all admins</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Deletions</CardTitle>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{totalStats.delete}</div>
                    <p className="text-xs text-muted-foreground">Items deleted by all admins</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
                    <Users className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allAdmins?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Total admin accounts</p>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Admin Performance</CardTitle>
                  <CardDescription>Activity breakdown by admin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allAdmins?.map((adminUser) => {
                      const stats = adminStats?.[adminUser.id] || { create: 0, update: 0, delete: 0 };
                      const totalActivity = stats.create + stats.update + stats.delete;
                      
                      return (
                        <div key={adminUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{adminUser.firstName} {adminUser.lastName}</p>
                              <p className="text-sm text-gray-500">@{adminUser.username}</p>
                            </div>
                            <Badge variant={adminUser.role === 'super_admin' ? 'default' : 'secondary'}>
                              {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{stats.create}</div>
                              <div className="text-xs text-gray-500">Created</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{stats.update}</div>
                              <div className="text-xs text-gray-500">Updated</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">{stats.delete}</div>
                              <div className="text-xs text-gray-500">Deleted</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">{totalActivity}</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Activity Logs</CardTitle>
                      <CardDescription>Track all admin actions across the system</CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by admin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Admins</SelectItem>
                          {allAdmins?.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={activityLimit.toString()} onValueChange={(value) => setActivityLimit(parseInt(value))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 items</SelectItem>
                          <SelectItem value="50">50 items</SelectItem>
                          <SelectItem value="100">100 items</SelectItem>
                          <SelectItem value="200">200 items</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {activityLogs?.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          {getActionIcon(log.action)}
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getActionColor(log.action)}>
                                {log.action.toUpperCase()}
                              </Badge>
                              <span className="font-medium">{log.collection}</span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {log.documentTitle ? `"${log.documentTitle}"` : `ID: ${log.documentId}`}
                            </p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>By: {log.adminUsername}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                              {log.ipAddress && (
                                <>
                                  <span>•</span>
                                  <span>IP: {log.ipAddress}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {activityLogs?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No activity logs found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admins" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Management</CardTitle>
                  <CardDescription>Manage admin accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allAdmins?.map((adminUser) => (
                      <div key={adminUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{adminUser.firstName} {adminUser.lastName}</p>
                              <Badge variant={adminUser.role === 'super_admin' ? 'default' : 'secondary'}>
                                {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">@{adminUser.username} • {adminUser.email}</p>
                            <p className="text-xs text-gray-400">
                              Created: {new Date(adminUser.createdAt).toLocaleDateString()}
                              {adminUser.lastLoginAt && (
                                <> • Last login: {new Date(adminUser.lastLoginAt).toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {admin?.firstName}!</CardTitle>
              <CardDescription>
                You are logged in as an admin. Access to detailed statistics and logs is restricted to super admins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Continue to Data Management</p>
                  <p className="text-sm text-gray-500">Manage books, words, diseases, and other veterinary data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}