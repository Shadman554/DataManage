import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { getCollectionConfig } from '@/lib/collections';
import type { CollectionName } from '@shared/schema';

interface SearchFilterProps {
  collection: CollectionName;
  onSearch: (query: string) => void;
}

export function SearchFilter({ collection, onSearch }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string>('');
  
  const config = getCollectionConfig(collection);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const getPlaceholderText = () => {
    const searchFields = config.searchableFields.join(', ');
    return `Search ${searchFields}...`;
  };

  const getCategoryOptions = () => {
    switch (collection) {
      case 'books':
        return ['کتێبە کوردیەکان', 'کتێبە ئینگلیزیەکان'];
      case 'normalRanges':
        return ['Hematology', 'Biochemistry', 'Immunology'];
      case 'drugs':
        return ['Anesthesia', 'Antibiotics', 'Antiparasitic'];
      default:
        return [];
    }
  };

  const categoryOptions = getCategoryOptions();

  return (
    <Card className="mb-4">
      <CardContent className="p-3 md:p-4">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={getPlaceholderText()}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            {config.searchableFields.length > 1 && (
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All fields</SelectItem>
                  {config.searchableFields.map(field => (
                    <SelectItem key={field} value={field}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {categoryOptions.length > 0 && (
              <Select>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button variant="outline" size="sm" className="px-3">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={getPlaceholderText()}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {config.searchableFields.length > 1 && (
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Search in field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fields</SelectItem>
                {config.searchableFields.map(field => (
                  <SelectItem key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {categoryOptions.length > 0 && (
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
