import mongoose, { Document, Schema } from 'mongoose';

export interface IConsent extends Document {
  phone_e164: string;
  consented: boolean;
  categories: string[];
  channel: string;
  method: string;
  consent_text_version: string;
  timestamp_iso: Date;
  ip_hash?: string;
  device_fingerprint?: string;
  evidence?: {
    form_submission_id?: string;
    screenshot_url?: string;
    user_agent?: string;
    referrer?: string;
    session_id?: string;
  };
  opt_out?: {
    status: boolean;
    timestamp?: Date;
    reason?: string;
    method?: string;
  };
  business_name_shown: string;
  captured_by: string;
  data_processing_policy_version: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentSchema = new Schema<IConsent>({
  phone_e164: {
    type: String,
    required: true,
    unique: true,
    match: /^\+[1-9]\d{1,14}$/, // E.164 format validation
    index: true
  },
  consented: {
    type: Boolean,
    required: true,
    default: false
  },
  categories: [{
    type: String,
    required: true,
    enum: ['marketing', 'promotional', 'transactional', 'newsletter', 'updates', 'reminders']
  }],
  channel: {
    type: String,
    required: true,
    enum: ['web_form', 'whatsapp', 'sms', 'email', 'phone_call', 'in_person']
  },
  method: {
    type: String,
    required: true,
    enum: ['checkbox', 'button_click', 'verbal', 'written', 'digital_signature']
  },
  consent_text_version: {
    type: String,
    required: true,
    default: '1.0'
  },
  timestamp_iso: {
    type: Date,
    required: true,
    default: Date.now
  },
  ip_hash: {
    type: String,
    required: false
  },
  device_fingerprint: {
    type: String,
    required: false
  },
  evidence: {
    form_submission_id: String,
    screenshot_url: String,
    user_agent: String,
    referrer: String,
    session_id: String
  },
  opt_out: {
    status: {
      type: Boolean,
      default: false
    },
    timestamp: Date,
    reason: String,
    method: {
      type: String,
      enum: ['web_form', 'whatsapp', 'sms', 'email', 'phone_call', 'in_person']
    }
  },
  business_name_shown: {
    type: String,
    required: true
  },
  captured_by: {
    type: String,
    required: true,
    enum: ['system', 'admin', 'user', 'api']
  },
  data_processing_policy_version: {
    type: String,
    required: true,
    default: '1.0'
  }
}, {
  timestamps: true,
  collection: 'consents'
});

// Create unique index on phone_e164 for fast lookups
ConsentSchema.index({ phone_e164: 1 }, { unique: true });

// Create compound index for efficient queries
ConsentSchema.index({ phone_e164: 1, consented: 1 });
ConsentSchema.index({ phone_e164: 1, 'opt_out.status': 1 });
ConsentSchema.index({ timestamp_iso: 1 });
ConsentSchema.index({ business_name_shown: 1 });

// Pre-save middleware to update timestamp_iso if not provided
ConsentSchema.pre('save', function(next) {
  if (!this.timestamp_iso) {
    this.timestamp_iso = new Date();
  }
  next();
});

export default mongoose.model<IConsent>('Consent', ConsentSchema);
