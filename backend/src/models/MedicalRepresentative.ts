import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalRepresentative extends Document {
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  comments?: string;
  groupId: mongoose.Types.ObjectId;
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
  comments: {
    type: String,
    trim: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  }
}, {
  timestamps: true,
  collection: 'medical_representatives'
});

export default mongoose.model<IMedicalRepresentative>('MedicalRepresentative', medicalRepresentativeSchema);