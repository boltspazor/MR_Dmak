// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthUser extends User {
  // Additional auth-specific fields if needed
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

// Group Types
export interface Group {
  id: string;
  groupName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    medicalRepresentatives: number;
  };
}

export interface GroupStats {
  id: string;
  groupName: string;
  totalMRs: number;
  activeMRs: number;
  inactiveMRs: number;
  totalCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  averageDeliveryRate: number;
  recentlyAdded: number;
}

export interface GroupActivity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

// Medical Representative Types
export interface MedicalRepresentative {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  groupId: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  group?: Group;
}

export interface MedicalRepresentativeResponse {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  comments?: string;
  groupId: string;
  group: {
    id: string;
    groupName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Message Types
export interface Message {
  id: string;
  content: string;
  imageUrl?: string;
  type: 'text' | 'image';
  createdAt: string;
}

export interface MessageCampaign {
  id: string;
  messageId: string;
  createdBy: string;
  scheduledAt?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  message: Message;
  _count?: {
    messageLogs: number;
  };
}

export interface MessageLog {
  id: string;
  campaignId: string;
  mrId: string;
  phoneNumber: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  medicalRepresentative: MedicalRepresentativeResponse;
}

export interface SendMessageRequest {
  content: string;
  targetGroups: string[];
  imageUrl?: string;
  scheduledAt?: string;
}

// Campaign Report Types
export interface CampaignReport {
  campaign: MessageCampaign;
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

export interface DetailedCampaignReport extends CampaignReport {
  groupStats: Record<string, {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }>;
  timeline: Array<{
    time: string;
    status: string;
    mrName: string;
    groupName: string;
  }>;
}

// Dashboard Types
export interface DashboardStats {
  totalMRs: number;
  totalGroups: number;
  totalCampaigns: number;
  totalMessagesSent: number;
  successRate: string;
  pendingMessages: number;
  recentActivity: {
    campaigns: number;
    messagesSent: number;
    messagesReceived: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  [key: string]: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Form Types
export interface CreateGroupForm {
  groupName: string;
  description: string;
}

export interface CreateMRForm {
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  groupId: string;
  comments: string;
}

export interface UpdateMRForm {
  mrId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  groupId?: string;
  comments?: string;
}

// Bulk Operations
export interface BulkDeleteRequest {
  groupIds: string[];
}

export interface BulkMoveRequest {
  mrIds: string[];
  sourceGroupId: string;
}

export interface BulkUploadResponse {
  created: number;
  errors: string[];
}

// File Upload
export interface FileUploadResponse {
  message: string;
  imageUrl?: string;
  filename?: string;
}

// Search and Filter Types
export interface SearchFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  groupId?: string;
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Table Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onSort?: (key: keyof T, order: 'asc' | 'desc') => void;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
}
