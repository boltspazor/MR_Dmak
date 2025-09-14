import mongoose, { Document, Schema } from 'mongoose';

export interface IAllowedRecipient extends Document {
  phoneNumber: string;
  formattedPhoneNumber: string;
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
  isActive: boolean;
  notes?: string;
}

const allowedRecipientSchema = new Schema<IAllowedRecipient>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  formattedPhoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'allowed_recipients'
});

// Index for faster queries
allowedRecipientSchema.index({ phoneNumber: 1 });
allowedRecipientSchema.index({ isActive: 1 });

export default mongoose.model<IAllowedRecipient>('AllowedRecipient', allowedRecipientSchema);
