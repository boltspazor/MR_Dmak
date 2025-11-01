import { IUser, IGroup, IMedicalRepresentative, IMessage, IMessageCampaign, IMessageLog, IGroupActivity } from '../models';

// MongoDB Document types
export type UserDocument = IUser;
export type GroupDocument = IGroup;
export type MedicalRepresentativeDocument = IMedicalRepresentative;
export type MessageDocument = IMessage;
export type MessageCampaignDocument = IMessageCampaign;
export type MessageLogDocument = IMessageLog;
export type GroupActivityDocument = IGroupActivity;

// API Response types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isMarketingManager?: boolean; // Flag to identify marketing managers
}

export interface CreateGroupForm {
  groupName: string;
  description: string;
}

export interface CreateMRForm {
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  groupId?: string;
  comments?: string;
}

export interface UpdateMRForm {
  mrId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  groupId?: string;
  comments?: string;
}

export interface SendMessageRequest {
  content: string;
  targetGroups: string[];
  imageUrl?: string;
  scheduledAt?: string;
}

export interface MessagePayload {
  content: string;
  targetGroups: string[];
  imageUrl?: string;
  scheduledAt?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  details?: string[];
}

// Dashboard types
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

// Campaign types
export interface MessageCampaign {
  id: string;
  messageId: string;
  createdBy: string;
  scheduledAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  message: {
    id: string;
    content: string;
    imageUrl?: string;
    type: string;
    createdAt: string;
  };
  _count?: {
    messageLogs: number;
  };
}

// Group types
export interface Group {
  id: string;
  groupName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    medicalRepresentatives: number;
  };
}

// Medical Representative types
export interface MedicalRepresentative {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  comments?: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
}

// Message Log types
export interface MessageLog {
  id: string;
  campaignId: string;
  mrId: string;
  phoneNumber: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  medicalRepresentative: {
    id: string;
    mrId: string;
    firstName: string;
    lastName: string;
    group: {
      id: string;
      groupName: string;
    };
  };
}

// Campaign Report types
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
