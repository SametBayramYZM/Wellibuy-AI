import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 Device Tracking Model
 * 
 * Tracks devices used for login
 */

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  deviceName: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
  deviceId: string; // Unique device identifier
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastUsedAt: Date;
  firstSeenAt: Date;
  isTrusted: boolean;
  createdAt: Date;
}

const deviceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    isTrusted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
deviceSchema.index({ userId: 1, isActive: 1 });
deviceSchema.index({ userId: 1, lastUsedAt: -1 });

export default mongoose.model<IDevice>('Device', deviceSchema);
