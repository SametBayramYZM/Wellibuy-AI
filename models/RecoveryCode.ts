import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔑 Recovery Code Model
 * 
 * One-time recovery codes for account access
 */

export interface IRecoveryCode extends Document {
  userId: mongoose.Types.ObjectId;
  codes: Array<{
    code: string; // Hashed
    isUsed: boolean;
    usedAt?: Date;
    usedIp?: string;
  }>;
  generatedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const recoveryCodeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    codes: [
      {
        code: {
          type: String,
          required: true,
        },
        isUsed: {
          type: Boolean,
          default: false,
        },
        usedAt: Date,
        usedIp: String,
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IRecoveryCode>('RecoveryCode', recoveryCodeSchema);
