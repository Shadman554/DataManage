import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteDocument, useBulkOperation } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { CollectionName } from '@shared/schema';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionName;
  item?: any;
  selectedItems?: string[];
  onSuccess: () => void;
}

export function DeleteModal({ 
  isOpen, 
  onClose, 
  collection, 
  item, 
  selectedItems = [], 
  onSuccess 
}: DeleteModalProps) {
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument(collection);
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkOperation(collection);
  const { toast } = useToast();

  const isBulkDelete = selectedItems.length > 0 && !item;
  const isLoading = isDeleting || isBulkDeleting;

  const handleDelete = () => {
    if (isBulkDelete) {
      bulkDelete(
        { action: 'delete', ids: selectedItems },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: `${selectedItems.length} items deleted successfully.`,
            });
            onSuccess();
            onClose();
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: "Failed to delete items.",
              variant: "destructive",
            });
          },
        }
      );
    } else if (item) {
      deleteDocument(item.id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Item deleted successfully.",
          });
          onSuccess();
          onClose();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to delete item.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const getTitle = () => {
    if (isBulkDelete) {
      return `Delete ${selectedItems.length} Items`;
    }
    return 'Delete Item';
  };

  const getMessage = () => {
    if (isBulkDelete) {
      return `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`;
    }
    return 'Are you sure you want to delete this item? This action cannot be undone.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            {getMessage()}
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
