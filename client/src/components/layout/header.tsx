import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Trash2, LogOut, User } from 'lucide-react';
import { useAdmin, logoutAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface HeaderProps {
  collectionName: string;
  onAddNew: () => void;
  onBulkDelete: () => void;
  hasSelected: boolean;
}

export function Header({ collectionName, onAddNew, onBulkDelete, hasSelected }: HeaderProps) {
  const { admin } = useAdmin();
  const { toast } = useToast();

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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {collectionName} Management
          </h2>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Firebase Connected</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Admin Info */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{admin?.username}</span>
            <Badge variant={admin?.role === 'super_admin' ? 'default' : 'secondary'}>
              {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
          {hasSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button
            onClick={onAddNew}
            size="sm"
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
