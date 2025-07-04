import { useState } from 'react';
import { useCollection } from '@/hooks/use-firebase';
import { getCollectionConfig } from '@/lib/collections';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Eye, Trash2, Grid, List } from 'lucide-react';
import type { CollectionName } from '@shared/schema';

interface DataTableProps {
  collection: CollectionName;
  searchQuery: string;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  selectedItems: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function DataTable({ 
  collection, 
  searchQuery, 
  onEdit, 
  onDelete, 
  selectedItems, 
  onSelectionChange 
}: DataTableProps) {
  const { data, isLoading, error } = useCollection(collection);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const config = getCollectionConfig(collection);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No data available for {config.displayName}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter data based on search query
  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return config.searchableFields.some(field => {
      const value = item[field as keyof typeof item];
      return value && String(value).toLowerCase().includes(searchLower);
    });
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(paginatedData.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, id]);
    } else {
      onSelectionChange(selectedItems.filter(item => item !== id));
    }
  };

  const formatValue = (value: any, field: string) => {
    if (value === null || value === undefined) return '-';
    
    // Handle timestamps
    if (typeof value === 'object' && value._seconds) {
      return new Date(value._seconds * 1000).toLocaleDateString();
    }
    
    // Handle URLs
    if (field.includes('Url') || field.includes('url')) {
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    }
    
    // Handle long text
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return String(value);
  };

  const getDisplayFields = () => {
    switch (collection) {
      case 'books':
        return ['title', 'category', 'description'];
      case 'words':
        return ['name', 'kurdish', 'arabic'];
      case 'diseases':
        return ['name', 'kurdish', 'symptoms'];
      case 'drugs':
        return ['name', 'usage', 'class'];
      case 'tutorialVideos':
        return ['Title', 'VideoID'];
      case 'staff':
        return ['name', 'job', 'description'];
      case 'questions':
        return ['text', 'userName', 'likes'];
      case 'notifications':
        return ['title', 'body'];
      case 'users':
        return ['username', 'total_points', 'today_points'];
      case 'normalRanges':
        return ['name', 'species', 'category'];
      case 'appLinks':
        return ['url'];
      default:
        return config.fields.slice(0, 3);
    }
  };

  const displayFields = getDisplayFields();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{config.displayName} Collection</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{filteredData.length} items</span>
            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedItems.length === paginatedData.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {displayFields.map(field => (
                  <TableHead key={field} className="font-medium">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Checkbox 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </TableCell>
                  
                  {displayFields.map(field => (
                    <TableCell key={field}>
                      {field === 'coverImageUrl' || field === 'photo' || field === 'imageUrl' ? (
                        item[field] ? (
                          <img 
                            src={item[field]} 
                            alt="Preview" 
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">No image</span>
                          </div>
                        )
                      ) : (
                        <div className="max-w-xs truncate" title={String(item[field])}>
                          {formatValue(item[field], field)}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
