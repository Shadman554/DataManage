export * from '@shared/schema';

export interface FileUploadResult {
  url: string;
}

export interface SearchFilters {
  query: string;
  field?: string;
  category?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface BulkAction {
  action: 'delete' | 'update';
  ids: string[];
  data?: any;
}
