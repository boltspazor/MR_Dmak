import { Message } from './Message';
import { User } from './User';
import { MessageLog } from './MessageLog';

export interface MessageCampaign {
  id: string;
  messageId: string;
  targetGroups: string[];
  scheduledAt: Date;
  status: CampaignStatus;
  createdBy: string;
  createdAt: Date;
}

export interface MessageCampaignCreateInput {
  messageId: string;
  targetGroups: string[];
  scheduledAt?: Date;
  createdBy: string;
}

export interface MessageCampaignUpdateInput {
  targetGroups?: string[];
  scheduledAt?: Date;
  status?: CampaignStatus;
}

export interface MessageCampaignResponse {
  id: string;
  targetGroups: string[];
  scheduledAt: Date;
  status: CampaignStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  message: {
    id: string;
    content: string;
    imageUrl?: string;
    messageType: string;
  };
  stats: CampaignStats;
}

export interface MessageCampaignWithDetails extends MessageCampaignResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  groupNames: string[];
  progress: CampaignProgress;
  timeline: CampaignTimelineEvent[];
}

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  cancelled: number;
  successRate: number;
  deliveryRate: number;
  failureRate: number;
}

export interface CampaignProgress {
  percentage: number;
  currentPhase: CampaignPhase;
  estimatedTimeRemaining?: number; // in minutes
  messagesPerMinute: number;
  startTime?: Date;
  endTime?: Date;
}

export interface CampaignAnalytics {
  campaignId: string;
  overview: CampaignStats;
  groupBreakdown: GroupCampaignStats[];
  timelineAnalysis: CampaignTimelineEvent[];
  deliveryTrends: DeliveryTrend[];
  errorAnalysis: ErrorAnalysis;
  performance: PerformanceMetrics;
}

export interface GroupCampaignStats {
  groupId: string;
  groupName: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  successRate: number;
  averageDeliveryTime: number; // in seconds
}

export interface CampaignTimelineEvent {
  id: string;
  campaignId: string;
  timestamp: Date;
  event: CampaignEventType;
  count?: number;
  details?: string;
  metadata?: Record<string, any>;
}

export interface DeliveryTrend {
  timestamp: Date;
  sent: number;
  delivered: number;
  failed: number;
  rate: number; // messages per minute
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorTypes: {
    type: string;
    count: number;
    percentage: number;
    examples: string[];
  }[];
  commonPatterns: {
    pattern: string;
    count: number;
    suggestion: string;
  }[];
}

export interface PerformanceMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  averageMessageProcessingTime: number; // in seconds
  peakRate: number; // messages per minute
  averageRate: number; // messages per minute
  systemLoad: {
    cpu: number;
    memory: number;
    queue: number;
  };
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  SENDING = 'sending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export enum CampaignPhase {
  PREPARATION = 'preparation',
  VALIDATION = 'validation',
  QUEUING = 'queuing',
  SENDING = 'sending',
  MONITORING = 'monitoring',
  COMPLETION = 'completion'
}

export enum CampaignEventType {
  CREATED = 'created',
  SCHEDULED = 'scheduled',
  STARTED = 'started',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_FAILED = 'message_failed',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export interface CampaignFilters {
  status?: CampaignStatus;
  createdBy?: string;
  targetGroup?: string;
  dateFrom?: Date;
  dateTo?: Date;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  messageType?: string;
  minRecipients?: number;
  maxRecipients?: number;
}

export interface CampaignSortOptions {
  field: 'createdAt' | 'scheduledAt' | 'status' | 'recipientCount' | 'successRate';
  direction: 'asc' | 'desc';
}