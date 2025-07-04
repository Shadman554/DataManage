import { CollectionName } from '@shared/schema';

export interface CollectionConfig {
  name: string;
  icon: string;
  displayName: string;
  description: string;
  fields: string[];
  searchableFields: string[];
  hasImages: boolean;
  hasFiles: boolean;
}

export const collections: Record<CollectionName, CollectionConfig> = {
  books: {
    name: 'books',
    icon: 'book',
    displayName: 'Books',
    description: 'Manage veterinary books and publications',
    fields: ['title', 'description', 'category', 'coverImageUrl', 'pdfUrl'],
    searchableFields: ['title', 'description', 'category'],
    hasImages: true,
    hasFiles: true,
  },
  words: {
    name: 'words',
    icon: 'language',
    displayName: 'Dictionary',
    description: 'Manage veterinary dictionary terms',
    fields: ['name', 'kurdish', 'arabic', 'description'],
    searchableFields: ['name', 'kurdish', 'arabic', 'description'],
    hasImages: false,
    hasFiles: false,
  },
  diseases: {
    name: 'diseases',
    icon: 'virus',
    displayName: 'Diseases',
    description: 'Manage animal diseases and conditions',
    fields: ['name', 'kurdish', 'symptoms', 'cause', 'control'],
    searchableFields: ['name', 'kurdish', 'symptoms'],
    hasImages: false,
    hasFiles: false,
  },
  drugs: {
    name: 'drugs',
    icon: 'pills',
    displayName: 'Drugs',
    description: 'Manage veterinary medications',
    fields: ['name', 'usage', 'sideEffect', 'otherInfo', 'class'],
    searchableFields: ['name', 'usage', 'class'],
    hasImages: false,
    hasFiles: false,
  },
  tutorialVideos: {
    name: 'tutorialVideos',
    icon: 'video',
    displayName: 'Tutorial Videos',
    description: 'Manage educational videos',
    fields: ['Title', 'VideoID'],
    searchableFields: ['Title'],
    hasImages: false,
    hasFiles: false,
  },
  staff: {
    name: 'staff',
    icon: 'users',
    displayName: 'Staff',
    description: 'Manage staff members',
    fields: ['name', 'job', 'description', 'photo', 'facebook', 'instagram', 'snapchat', 'twitter'],
    searchableFields: ['name', 'job', 'description'],
    hasImages: true,
    hasFiles: false,
  },
  questions: {
    name: 'questions',
    icon: 'question-circle',
    displayName: 'Questions',
    description: 'Manage user questions',
    fields: ['text', 'userName', 'userEmail', 'likes'],
    searchableFields: ['text', 'userName'],
    hasImages: false,
    hasFiles: false,
  },
  notifications: {
    name: 'notifications',
    icon: 'bell',
    displayName: 'Notifications',
    description: 'Manage system notifications',
    fields: ['title', 'body', 'imageUrl'],
    searchableFields: ['title', 'body'],
    hasImages: true,
    hasFiles: false,
  },
  users: {
    name: 'users',
    icon: 'user',
    displayName: 'Users',
    description: 'Manage application users',
    fields: ['username', 'today_points', 'total_points'],
    searchableFields: ['username'],
    hasImages: false,
    hasFiles: false,
  },
  normalRanges: {
    name: 'normalRanges',
    icon: 'chart-line',
    displayName: 'Normal Ranges',
    description: 'Manage normal reference ranges',
    fields: ['name', 'unit', 'minValue', 'maxValue', 'species', 'category'],
    searchableFields: ['name', 'species', 'category'],
    hasImages: false,
    hasFiles: false,
  },
  appLinks: {
    name: 'appLinks',
    icon: 'link',
    displayName: 'App Links',
    description: 'Manage application download links',
    fields: ['url'],
    searchableFields: ['url'],
    hasImages: false,
    hasFiles: false,
  },
};

export const getCollectionConfig = (collection: CollectionName): CollectionConfig => {
  return collections[collection];
};

export const getCollectionDisplayName = (collection: CollectionName): string => {
  return collections[collection]?.displayName || collection;
};

export const getCollectionIcon = (collection: CollectionName): string => {
  return collections[collection]?.icon || 'folder';
};
