// Communication related types
export interface Message {
  id: string;
  to: string;
  from: string;
  type: MessageType;
  content: MessageContent;
  status: MessageStatus;
  campaignId?: string;
  templateId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageType = 'text' | 'image' | 'template' | 'document' | 'audio' | 'video';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageContent {
  text?: string;
  media?: {
    url: string;
    caption?: string;
    filename?: string;
  };
  template?: TemplateMessage;
}

export interface TemplateMessage {
  name: string;
  language: {
    code: string;
  };
  components?: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'document' | 'video' | 'location';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
  video?: { link: string };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  type: CampaignType;
  templateId?: string;
  recipientListId?: string;
  messageContent?: MessageContent;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
export type CampaignType = 'template' | 'custom' | 'bulk';

// Template types
export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  components: TemplateComponent[];
  qualityScore?: number;
  rejectedReason?: string;
  metaTemplateId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory = 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED' | 'PAUSED';

// Recipient List types
export interface RecipientList {
  id: string;
  name: string;
  description?: string;
  recipients: Recipient[];
  totalRecipients: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  customFields?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// WhatsApp specific types
export interface WhatsAppMessage {
  to: string;
  type: MessageType;
  text?: { body: string };
  image?: { link: string; caption?: string };
  document?: { link: string; filename?: string; caption?: string };
  audio?: { link: string };
  video?: { link: string; caption?: string };
  template?: TemplateMessage;
}

export interface WhatsAppWebhookEvent {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: string;
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppStatus {
  id: string;
  status: MessageStatus;
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    href?: string;
    error_data?: {
      messaging_product: string;
      details: string;
    };
  }>;
}

// Enhanced interface for user-readable webhook data display
export interface WhatsAppWebhookDisplayData {
  messageId: string;
  phoneNumber: string;
  status: string;
  timestamp: Date;
  error?: {
    code: number;
    title: string;
    message: string;
    href?: string;
  };
  conversation?: {
    id: string;
    origin: string;
    expiration?: Date;
  };
  pricing?: {
    billable: boolean;
    model: string;
    category: string;
  };
  metadata?: {
    phoneNumberId: string;
    displayPhoneNumber: string;
  };
}

// Interface for webhook processing result
export interface WebhookProcessingResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  data: WhatsAppWebhookDisplayData[];
  timestamp: Date;
}
