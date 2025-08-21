export interface Message {
    id: string;
    content: string;
    imageUrl?: string;
    messageType: MessageType;
    createdAt: Date;
  }
  
  export interface MessageCreateInput {
    content: string;
    imageUrl?: string;
    messageType?: MessageType;
  }
  
  export interface MessageUpdateInput {
    content?: string;
    imageUrl?: string;
    messageType?: MessageType;
  }
  
  export interface MessageResponse {
    id: string;
    content: string;
    imageUrl?: string;
    messageType: MessageType;
    createdAt: Date;
    campaignCount?: number;
  }
  
  export interface MessageWithCampaigns extends MessageResponse {
    campaigns: {
      id: string;
      targetGroups: string[];
      status: string;
      createdAt: Date;
      totalRecipients: number;
    }[];
  }
  
  export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    variables: string[];
    category: MessageCategory;
    isActive: boolean;
    usageCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface MessageTemplateCreateInput {
    name: string;
    content: string;
    variables?: string[];
    category: MessageCategory;
    isActive?: boolean;
  }
  
  export interface MessageTemplateUpdateInput {
    name?: string;
    content?: string;
    variables?: string[];
    category?: MessageCategory;
    isActive?: boolean;
  }
  
  export interface MessagePreview {
    content: string;
    imageUrl?: string;
    targetGroups: string[];
    recipientCount: number;
    estimatedCost?: number;
    characterCount: number;
    smsCount: number;
    containsImage: boolean;
    scheduledFor?: Date;
  }
  
  export interface MessageValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    characterCount: number;
    smsCount: number;
    hasImage: boolean;
    estimatedCost?: number;
  }
  
  export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    DOCUMENT = 'document',
    TEMPLATE = 'template'
  }
  
  export enum MessageCategory {
    GREETING = 'greeting',
    PROMOTION = 'promotion',
    REMINDER = 'reminder',
    ANNOUNCEMENT = 'announcement',
    FOLLOW_UP = 'follow_up',
    EMERGENCY = 'emergency',
    CUSTOM = 'custom'
  }
  
  export interface MessageStats {
    totalMessages: number;
    totalCampaigns: number;
    totalRecipients: number;
    averageLength: number;
    popularTemplates: {
      id: string;
      name: string;
      usageCount: number;
    }[];
    messageTypeDistribution: Record<MessageType, number>;
    categoryDistribution: Record<MessageCategory, number>;
  }