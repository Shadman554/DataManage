import { useState } from 'react';
import { collections } from '@/lib/collections';
import { useCollection } from '@/hooks/use-firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, Book, Languages, Worm, Pill, Video, Users, 
  HelpCircle, Bell, User, BarChart3, Link, Settings, 
  Download, Upload 
} from 'lucide-react';
import type { CollectionName } from '@shared/schema';

const iconMap = {
  book: Book,
  language: Languages,
  virus: Worm,
  pills: Pill,
  video: Video,
  users: Users,
  'question-circle': HelpCircle,
  bell: Bell,
  user: User,
  'chart-line': BarChart3,
  link: Link,
};

interface MobileSidebarProps {
  activeCollection: CollectionName;
  onCollectionChange: (collection: CollectionName) => void;
  currentView: 'collections' | 'settings';
  onViewChange: (view: 'collections' | 'settings') => void;
}

export function MobileSidebar({ activeCollection, onCollectionChange, currentView, onViewChange }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCollectionCount = (collection: CollectionName) => {
    const { data } = useCollection(collection);
    return data?.length || 0;
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap] || Book;
    return Icon;
  };

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary">Vet Dictionary</h1>
          <p className="text-sm text-gray-500">Admin Panel</p>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="mt-4">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Collections
            </div>
            
            <ul className="space-y-1 px-3">
              {(Object.keys(collections) as CollectionName[]).map((collection) => {
                const config = collections[collection];
                const Icon = getIcon(config.icon);
                const count = getCollectionCount(collection);
                const isActive = activeCollection === collection;
                
                return (
                  <li key={collection}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start px-3 py-2 text-sm font-medium ${
                        isActive 
                          ? 'text-primary bg-blue-50' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleItemClick(() => {
                        onCollectionChange(collection);
                        onViewChange('collections');
                      })}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {config.displayName}
                      <Badge 
                        variant={isActive ? "default" : "secondary"}
                        className="ml-auto text-xs"
                      >
                        {count}
                      </Badge>
                    </Button>
                  </li>
                );
              })}
            </ul>
            
            <Separator className="my-4 mx-3" />
            
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              System
            </div>
            
            <ul className="space-y-1 px-3">
              <li>
                <Button 
                  variant={currentView === 'settings' ? "secondary" : "ghost"} 
                  className={`w-full justify-start px-3 py-2 text-sm font-medium ${
                    currentView === 'settings' 
                      ? 'text-primary bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleItemClick(() => onViewChange('settings'))}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Button>
              </li>
              <li>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => handleItemClick(() => {
                    fetch('/api/system/export', { method: 'POST' })
                      .then(response => response.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `veterinary-data-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      });
                  })}
                >
                  <Download className="mr-3 h-4 w-4" />
                  Export Data
                </Button>
              </li>
            </ul>
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}