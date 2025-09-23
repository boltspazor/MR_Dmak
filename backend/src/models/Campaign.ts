import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: string; // Unique campaign identifier
  name: string; // Campaign name
  description?: string; // Campaign description
  
  // Core associations
  templateId: mongoose.Types.ObjectId; // Reference to Template (Meta template)
  recipientListId?: mongoose.Types.ObjectId; // Reference to TemplateRecipients (specific recipient list) - optional for direct MR campaigns
  mrIds?: mongoose.Types.ObjectId[]; // Direct MR selection for templates without parameters
  
  // Campaign metadata
  createdBy: mongoose.Types.ObjectId; // User who created the campaign
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed' | 'cancelled';
  
  // Progress tracking (calculated from MessageLog)
  totalRecipients: number; // Total number of recipients in the recipient list
  sentCount: number; // Number of messages successfully sent
  failedCount: number; // Number of messages that failed
  pendingCount: number; // Number of messages pending
  
  // Scheduling
  scheduledAt?: Date; // When the campaign should be sent
  startedAt?: Date; // When the campaign actually started
  completedAt?: Date; // When the campaign completed
  
  // Campaign settings
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>({
  campaignId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  recipientListId: {
    type: Schema.Types.ObjectId,
    ref: 'TemplateRecipients',
    required: false // Not required for direct MR campaigns
  },
  mrIds: {
    type: [Schema.Types.ObjectId],
    ref: 'MedicalRepresentative',
    required: false // Only required for direct MR campaigns
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'sending', 'completed', 'failed', 'cancelled'],
    default: 'draft'
  },
  totalRecipients: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  pendingCount: {
    type: Number,
    default: 0
  },
  scheduledAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'campaigns'
});

// Indexes for efficient querying
campaignSchema.index({ createdBy: 1, isActive: 1 });
campaignSchema.index({ templateId: 1 });
campaignSchema.index({ recipientListId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ campaignId: 1 }, { unique: true });
campaignSchema.index({ createdAt: -1 });

export default mongoose.model<ICampaign>('Campaign', campaignSchema);
