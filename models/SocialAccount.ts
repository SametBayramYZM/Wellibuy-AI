import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 Social Account Model (OAuth 2.0)
 * 
 * Store OAuth provider accounts linked to users
 */

export interface ISocialAccount extends Document {
  userId: mongoose.Types.ObjectId;
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'apple';
  providerId: string; // Unique ID from provider
  email?: string;
  displayName?: string;
  profilePicture?: string;
  accessToken?: string; // Encrypted
  refreshToken?: string; // Encrypted
  tokenExpiresAt?: Date;
  scope?: string[];
  raw?: any; // Raw profile data from provider
  isVerified: boolean;
  isPrimary: boolean; // Primary login method
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const socialAccountSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['google', 'github', 'facebook', 'twitter', 'apple'],
      required: true,
      index: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    email: String,
    displayName: String,
    profilePicture: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    scope: [String],
    raw: Schema.Types.Mixed,
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index
socialAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });
socialAccountSchema.index({ userId: 1, provider: 1 });

export default mongoose.model<ISocialAccount>('SocialAccount', socialAccountSchema);
