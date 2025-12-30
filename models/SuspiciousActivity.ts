import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 Suspicious Activity Model
 * 
 * Tracks potentially suspicious user behaviors
 */

export interface ISuspiciousActivity extends Document {
  userId?: mongoose.Types.ObjectId;
  activityType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details: {
    ipAddress?: string;
    userAgent?: string;
    previousIPs?: string[];
    location?: string;
    failedAttempts?: number;
    timestamp?: Date;
  };
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId; // Admin who resolved it
  action?: string; // What action was taken
  createdAt: Date;
}

const suspiciousActivitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        'MULTIPLE_FAILED_LOGINS',
        'UNUSUAL_IP',
        'UNUSUAL_LOCATION',
        'UNUSUAL_TIME',
        'BULK_OPERATIONS',
        'UNUSUAL_PAYMENT_AMOUNT',
        'PASSWORD_CHANGE_SUSPICIOUS',
        'API_ABUSE',
        'BRUTE_FORCE_ATTEMPT',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      ipAddress: String,
      userAgent: String,
      previousIPs: [String],
      location: String,
      failedAttempts: Number,
      timestamp: Date,
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: String,
  },
  { timestamps: true }
);

// TTL index - keep unresolved for 90 days, resolved for 30 days
suspiciousActivitySchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 2592000, // 30 days
    partialFilterExpression: { isResolved: true },
  }
);

// Indexes for common queries
suspiciousActivitySchema.index({ userId: 1, createdAt: -1 });
suspiciousActivitySchema.index({ severity: 1, isResolved: 1 });
suspiciousActivitySchema.index({ activityType: 1, createdAt: -1 });

export default mongoose.model<ISuspiciousActivity>('SuspiciousActivity', suspiciousActivitySchema);
