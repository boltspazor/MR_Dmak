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
  }
}, {
  timestamps: true,
  collection: 'medical_representatives'
});

export default mongoose.model<IMedicalRepresentative>('MedicalRepresentative', medicalRepresentativeSchema);