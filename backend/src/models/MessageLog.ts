
import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  mrId: mongoose.Types.ObjectId;
  phoneNumber: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageLogSchema = new Schema<IMessageLog>({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'MessageCampaign',
    required: true
  },
  mrId: {
    type: Schema.Types.ObjectId,
    ref: 'MedicalRepresentative',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    default: 'queued',
    enum: ['queued', 'sent', 'delivered', 'failed', 'pending']
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  errorMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'message_logs'
});

export default mongoose.model<IMessageLog>('MessageLog', messageLogSchema);