import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔑 Password History Model
 * 
 * Track password changes to enforce unique password policy
 */

export interface IPasswordHistory extends Document {
  userId: mongoose.Types.ObjectId;
  hashedPassword: string;
  createdAt: Date;
  expiresAt: Date;
}

const passwordHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  { timestamps: false }
);

// TTL index - keep history for 1 year by default
passwordHistorySchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

// Compound index for quick lookups
passwordHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IPasswordHistory>(
  'PasswordHistory',
  passwordHistorySchema
);
