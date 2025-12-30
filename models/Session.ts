import mongoose, { Schema, Document } from 'mongoose';

/**
 * 📱 Session Management Model
 * 
 * Track user sessions for login management and logout from other devices
 */

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  refreshToken: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  loggedOutAt?: Date;
}

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
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
    deviceId: String,
    refreshToken: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    loggedOutAt: Date,
  },
  { timestamps: false }
);

// TTL index for expired sessions
sessionSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

// Compound indexes for common queries
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, lastActivityAt: -1 });

export default mongoose.model<ISession>('Session', sessionSchema);
