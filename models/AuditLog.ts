import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 Audit Log Model
 * 
 * Tracks all user actions for security and compliance
 */

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  actionType: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE' | 'PAYMENT' | 'DELETE' | 'ADMIN' | 'ERROR';
  resource: string; // What was affected (user, payment, etc)
  resourceId?: string;
  status: 'SUCCESS' | 'FAILURE';
  details: {
    ipAddress?: string;
    userAgent?: string;
    oldValue?: any;
    newValue?: any;
    errorMessage?: string;
  };
  timestamp: Date;
  createdAt: Date;
}

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'PAYMENT', 'DELETE', 'ADMIN', 'ERROR'],
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: String,
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      required: true,
      index: true,
    },
    details: {
      ipAddress: String,
      userAgent: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      errorMessage: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index - automatically delete logs older than 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ actionType: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
