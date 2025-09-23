export interface Contact {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
  comments?: string;
  consentStatus?: 'pending' | 'approved' | 'rejected' | 'not_requested';
}

export interface Group {
  id: string;
  name: string;
  contactCount: number;
}

export interface SearchFilters {
  searchTerm: string;
  groupFilter: string;
  sortField: keyof Contact;
  sortDirection: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
}

export interface UploadStatus {
  status: 'uploading' | 'completed' | 'error';
  message: string;
}

export interface MRFormData {
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  groupId: string;
  comments?: string;
}
