import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Trash2 } from 'lucide-react';

interface HeaderProps {
  collectionName: string;
  onAddNew: () => void;
  onBulkDelete: () => void;
  hasSelected: boolean;
}

export function Header({ collectionName, onAddNew, onBulkDelete, hasSelected }: HeaderProps) {
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
        </div>
      </div>
    </header>
  );
}
