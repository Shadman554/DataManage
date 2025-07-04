import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  UserPlus, 
  Activity, 
  BarChart3,
  Shield,
  Settings,
  Eye,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Calendar,
  Filter
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

// Form schemas
const createAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'super_admin']),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

const editAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  role: z.enum(['admin', 'super_admin']),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

type CreateAdminData = z.infer<typeof createAdminSchema>;
type EditAdminData = z.infer<typeof editAdminSchema>;

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Forms
  const createForm = useForm<CreateAdminData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      role: 'admin',
    },
  });

  const editForm = useForm<EditAdminData>({
    resolver: zodResolver(editAdminSchema),
  });

  // Queries
  const { data: admins = [], isLoading: adminsLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/all', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch admins');
      return response.json();
    },
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
    queryKey: ['/api/admin/activity', activityFilter === 'all' ? undefined : activityFilter],
    queryFn: async () => {
      const url = activityFilter === 'all' 
        ? '/api/admin/activity?limit=100'
        : `/api/admin/activity?limit=100&adminId=${activityFilter}`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
  });

  // Mutations
  const createAdminMutation = useMutation({
    mutationFn: async (data: CreateAdminData) => {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create admin');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin created",
        description: "New admin has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create admin.",
        variant: "destructive",
      });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditAdminData }) => {
      const response = await fetch(`/api/admin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update admin');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin updated",
        description: "Admin has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all'] });
      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update admin.",
        variant: "destructive",
      });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete admin');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin deleted",
        description: "Admin has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete admin.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/${id}/toggle-status`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to toggle admin status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Admin status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update admin status.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateAdmin = (data: CreateAdminData) => {
    createAdminMutation.mutate(data);
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    editForm.reset({
      username: admin.username,
      email: admin.email,
      role: admin.role,
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAdmin = (data: EditAdminData) => {
    if (selectedAdmin) {
      updateAdminMutation.mutate({ id: selectedAdmin.id, data });
    }
  };

  const handleDeleteAdmin = (id: string) => {
    deleteAdminMutation.mutate(id);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  // Utility functions
  const getActivityBadgeColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalActions = (adminId: string) => {
    const adminStats = stats[adminId];
    if (!adminStats) return 0;
    return adminStats.create + adminStats.update + adminStats.delete;
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-7xl">
      <div className="mb-4 md:mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          <h1 className="text-xl md:text-2xl font-bold">Super Admin Dashboard</h1>
        </div>
        <p className="text-sm md:text-base text-gray-600">Manage administrators and monitor system activity</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm px-2 py-2">Overview</TabsTrigger>
          <TabsTrigger value="admins" className="text-xs md:text-sm px-2 py-2">Admins</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs md:text-sm px-2 py-2">Activity</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs md:text-sm px-2 py-2 hidden md:block">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{admins.length}</div>
                <p className="text-xs text-gray-500">System administrators</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{admins.filter(a => a.isActive).length}</div>
                <p className="text-xs text-gray-500">Currently active</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{admins.filter(a => a.role === 'super_admin').length}</div>
                <p className="text-xs text-gray-500">Super administrators</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activityLogs.length}</div>
                <p className="text-xs text-gray-500">Total actions logged</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Admin Activity</CardTitle>
                <CardDescription>Latest actions performed by administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getActivityBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{log.adminUsername}</p>
                          <p className="text-xs text-gray-500">{log.collection} • {log.documentTitle}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Performance</CardTitle>
                <CardDescription>Actions performed by each administrator</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {admins.slice(0, 5).map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{admin.username}</p>
                          <p className="text-xs text-gray-500">{admin.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {getTotalActions(admin.id)} actions
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4 md:space-y-6">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <h2 className="text-lg font-semibold">Admin Management</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full md:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" aria-describedby="create-admin-description">
                <DialogHeader>
                  <DialogTitle>Create New Admin</DialogTitle>
                  <DialogDescription id="create-admin-description">
                    Add a new administrator to the system.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateAdmin)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createAdminMutation.isPending}
                        className="flex-1"
                      >
                        {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{admin.username}</div>
                            <div className="text-sm text-gray-500 md:hidden">{admin.email}</div>
                            {admin.firstName && admin.lastName && (
                              <div className="text-sm text-gray-500">
                                {admin.firstName} {admin.lastName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={admin.isActive ? 'default' : 'destructive'}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAdmin(admin)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(admin.id)}
                            >
                              {admin.isActive ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {admin.username}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 md:space-y-6">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <h2 className="text-lg font-semibold">Activity Logs</h2>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead className="hidden md:table-cell">Collection</TableHead>
                      <TableHead className="hidden lg:table-cell">Document</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={getActivityBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.adminUsername}</div>
                            <div className="text-sm text-gray-500">{log.adminRole}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{log.collection}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div>
                            <div className="font-medium">{log.documentTitle || 'Untitled'}</div>
                            <div className="text-sm text-gray-500">{log.documentId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(log.timestamp)}
                          </div>
                          {log.ipAddress && (
                            <div className="text-xs text-gray-500">{log.ipAddress}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4 md:space-y-6">
          <h2 className="text-lg font-semibold">Admin Statistics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {admins.map((admin) => {
              const adminStats = stats[admin.id] || { create: 0, update: 0, delete: 0 };
              const totalActions = adminStats.create + adminStats.update + adminStats.delete;
              
              return (
                <Card key={admin.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{admin.username}</span>
                      <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{admin.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Actions</span>
                        <span className="font-semibold">{totalActions}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Created</span>
                          <span>{adminStats.create}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-600">Updated</span>
                          <span>{adminStats.update}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Deleted</span>
                          <span>{adminStats.delete}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Last Login</span>
                          <span>{admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status</span>
                          <Badge variant={admin.isActive ? 'default' : 'destructive'} className="text-xs">
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby="edit-admin-description">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription id="edit-admin-description">
              Update administrator information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateAdmin)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateAdminMutation.isPending}
                  className="flex-1"
                >
                  {updateAdminMutation.isPending ? 'Updating...' : 'Update Admin'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}