import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔗 Magic Link Model (Passwordless Auth)
 * 
 * Store magic links for passwordless login
 */

export interface IMagicLink extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const magicLinkSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index for auto-cleanup
magicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IMagicLink>('MagicLink', magicLinkSchema);
