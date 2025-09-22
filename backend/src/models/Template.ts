import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  content: string; // HTML content or text content with placeholders
  type: 'html' | 'text' | 'image' | 'template'; // Added 'template' for Meta templates
  imageUrl?: string; // Header image for templates
  imageFileName?: string; // Original filename of header image
  footerImageUrl?: string; // Footer image for templates
  footerImageFileName?: string; // Original filename of footer image
  parameters: string[]; // Array of parameter names like ['Param1', 'Param2', 'Param3']
  createdBy?: mongoose.Types.ObjectId; // Marketing manager who created the template (optional for Meta templates)
  isActive: boolean;
  
  // Meta WhatsApp Business Platform integration fields
  metaTemplateId?: string; // Meta's template ID
  metaTemplateName?: string; // Meta's template name (may differ from our name)
  metaStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED' | 'PAUSED' | 'PENDING_DELETION'; // Meta template status
  metaCategory?: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY'; // Meta template category
  metaLanguage?: string; // Template language code (e.g., 'en_US')
  metaComponents?: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    text?: string;
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    buttons?: Array<{
      type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>; // Meta template components structure
  isMetaTemplate: boolean; // Flag to distinguish Meta templates from custom templates
  lastSyncedAt?: Date; // When we last synced with Meta
  syncStatus?: 'synced' | 'pending' | 'failed'; // Sync status with Meta
  
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['html', 'text', 'image', 'template'],
    default: 'text'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imageFileName: {
    type: String,
    trim: true
  },
  footerImageUrl: {
    type: String,
    trim: true
  },
  footerImageFileName: {
    type: String,
    trim: true
  },
  parameters: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isMetaTemplate; // Only required for custom templates, not Meta templates
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Meta WhatsApp Business Platform integration fields
  metaTemplateId: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values
  },
  metaTemplateName: {
    type: String,
    trim: true
  },
  metaStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISABLED', 'PAUSED', 'PENDING_DELETION'],
    default: 'PENDING'
  },
  metaCategory: {
    type: String,
    enum: ['AUTHENTICATION', 'MARKETING', 'UTILITY']
  },
  metaLanguage: {
    type: String,
    trim: true,
    default: 'en_US'
  },
  metaComponents: [{
    type: {
      type: String,
      enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS']
    },
    text: String,
    format: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']
    },
    buttons: [{
      type: {
        type: String,
        enum: ['URL', 'PHONE_NUMBER', 'QUICK_REPLY']
      },
      text: String,
      url: String,
      phone_number: String
    }]
  }],
  isMetaTemplate: {
    type: Boolean,
    default: false
  },
  lastSyncedAt: {
    type: Date
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'templates'
});

// Index for efficient querying
templateSchema.index({ createdBy: 1, isActive: 1 });
templateSchema.index({ name: 1 });
templateSchema.index({ metaTemplateId: 1 }, { sparse: true }); // Index for Meta template lookups
templateSchema.index({ isMetaTemplate: 1, metaStatus: 1 }); // Index for Meta template filtering
// Compound unique index to ensure template names are unique per user
templateSchema.index({ name: 1, createdBy: 1 }, { unique: true });

export default mongoose.model<ITemplate>('Template', templateSchema);
