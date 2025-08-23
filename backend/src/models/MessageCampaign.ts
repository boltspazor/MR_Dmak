import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageCampaign extends Document {
  messageId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  scheduledAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageCampaignSchema = new Schema<IMessageCampaign>({
  messageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'queued', 'processing', 'completed', 'failed']
  }
}, {
  timestamps: true,
  collection: 'message_campaigns'
});

export default mongoose.model<IMessageCampaign>('MessageCampaign', messageCampaignSchema);