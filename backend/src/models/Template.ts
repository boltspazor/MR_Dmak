import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  content: string; // HTML content or text content with placeholders
  type: 'html' | 'text' | 'image';
  imageUrl?: string; // Header image for templates
  footerImageUrl?: string; // Footer image for templates
  parameters: string[]; // Array of parameter names like ['Param1', 'Param2', 'Param3']
  createdBy: mongoose.Types.ObjectId; // Marketing manager who created the template
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['html', 'text', 'image'],
    default: 'text'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  footerImageUrl: {
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
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'templates'
});

// Index for efficient querying
templateSchema.index({ createdBy: 1, isActive: 1 });
templateSchema.index({ name: 1 });

export default mongoose.model<ITemplate>('Template', templateSchema);
