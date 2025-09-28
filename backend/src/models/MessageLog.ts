
import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  mrId: string; // Changed from ObjectId to string to match recipient data
  phoneNumber: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  errorCode?: number;
  errorTitle?: string;
  errorHref?: string;
  errorDetails?: string;
  messageId?: string; // WhatsApp message ID
  templateName?: string; // Template name for tracking
  templateLanguage?: string; // Template language
  templateParameters?: Record<string, string>; // Template parameters
  sentBy?: mongoose.Types.ObjectId; // User who sent the message
  conversationId?: string;
  conversationOrigin?: string;
  conversationExpiration?: Date;
  pricingModel?: string;
  pricingCategory?: string;
  billable?: boolean;
  lastUpdated?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageLogSchema = new Schema<IMessageLog>({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign', // Updated to reference Campaign model
    required: true
  },
  mrId: {
    type: String, // Changed from ObjectId to String
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    default: 'queued',
    enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'pending']
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  errorMessage: {
    type: String,
    trim: true
  },
  errorCode: {
    type: Number
  },
  errorTitle: {
    type: String,
    trim: true
  },
  errorHref: {
    type: String,
    trim: true
  },
  errorDetails: {
    type: String,
    trim: true
  },
  messageId: {
    type: String,
    trim: true
  },
  templateName: {
    type: String,
    trim: true
  },
  templateLanguage: {
    type: String,
    trim: true
  },
  templateParameters: {
    type: Map,
    of: String
  },
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  conversationId: {
    type: String,
    trim: true
  },
  conversationOrigin: {
    type: String,
    trim: true
  },
  conversationExpiration: {
    type: Date
  },
  pricingModel: {
    type: String,
    trim: true
  },
  pricingCategory: {
    type: String,
    trim: true
  },
  billable: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'message_logs'
});

export default mongoose.model<IMessageLog>('MessageLog', messageLogSchema);