import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookForm } from './book-form';
import { WordForm } from './word-form';
import { DiseaseForm } from './disease-form';
import { DrugForm } from './drug-form';
import { VideoForm } from './video-form';
import { StaffForm } from './staff-form';
import { QuestionForm } from './question-form';
import { NotificationForm } from './notification-form';
import { UserForm } from './user-form';
import { RangeForm } from './range-form';
import { AppLinkForm } from './app-link-form';
import { getCollectionDisplayName } from '@/lib/collections';
import type { CollectionName } from '@shared/schema';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionName;
  item?: any;
}

export function AddEditModal({ isOpen, onClose, collection, item }: AddEditModalProps) {
  const isEditing = !!item;
  const displayName = getCollectionDisplayName(collection);

  const renderForm = () => {
    const formProps = { item, onSuccess: onClose };
    
    switch (collection) {
      case 'books':
        return <BookForm {...formProps} />;
      case 'words':
        return <WordForm {...formProps} />;
      case 'diseases':
        return <DiseaseForm {...formProps} />;
      case 'drugs':
        return <DrugForm {...formProps} />;
      case 'tutorialVideos':
        return <VideoForm {...formProps} />;
      case 'staff':
        return <StaffForm {...formProps} />;
      case 'questions':
        return <QuestionForm {...formProps} />;
      case 'notifications':
        return <NotificationForm {...formProps} />;
      case 'users':
        return <UserForm {...formProps} />;
      case 'normalRanges':
        return <RangeForm {...formProps} />;
      case 'appLinks':
        return <AppLinkForm {...formProps} />;
      default:
        return <div>Form not implemented for {collection}</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[95vh] mx-2 md:mx-auto overflow-y-auto" aria-describedby="modal-description">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg md:text-xl">
            {isEditing ? `Edit ${displayName}` : `Add New ${displayName}`}
          </DialogTitle>
          <DialogDescription id="modal-description" className="text-sm text-gray-600">
            {isEditing 
              ? `Modify the details of this ${displayName.toLowerCase()} item.`
              : `Fill out the form below to create a new ${displayName.toLowerCase()} item.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
