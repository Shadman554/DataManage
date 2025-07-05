import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
  Database,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAdmin, logoutAdmin } from '@/hooks/useAdmin';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  firstName?: string;
  lastName?: string;
  lastLoginAt?: string;
  createdAt: string;
  isActive: boolean;
}

// Form schemas
const createAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'super_admin']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const editAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'super_admin']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type CreateAdminData = z.infer<typeof createAdminSchema>;
type EditAdminData = z.infer<typeof editAdminSchema>;

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin } = useAdmin();
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [activityLimit, setActivityLimit] = useState<number>(50);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUser | null>(null);
  
  const isSuperAdmin = admin?.role === 'super_admin';

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
  const { data: allAdmins = [] } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/all'],
    enabled: isSuperAdmin,
  });

  const { data: adminStats = {} } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: isSuperAdmin,
  });

  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: ['/api/admin/activity', selectedAdmin, activityLimit],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: activityLimit.toString(),
        ...(selectedAdmin !== 'all' && { adminId: selectedAdmin }),
      });
      return fetch(`/api/admin/activity?${params}`, { credentials: 'include' }).then(res => res.json());
    },
    enabled: isSuperAdmin,
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin.",
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
      setSelectedAdminForEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin.",
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin.",
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin status.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreateAdmin = (data: CreateAdminData) => {
    createAdminMutation.mutate(data);
  };

  const handleEditAdmin = (adminUser: AdminUser) => {
    setSelectedAdminForEdit(adminUser);
    editForm.reset({
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      firstName: adminUser.firstName || '',
      lastName: adminUser.lastName || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAdmin = (data: EditAdminData) => {
    if (selectedAdminForEdit) {
      updateAdminMutation.mutate({ id: selectedAdminForEdit.id, data });
    }
  };

  const handleDeleteAdmin = (id: string) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      deleteAdminMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <PlusCircle className="h-4 w-4 text-green-600" />;
      case 'update': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {admin?.firstName || admin?.username}!</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <ThemeToggle />
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="text-sm">
              <Database className="h-4 w-4 mr-2" />
              Data Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Access Limited</CardTitle>
            <CardDescription className="text-sm">
              You have admin access but cannot manage other administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm sm:text-base">As an admin, you can:</p>
            <ul className="list-disc pl-4 sm:pl-6 space-y-2 text-sm sm:text-base">
              <li>Add, edit, and delete veterinary data</li>
              <li>Manage books, words, diseases, and drugs</li>
              <li>Handle tutorial videos and staff information</li>
              <li>Respond to user questions and notifications</li>
            </ul>
            <Button className="mt-4 w-full sm:w-auto text-sm" onClick={() => window.location.href = '/dashboard'}>
              Go to Data Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage administrators and monitor system activity</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <ThemeToggle />
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="text-sm">
            <Database className="h-4 w-4 mr-2" />
            Data Dashboard
          </Button>
          <Button variant="outline" onClick={handleLogout} className="text-sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Overview</TabsTrigger>
          <TabsTrigger value="admins" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Admin Mgmt</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Admins</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{allAdmins.length}</div>
                <p className="text-xs text-gray-500">System administrators</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Active Admins</CardTitle>
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{allAdmins.filter(a => a.isActive).length}</div>
                <p className="text-xs text-gray-500">Currently active</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Super Admins</CardTitle>
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{allAdmins.filter(a => a.role === 'super_admin').length}</div>
                <p className="text-xs text-gray-500">Super administrators</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Recent Activity</CardTitle>
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{activityLogs.length}</div>
                <p className="text-xs text-gray-500">Actions logged</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Admin Management</CardTitle>
                  <CardDescription className="text-sm">Create, edit, and manage administrator accounts</CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto text-sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Admin</DialogTitle>
                      <DialogDescription>Add a new administrator to the system</DialogDescription>
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
                                <Input placeholder="Enter username" {...field} />
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
                                <Input type="email" placeholder="Enter email" {...field} />
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
                                <Input type="password" placeholder="Enter password" {...field} />
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
                                    <SelectValue placeholder="Select role" />
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
                                  <Input placeholder="First name" {...field} />
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
                                  <Input placeholder="Last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createAdminMutation.isPending}>
                            {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {allAdmins.map((adminUser) => (
                  <div key={adminUser.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="font-medium text-sm sm:text-base truncate">{adminUser.firstName} {adminUser.lastName}</p>
                        <Badge variant={adminUser.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">
                          {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </Badge>
                        <Badge variant={adminUser.isActive ? 'outline' : 'destructive'} className="text-xs">
                          {adminUser.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">@{adminUser.username} • {adminUser.email}</p>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(adminUser.createdAt).toLocaleDateString()}
                        {adminUser.lastLoginAt && (
                          <span className="hidden sm:inline"> • Last login: {new Date(adminUser.lastLoginAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 sm:ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAdmin(adminUser)}
                        className="text-xs px-2 py-1"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="ml-1 sm:hidden">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(adminUser.id)}
                        className="text-xs px-2 py-1"
                      >
                        {adminUser.isActive ? <ToggleRight className="h-3 w-3 sm:h-4 sm:w-4" /> : <ToggleLeft className="h-3 w-3 sm:h-4 sm:w-4" />}
                        <span className="ml-1 sm:hidden">Toggle</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAdmin(adminUser.id)}
                        disabled={adminUser.id === admin?.id}
                        className="text-xs px-2 py-1"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="ml-1 sm:hidden">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Activity Logs</CardTitle>
              <CardDescription className="text-sm">Monitor administrator actions and system changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.collection}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {log.documentTitle && `"${log.documentTitle}" • `}
                        By {log.adminUsername} ({log.adminRole})
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update administrator information</DialogDescription>
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
                      <Input placeholder="Enter username" {...field} />
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
                      <Input type="email" placeholder="Enter email" {...field} />
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
                          <SelectValue placeholder="Select role" />
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
                        <Input placeholder="First name" {...field} />
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
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAdminMutation.isPending}>
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