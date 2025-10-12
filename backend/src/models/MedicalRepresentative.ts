import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalRepresentative extends Document {
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  comments?: string;
  groupId?: mongoose.Types.ObjectId;
  marketingManagerId: mongoose.Types.ObjectId; // Associate MR with marketing manager
  metaStatus?: 'ACTIVE' | 'ERROR'; // Meta status for previous failed message status
  appStatus?: 'pending' | 'approved' | 'rejected' | 'not_requested'; // App status = consent status
  lastErrorMessage?: string; // Last error message that caused status change
  lastErrorAt?: Date; // When the last error occurred
  lastErrorCampaignId?: string; // Campaign ID where last error occurred
  createdAt: Date;
  updatedAt: Date;
}

const medicalRepresentativeSchema = new Schema<IMedicalRepresentative>({
  mrId: {
    type: String,
    required: true,
    unique: true,
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
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  marketingManagerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metaStatus: {
    type: String,
    enum: ['ACTIVE', 'ERROR'],
    default: 'ACTIVE'
  },
  appStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_requested'],
    default: 'not_requested'
  },
  lastErrorMessage: {
    type: String,
    trim: true
  },
  lastErrorAt: {
    type: Date
  },
  lastErrorCampaignId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'medical_representatives'
});

export default mongoose.model<IMedicalRepresentative>('MedicalRepresentative', medicalRepresentativeSchema);