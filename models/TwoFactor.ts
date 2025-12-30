import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 Two-Factor Authentication Model
 * 
 * Stores TOTP secrets and backup codes for users
 */

export interface ITwoFactor extends Document {
  userId: mongoose.Types.ObjectId;
  secret: string; // Base32 encoded secret
  backupCodes: string[]; // Array of backup codes
  isEnabled: boolean;
  enabledAt?: Date;
  disabledAt?: Date;
  verificationCode?: string; // Current verification code
  createdAt: Date;
  updatedAt: Date;
}

const twoFactorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    secret: {
      type: String,
      required: true,
    },
    backupCodes: [
      {
        code: String,
        used: Boolean,
        usedAt: Date,
      },
    ],
    isEnabled: {
      type: Boolean,
      default: false,
    },
    enabledAt: Date,
    disabledAt: Date,
    verificationCode: String,
    verificationCodeExpires: Date,
  },
  { timestamps: true }
);

// Index for quick lookups
twoFactorSchema.index({ userId: 1 });
twoFactorSchema.index({ isEnabled: 1 });

export default mongoose.model<ITwoFactor>('TwoFactor', twoFactorSchema);
