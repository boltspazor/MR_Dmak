import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupActivity extends Document {
  groupId: mongoose.Types.ObjectId;
  action: string;
  description: string;
  performedBy: mongoose.Types.ObjectId;
  performerName: string;
  timestamp: Date;
  metadata?: any;
}

const groupActivitySchema = new Schema<IGroupActivity>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performerName: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  collection: 'group_activities'
});

export default mongoose.model<IGroupActivity>('GroupActivity', groupActivitySchema);
