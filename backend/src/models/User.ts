import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: string;
  marketingManagerId?: mongoose.Types.ObjectId; // For MRs to associate with marketing managers
  isMarketingManager: boolean; // Flag to identify marketing managers
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin', 'super_admin']
  },
  marketingManagerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isMarketingManager: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users'
});

export default mongoose.model<IUser>('User', userSchema);
  