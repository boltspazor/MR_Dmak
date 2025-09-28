// Enhanced WhatsApp Business Cloud API types for marketing templates and webhooks

export interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: WhatsAppTemplateComponent[];
  };
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  parameters: WhatsAppTemplateParameter[];
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'image' | 'document' | 'video' | 'location' | 'currency' | 'date_time';
  text?: string;
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename: string;
  };
  video?: {
    link: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
}

export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
    message_status: 'accepted' | 'sent' | 'delivered' | 'read' | 'failed';
  }>;
}

// Enhanced webhook event types
export interface WhatsAppWebhookEventEnhanced {
  object: 'whatsapp_business_account';
  entry: WhatsAppWebhookEntryEnhanced[];
}

export interface WhatsAppWebhookEntryEnhanced {
  id: string;
  changes: WhatsAppWebhookChangeEnhanced[];
}

export interface WhatsAppWebhookChangeEnhanced {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContactEnhanced[];
    messages?: WhatsAppMessageEnhanced[];
    statuses?: WhatsAppStatusEnhanced[];
    message_template_status_update?: WhatsAppTemplateStatusUpdate[];
    user_preferences?: WhatsAppUserPreferences[];
    phone_number_quality_update?: WhatsAppPhoneQualityUpdate[];
  };
  field: 'messages' | 'message_template_status_update' | 'user_preferences' | 'phone_number_quality_update';
}

export interface WhatsAppContactEnhanced {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppMessageEnhanced {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button' | 'template';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  context?: {
    from: string;
    id: string;
    referred_product?: {
      catalog_id: string;
      product_retailer_id: string;
    };
  };
}

export interface WhatsAppStatusEnhanced {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin: {
      type: 'authentication' | 'marketing' | 'utility' | 'service';
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: 'CBP' | 'NBP';
    category: 'authentication' | 'marketing' | 'utility' | 'service' | 'referral_conversion';
  };
  errors?: Array<{
    code: number;
        title: string;
        message: string;
        error_data?: {
          messaging_product: string;
          details: string;
        };
  }>;
}

export interface WhatsAppTemplateStatusUpdate {
  message_template_id: string;
  message_template_name: string;
  message_template_language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED' | 'PAUSED' | 'PENDING_DELETION' | 'DELETED';
  event: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED' | 'PAUSED' | 'PENDING_DELETION' | 'DELETED';
  rejection_reason?: string;
  rejection_reason_code?: string;
  rejection_reason_description?: string;
}

export interface WhatsAppUserPreferences {
  phone_number: string;
  preferences: {
    opt_in_status: 'OPTED_IN' | 'OPTED_OUT';
    opt_in_timestamp: string;
    opt_out_timestamp?: string;
  };
}

export interface WhatsAppPhoneQualityUpdate {
  phone_number: string;
  quality_rating: 'GREEN' | 'YELLOW' | 'RED';
  quality_score: number;
  quality_event: 'UPGRADE' | 'DOWNGRADE';
  timestamp: string;
}

// Campaign tracking types
export interface WhatsAppCampaignMessage {
  campaignId: string;
  messageId: string;
  recipientId: string;
  phoneNumber: string;
  templateName: string;
  templateLanguage: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  conversationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook subscription configuration
export interface WhatsAppWebhookSubscription {
  object: 'whatsapp_business_account';
  callback_url: string;
  fields: Array<'messages' | 'message_template_status_update' | 'user_preferences' | 'phone_number_quality_update'>;
  verify_token: string;
}
