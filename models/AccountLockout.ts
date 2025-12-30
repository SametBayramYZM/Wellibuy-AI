import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔒 Account Lockout Model
 * 
 * Track failed login attempts and account lockouts
 */

export interface IAccountLockout extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  ipAddress: string;
  failedAttempts: number;
  isLocked: boolean;
  lockedAt?: Date;
  unlockAt?: Date;
  lastAttemptAt: Date;
  attempts: Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const accountLockoutSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    lockedAt: Date,
    unlockAt: {
      type: Date,
      index: true,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    attempts: [
      {
        timestamp: Date,
        ipAddress: String,
        userAgent: String,
      },
    ],
  },
  { timestamps: true }
);

// TTL index for auto-unlock
accountLockoutSchema.index(
  { unlockAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { isLocked: true },
  }
);

export default mongoose.model<IAccountLockout>('AccountLockout', accountLockoutSchema);
