import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/data-table';
import { AddEditModal } from '@/components/forms/add-edit-modal';
import { DeleteModal } from '@/components/forms/delete-modal';
import { SearchFilter } from '@/components/search-filter';
import { collections } from '@/lib/collections';
import type { CollectionName } from '@shared/schema';

export default function Dashboard() {
  const [activeCollection, setActiveCollection] = useState<CollectionName>('books');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const collectionConfig = collections[activeCollection];

  const handleAdd = () => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsAddModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      setIsDeleteModalOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar 
        activeCollection={activeCollection} 
        onCollectionChange={setActiveCollection}
      />
      
      <main className="flex-1 overflow-auto">
        <Header 
          collectionName={collectionConfig.displayName}
          onAddNew={handleAdd}
          onBulkDelete={handleBulkDelete}
          hasSelected={selectedItems.length > 0}
        />
        
        <div className="p-6">
          <SearchFilter 
            collection={activeCollection}
            onSearch={setSearchQuery}
          />
          
          <DataTable 
            collection={activeCollection}
            searchQuery={searchQuery}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
          />
        </div>
      </main>

      <AddEditModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        collection={activeCollection}
        item={selectedItem}
      />

      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        collection={activeCollection}
        item={selectedItem}
        selectedItems={selectedItems}
        onSuccess={() => {
          setSelectedItems([]);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
