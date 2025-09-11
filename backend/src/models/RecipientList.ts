import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipientList extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  columns: string[]; // Array of column names like ['MR id', 'First Name', 'Last Name', '#FN', '#LN', '#Month', '#week', '#Target', '#lastmonth', '#doctor']
  data: Array<Record<string, any>>; // Array of recipient data objects
  createdBy: mongoose.Types.ObjectId; // Marketing manager who created the recipient list
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recipientListSchema = new Schema<IRecipientList>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  columns: [{
    type: String,
    trim: true
  }],
  data: [{
    type: Schema.Types.Mixed
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
  collection: 'recipient_lists'
});

// Index for efficient querying
recipientListSchema.index({ createdBy: 1, isActive: 1 });
recipientListSchema.index({ name: 1 });
// Compound unique index to ensure recipient list names are unique per user
recipientListSchema.index({ name: 1, createdBy: 1 }, { unique: true });

export default mongoose.model<IRecipientList>('RecipientList', recipientListSchema);
