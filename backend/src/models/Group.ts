import { MedicalRepresentativeResponse } from '../types';

export interface Group {
    id: string;
    groupName: string;
    description?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface GroupCreateInput {
    groupName: string;
    description?: string;
    createdBy: string;
  }
  
  export interface GroupUpdateInput {
    groupName?: string;
    description?: string;
  }
  
  export interface GroupResponse {
    id: string;
    groupName: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      medicalRepresentatives: number;
    };
  }
  
  export interface GroupWithMRs extends GroupResponse {
    medicalRepresentatives: MedicalRepresentativeResponse[];
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
    lastActivity?: Date;
    recentlyAdded: number; // MRs added in last 30 days
  }
  
  export interface GroupActivity {
    id: string;
    groupId: string;
    action: GroupActionType;
    description: string;
    performedBy: string;
    performerName: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }
  
  export enum GroupActionType {
    CREATED = 'created',
    UPDATED = 'updated',
    DELETED = 'deleted',
    MR_ADDED = 'mr_added',
    MR_REMOVED = 'mr_removed',
    MR_MOVED = 'mr_moved',
    CAMPAIGN_SENT = 'campaign_sent'
  }
  
  export interface GroupExportData {
    group: GroupResponse;
    medicalRepresentatives: {
      mrId: string;
      firstName: string;
      lastName: string;
      phone: string;
      comments?: string;
      joinedAt: Date;
      messageStats: {
        totalReceived: number;
        totalDelivered: number;
        deliveryRate: number;
      };
    }[];
    campaignHistory: {
      campaignId: string;
      messageContent: string;
      sentAt: Date;
      recipientCount: number;
      deliveredCount: number;
      failedCount: number;
    }[];
    summary: {
      totalMRs: number;
      totalCampaigns: number;
      totalMessagesSent: number;
      averageDeliveryRate: number;
      dateRange: {
        from: Date;
        to: Date;
      };
    };
  }
  
  export interface GroupFilters {
    search?: string;
    createdBy?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minMRs?: number;
    maxMRs?: number;
    hasActivity?: boolean;
  }
  
  export interface GroupSortOptions {
    field: 'groupName' | 'createdAt' | 'mrCount' | 'lastActivity';
    direction: 'asc' | 'desc';
  }