import { Group } from './Group';
import { MessageLog } from './MessageLog';

export interface MedicalRepresentative {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  groupId: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRepresentativeCreateInput {
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  groupId: string;
  comments?: string;
}

export interface MedicalRepresentativeUpdateInput {
  mrId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  groupId?: string;
  comments?: string;
}

export interface MedicalRepresentativeResponse {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  group: {
    id: string;
    groupName: string;
    description?: string;
  };
}

export interface MedicalRepresentativeWithStats extends MedicalRepresentativeResponse {
  stats: {
    totalMessagesReceived: number;
    totalMessagesDelivered: number;
    totalMessagesFailed: number;
    deliveryRate: number;
    lastMessageReceived?: Date;
    averageResponseTime?: number; // in minutes
    isActive: boolean;
  };
}

export interface MRBulkUploadData {
  mrId: string;
  firstName: string;
  lastName: string;
  groupName: string;
  phone: string;
  comments?: string;
}

export interface MRBulkUploadResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: {
    row: number;
    mrId: string;
    error: string;
    data: MRBulkUploadData;
  }[];
  created: MedicalRepresentativeResponse[];
}

export interface MRImportValidation {
  isValid: boolean;
  errors: {
    row: number;
    field: string;
    message: string;
    value: string;
  }[];
  warnings: {
    row: number;
    field: string;
    message: string;
    value: string;
  }[];
  duplicates: {
    row: number;
    mrId: string;
    existingId: string;
  }[];
}

export interface MRSearchFilters {
  search?: string; // Search in name, mrId, phone
  groupId?: string;
  groupIds?: string[];
  status?: MRStatus;
  dateFrom?: Date;
  dateTo?: Date;
  hasComments?: boolean;
  phonePrefix?: string;
}

export interface MRSortOptions {
  field: 'firstName' | 'lastName' | 'mrId' | 'createdAt' | 'phone' | 'groupName';
  direction: 'asc' | 'desc';
}

export interface MRPaginationResult {
  data: MedicalRepresentativeResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: MRSearchFilters;
  sort: MRSortOptions;
}

export enum MRStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export interface MRActivity {
  id: string;
  mrId: string;
  action: MRActionType;
  description: string;
  timestamp: Date;
  performedBy?: string;
  metadata?: Record<string, any>;
}

export enum MRActionType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  MOVED_GROUP = 'moved_group',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_FAILED = 'message_failed',
  STATUS_CHANGED = 'status_changed'
}

export interface MRExportData {
  mrId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  groupName: string;
  comments?: string;
  joinedDate: string;
  lastActivityDate?: string;
  totalMessagesReceived: number;
  totalMessagesDelivered: number;
  deliveryRate: string;
  status: string;
}