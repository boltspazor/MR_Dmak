
import { MessageCampaign } from './MessageCampaign';
import { MedicalRepresentative } from './MedicalRepresentative';

export interface MessageLog {
  id: string;
  campaignId: string;
  mrId: string;
  phoneNumber: string;
  status: MessageStatus;
  sentAt?: Date;
  deliveryStatus?: DeliveryStatus;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageLogCreateInput {
  campaignId: string;
  mrId: string;
  phoneNumber: string;
  status?: MessageStatus;
}

export interface MessageLogUpdateInput {
  status?: MessageStatus;
  sentAt?: Date;
  deliveryStatus?: DeliveryStatus;
  errorMessage?: string;
  retryCount?: number;
}

export interface MessageLogResponse {
  id: string;
  phoneNumber: string;
  status: MessageStatus;
  sentAt?: Date;
  deliveryStatus?: DeliveryStatus;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
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

export interface MessageLogWithFullDetails extends MessageLogResponse {
  campaign: {
    id: string;
    status: string;
    scheduledAt: Date;
    message: {
      content: string;
      imageUrl?: string;
      messageType: string;
    };
  };
  deliveryDetails?: {
    attempts: DeliveryAttempt[];
    totalAttempts: number;
    lastAttemptAt: Date;
    nextRetryAt?: Date;
  };
}

export interface DeliveryAttempt {
  attemptNumber: number;
  timestamp: Date;
  status: MessageStatus;
  errorCode?: string;
  errorMessage?: string;
  responseTime?: number; // in milliseconds
  whatsappMessageId?: string;
}

export interface MessageLogStats {
  campaignId: string;
  overview: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  statusDistribution: Record<MessageStatus, number>;
  deliveryStatusDistribution: Record<DeliveryStatus, number>;
  groupBreakdown: {
    groupId: string;
    groupName: string;
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    successRate: number;
  }[];
  errorAnalysis: {
    errorType: string;
    count: number;
    percentage: number;
    commonMessages: string[];
  }[];
  timeline: {
    timestamp: Date;
    status: MessageStatus;
    count: number;
  }[];
  retryAnalysis: {
    averageRetries: number;
    maxRetries: number;
    retrySuccessRate: number;
    retriesByCount: Record<number, number>;
  };
}

export interface MessageLogFilters {
  campaignId?: string;
  status?: MessageStatus;
  deliveryStatus?: DeliveryStatus;
  groupId?: string;
  mrId?: string;
  phoneNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasError?: boolean;
  retryCount?: number;
  search?: string; // Search in MR name or phone
}

export interface MessageLogSortOptions {
  field: 'sentAt' | 'status' | 'deliveryStatus' | 'retryCount' | 'mrName' | 'groupName';
  direction: 'asc' | 'desc';
}

export enum MessageStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRY_PENDING = 'retry_pending'
}

export enum DeliveryStatus {
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
  PENDING = 'pending',
  UNKNOWN = 'unknown'
}

export interface MessageLogBulkUpdateInput {
  ids: string[];
  updates: {
    status?: MessageStatus;
    deliveryStatus?: DeliveryStatus;
    errorMessage?: string;
  };
}

export interface MessageLogExportData {
  messageLogId: string;
  campaignId: string;
  campaignName: string;
  mrId: string;
  mrName: string;
  phoneNumber: string;
  groupName: string;
  messageContent: string;
  status: string;
  deliveryStatus: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
}

export interface DeliveryReport {
  campaignId: string;
  campaignName: string;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    pendingMessages: number;
    deliveryRate: number;
    averageDeliveryTime: number; // in minutes
  };
  groupPerformance: {
    groupId: string;
    groupName: string;
    total: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    averageDeliveryTime: number;
  }[];
  errorBreakdown: {
    errorType: string;
    count: number;
    percentage: number;
    resolution: string;
  }[];
  recommendations: string[];
}