import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔑 API Key Management Model
 * 
 * Store API keys for third-party access and rate limiting
 */

export interface IAPIKey extends Document {
  userId: mongoose.Types.ObjectId;
  keyName: string;
  keyPrefix: string; // For display: sk_live_****
  hashedKey: string; // Hashed for security
  scopes: string[]; // Permissions: ['read', 'write', 'admin']
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    keyName: {
      type: String,
      required: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    hashedKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    scopes: {
      type: [String],
      enum: ['read', 'write', 'admin', 'products', 'orders', 'users'],
      default: ['read'],
    },
    rateLimit: {
      requestsPerMinute: {
        type: Number,
        default: 60,
      },
      requestsPerDay: {
        type: Number,
        default: 10000,
      },
    },
    lastUsedAt: Date,
    expiresAt: {
      type: Date,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index for expired keys
apiKeySchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { isActive: true },
  }
);

export default mongoose.model<IAPIKey>('APIKey', apiKeySchema);
