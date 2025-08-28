import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageCampaign extends Document {
  messageId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  targetGroups: string[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
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
  targetGroups: {
    type: [String],
    default: []
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
  scheduledAt: {
    type: Date
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'sending', 'completed', 'failed']
  }
}, {
  timestamps: true,
  collection: 'message_campaigns'
});

export default mongoose.model<IMessageCampaign>('MessageCampaign', messageCampaignSchema);