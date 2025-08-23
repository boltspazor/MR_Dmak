import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  imageUrl?: string;
  type: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    default: 'text',
    enum: ['text', 'image', 'mixed']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'messages'
});

export default mongoose.model<IMessage>('Message', messageSchema);