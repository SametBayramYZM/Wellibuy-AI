import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔑 WebAuthn Credential Model (FIDO2)
 * 
 * Store security keys and biometric credentials
 */

export interface IWebAuthnCredential extends Document {
  userId: mongoose.Types.ObjectId;
  credentialId: string; // Base64 encoded
  publicKey: string; // Base64 encoded
  counter: number; // Sign counter for replay protection
  deviceType: 'security-key' | 'platform' | 'cross-platform';
  deviceName?: string;
  aaguid?: string; // Authenticator AAGUID
  transports?: Array<'usb' | 'nfc' | 'ble' | 'internal'>;
  isBackupEligible: boolean;
  isBackedUp: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

const webAuthnCredentialSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    credentialId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    deviceType: {
      type: String,
      enum: ['security-key', 'platform', 'cross-platform'],
      required: true,
    },
    deviceName: String,
    aaguid: String,
    transports: [
      {
        type: String,
        enum: ['usb', 'nfc', 'ble', 'internal'],
      },
    ],
    isBackupEligible: {
      type: Boolean,
      default: false,
    },
    isBackedUp: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IWebAuthnCredential>('WebAuthnCredential', webAuthnCredentialSchema);
