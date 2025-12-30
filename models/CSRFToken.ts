import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 CSRF Token Model
 * 
 * Stores CSRF tokens for form protection
 */

export interface ICSRFToken extends Document {
  userId?: mongoose.Types.ObjectId;
  token: string;
  sessionId: string;
  ipAddress: string;
  isValid: boolean;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const csrfTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: Date,
  },
  { timestamps: true }
);

// TTL index - automatically delete expired tokens
csrfTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ICSRFToken>('CSRFToken', csrfTokenSchema);
