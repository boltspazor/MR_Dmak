import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateRecipients extends Document {
  _id: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId; // Reference to the template
  name: string; // Name for this recipient list (e.g., "Sales Team Q4", "Regional Managers")
  description?: string;
  recipients: Array<{
    mrId: string; // MR ID for management
    firstName: string; // First name for management
    lastName: string; // Last name for management
    phone: string; // Phone number for sending
    email?: string; // Email for management
    groupId?: mongoose.Types.ObjectId; // Group reference
    parameters: Record<string, string>; // Template parameters: { param1: "value1", param2: "value2" }
  }>;
  createdBy: mongoose.Types.ObjectId; // User who created this recipient list
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const templateRecipientsSchema = new Schema<ITemplateRecipients>({
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template',
    required: true
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
  recipients: [{
    mrId: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group'
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'template_recipients'
});

// Index for efficient querying
templateRecipientsSchema.index({ templateId: 1, isActive: 1 });
templateRecipientsSchema.index({ createdBy: 1, isActive: 1 });
templateRecipientsSchema.index({ name: 1 });
// Compound unique index to ensure recipient list names are unique per template per user
templateRecipientsSchema.index({ templateId: 1, name: 1, createdBy: 1 }, { unique: true });

export default mongoose.model<ITemplateRecipients>('TemplateRecipients', templateRecipientsSchema);
