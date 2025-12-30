import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 IP Blacklist/Whitelist Model
 * 
 * Manage blocked and trusted IP addresses
 */

export interface IIPBlacklist extends Document {
  ipAddress: string;
  type: 'BLACKLIST' | 'WHITELIST';
  reason?: string;
  addedBy?: mongoose.Types.ObjectId; // Admin who added it
  expiresAt?: Date; // Temporary block
  createdAt: Date;
}

const ipBlacklistSchema = new Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['BLACKLIST', 'WHITELIST'],
      required: true,
      index: true,
    },
    reason: String,
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index for temporary blocks
ipBlacklistSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { type: 'BLACKLIST' },
  }
);

export default mongoose.model<IIPBlacklist>('IPBlacklist', ipBlacklistSchema);
