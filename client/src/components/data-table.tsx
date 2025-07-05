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

  // Deduplicate data to handle duplicate IDs
  const deduplicatedData = data ? data.filter((item, index, self) => 
    index === self.findIndex(i => i.id === item.id)
  ) : [];

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

  if (!deduplicatedData || deduplicatedData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No data available for {config.displayName}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter data based on search query
  const filteredData = deduplicatedData.filter(item => {
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
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl">{config.displayName}</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{filteredData.length} items</span>
            {/* View mode toggle for desktop only */}
            <div className="hidden md:flex items-center space-x-1">
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
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {paginatedData.map((item) => (
            <Card key={item.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {item.id.slice(0, 8)}...
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {displayFields.map((field) => (
                    <div key={field} className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </span>
                      <span className="text-sm text-foreground break-words">
                        {formatValue((item as any)[field], field)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                <TableRow key={`${collection}-${item.id}`} className="hover:bg-muted">
                  <TableCell>
                    <Checkbox 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </TableCell>
                  
                  {displayFields.map(field => (
                    <TableCell key={field}>
                      {field === 'coverImageUrl' || field === 'photo' || field === 'imageUrl' ? (
                        (item as any)[field] ? (
                          <img 
                            src={(item as any)[field]} 
                            alt="Preview" 
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )
                      ) : (
                        <div className="max-w-xs truncate" title={String((item as any)[field])}>
                          {formatValue((item as any)[field], field)}
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
        <div className="mt-4 pt-4 border-t">
          {/* Mobile Pagination */}
          <div className="md:hidden flex flex-col space-y-3">
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredData.length} total)
              </span>
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex-1 max-w-24"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex-1 max-w-24"
              >
                Next
              </Button>
            </div>
            <div className="flex justify-center items-center space-x-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-border rounded text-sm bg-background text-foreground dark:bg-card dark:text-foreground"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1 border border-border rounded text-sm bg-background text-foreground dark:bg-card dark:text-foreground"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-muted-foreground">per page</span>
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
        </div>
      </CardContent>
    </Card>
  );
}
