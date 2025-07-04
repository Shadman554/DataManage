import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  Settings as SettingsIcon, 
  Database, 
  Cloud, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SystemSettings {
  firebaseEnabled: boolean;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  maxFileSize: number;
  allowedFileTypes: string[];
  maintenanceMode: boolean;
}

interface DatabaseInfo {
  status: 'connected' | 'disconnected' | 'error';
  totalRecords: number;
  lastBackup: string;
  storageUsed: number;
  storageLimit: number;
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  // Fetch system settings
  const { data: settings, isLoading: settingsLoading } = useQuery<SystemSettings>({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  // Fetch database info
  const { data: dbInfo, isLoading: dbLoading } = useQuery<DatabaseInfo>({
    queryKey: ['/api/system/database-info'],
    queryFn: async () => {
      const response = await fetch('/api/system/database-info');
      if (!response.ok) throw new Error('Failed to fetch database info');
      return response.json();
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Test Firebase connection
  const testFirebaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/system/test-firebase', { method: 'POST' });
      if (!response.ok) throw new Error('Firebase connection test failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Firebase Connected" : "Firebase Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  // Export data
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/system/export', { method: 'POST' });
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veterinary-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Export successful",
        description: "Your data has been exported successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: `Failed to export data: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Clear cache
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/system/clear-cache', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear cache');
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Cache cleared",
        description: "System cache has been cleared successfully.",
      });
    },
  });

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    if (settings) {
      updateSettingsMutation.mutate({ [key]: value });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-6xl">
      <div className="mb-4 md:mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <SettingsIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-sm md:text-base text-gray-600">Configure your veterinary dictionary admin panel</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="general" className="text-xs md:text-sm px-2 py-2">General</TabsTrigger>
          <TabsTrigger value="database" className="text-xs md:text-sm px-2 py-2">Database</TabsTrigger>
          <TabsTrigger value="backup" className="text-xs md:text-sm px-2 py-2">Backup</TabsTrigger>
          <TabsTrigger value="system" className="text-xs md:text-sm px-2 py-2">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">General Settings</CardTitle>
              <CardDescription className="text-sm">Configure basic system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="space-y-1">
                  <Label className="text-sm md:text-base">Firebase Integration</Label>
                  <p className="text-xs md:text-sm text-gray-500">Enable Firebase for data storage</p>
                </div>
                <Switch
                  checked={settings?.firebaseEnabled || false}
                  onCheckedChange={(checked) => handleSettingChange('firebaseEnabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="space-y-1">
                  <Label className="text-sm md:text-base">Maintenance Mode</Label>
                  <p className="text-xs md:text-sm text-gray-500">Enable maintenance mode to prevent data changes</p>
                </div>
                <Switch
                  checked={settings?.maintenanceMode || false}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm md:text-base">Maximum File Size (MB)</Label>
                <Input
                  type="number"
                  value={settings?.maxFileSize || 10}
                  onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                  className="w-full md:w-32"
                />
                <p className="text-xs md:text-sm text-gray-500">Maximum size for uploaded files</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Database Status</CardTitle>
              <CardDescription className="text-sm">Monitor your database connection and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm md:text-base">Connection Status</Label>
                    {getStatusIcon(dbInfo?.status || 'disconnected')}
                  </div>
                  <Badge className={getStatusColor(dbInfo?.status || 'disconnected')}>
                    {dbInfo?.status || 'Unknown'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testFirebaseMutation.mutate()}
                  disabled={testFirebaseMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm text-gray-500">Total Records</Label>
                  <p className="text-xl md:text-2xl font-bold">{dbInfo?.totalRecords || 0}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm text-gray-500">Storage Used</Label>
                  <p className="text-lg md:text-2xl font-bold">
                    {dbInfo?.storageUsed || 0} MB / {dbInfo?.storageLimit || 1000} MB
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs md:text-sm text-gray-500">Last Backup</Label>
                <p className="text-sm md:text-base">{dbInfo?.lastBackup || 'Never'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Backup & Export</CardTitle>
              <CardDescription className="text-sm">Manage your data backups and exports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="space-y-1">
                  <Label className="text-sm md:text-base">Automatic Backup</Label>
                  <p className="text-xs md:text-sm text-gray-500">Enable automatic data backups</p>
                </div>
                <Switch
                  checked={settings?.autoBackup || false}
                  onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-3 md:space-y-4">
                <Label className="text-sm md:text-base">Export Options</Label>
                <div className="flex flex-col space-y-3 md:flex-row md:space-x-4 md:space-y-0">
                  <Button
                    onClick={() => exportDataMutation.mutate()}
                    disabled={exportDataMutation.isPending}
                    size="sm"
                    className="w-full md:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" disabled size="sm" className="w-full md:w-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">System Maintenance</CardTitle>
              <CardDescription className="text-sm">System maintenance and cleanup tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                  <div className="space-y-1">
                    <Label className="text-sm md:text-base">Clear Cache</Label>
                    <p className="text-xs md:text-sm text-gray-500">Clear system cache to improve performance</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCacheMutation.mutate()}
                    disabled={clearCacheMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>

                <Separator />

                <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                  <div className="space-y-1">
                    <Label className="text-sm md:text-base text-red-600">Danger Zone</Label>
                    <p className="text-xs md:text-sm text-gray-500">Irreversible and destructive actions</p>
                  </div>
                  <Button variant="destructive" disabled size="sm" className="w-full md:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}