import mongoose, { Schema, Document } from 'mongoose';

/**
 * ⛔ Token Blacklist Model
 * 
 * Store revoked JWT tokens for immediate logout
 */

export interface ITokenBlacklist extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  reason: 'logout' | 'security' | 'expired' | 'admin';
  expiresAt: Date;
  createdAt: Date;
}

const tokenBlacklistSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ['logout', 'security', 'expired', 'admin'],
      default: 'logout',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index for auto-cleanup
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ITokenBlacklist>('TokenBlacklist', tokenBlacklistSchema);
