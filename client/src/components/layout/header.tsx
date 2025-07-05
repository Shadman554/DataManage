import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Plus, Download, Trash2, LogOut, User, Shield } from 'lucide-react';
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

  const handleGoToAdminPanel = () => {
    window.location.href = '/admin';
  };

  return (
    <header className="bg-card dark:bg-card/95 shadow-sm dark:shadow-black/20 border-b border-border dark:border-border/50 px-3 sm:px-6 py-3 sm:py-4 theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground dark:text-foreground">
            {collectionName} Management
          </h2>
          <div className="flex items-center space-x-2 mt-1 sm:mt-0">
            <div className="h-2 w-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <span className="text-xs sm:text-sm text-muted-foreground">Firebase Connected</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Admin Info */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground order-1 sm:order-none">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{admin?.username}</span>
            <Badge variant={admin?.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">
              {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
          
          {/* Action Buttons Row 1 */}
          <div className="flex flex-wrap items-center gap-2 order-2 sm:order-none">
            {hasSelected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                className="flex items-center text-xs px-2 py-1"
              >
                <Trash2 className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Delete Selected</span>
                <span className="sm:hidden">Delete</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center text-xs px-2 py-1"
            >
              <Download className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </Button>
            
            <Button
              onClick={onAddNew}
              size="sm"
              className="flex items-center text-xs px-2 py-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
          
          {/* Navigation Buttons Row 2 */}
          <div className="flex items-center gap-2 order-3 sm:order-none">
            <ThemeToggle />
            
            <Button
              onClick={handleGoToAdminPanel}
              variant="outline"
              size="sm"
              className="flex items-center text-xs px-2 py-1"
            >
              <Shield className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Admin Panel</span>
              <span className="sm:hidden">Admin</span>
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center text-xs px-2 py-1"
            >
              <LogOut className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
