import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Header } from '@/components/layout/header';
import { DataTable } from '@/components/data-table';
import { AddEditModal } from '@/components/forms/add-edit-modal';
import { DeleteModal } from '@/components/forms/delete-modal';
import { SearchFilter } from '@/components/search-filter';
import { collections } from '@/lib/collections';
import Settings from '@/pages/settings';
import type { CollectionName } from '@shared/schema';

export default function Dashboard() {
  const [activeCollection, setActiveCollection] = useState<CollectionName>('books');
  const [currentView, setCurrentView] = useState<'collections' | 'settings'>('collections');
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
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          activeCollection={activeCollection} 
          onCollectionChange={setActiveCollection}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>
      
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile Header with Hamburger */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 md:hidden">
          <MobileSidebar 
            activeCollection={activeCollection} 
            onCollectionChange={setActiveCollection}
            currentView={currentView}
            onViewChange={setCurrentView}
          />
          <h1 className="text-lg font-semibold text-primary truncate">
            {currentView === 'collections' ? collectionConfig.displayName : 'Settings'}
          </h1>
          <div className="w-10" />
        </div>

        {currentView === 'settings' ? (
          <Settings />
        ) : (
          <>
            {/* Desktop Header */}
            <div className="hidden md:block">
              <Header 
                collectionName={collectionConfig.displayName}
                onAddNew={handleAdd}
                onBulkDelete={handleBulkDelete}
                hasSelected={selectedItems.length > 0}
              />
            </div>
            
            <div className="p-3 md:p-6">
              {/* Mobile Add Button & Title */}
              <div className="flex items-center justify-between mb-4 md:hidden">
                <h2 className="text-lg font-semibold">{collectionConfig.displayName}</h2>
                <button
                  onClick={handleAdd}
                  className="bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  Add New
                </button>
              </div>

              {/* Mobile Bulk Delete Button */}
              {selectedItems.length > 0 && (
                <div className="mb-4 md:hidden">
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Delete Selected ({selectedItems.length})
                  </button>
                </div>
              )}
              
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
          </>
        )}
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
