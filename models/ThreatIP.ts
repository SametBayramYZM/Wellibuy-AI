import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🚨 Threat IP Model
 * 
 * Store known malicious IPs from threat intelligence feeds
 */

export interface IThreatIP extends Document {
  ipAddress: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  category: string[]; // ['spam', 'botnet', 'malware', 'phishing']
  source: string; // Threat feed source
  firstSeen: Date;
  lastSeen: Date;
  confidence: number; // 0-100
  details?: any;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

const threatIPSchema = new Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    threatLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    category: {
      type: [String],
      enum: ['spam', 'botnet', 'malware', 'phishing', 'scanner', 'proxy', 'vpn'],
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    details: Schema.Types.Mixed,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

// TTL index
threatIPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IThreatIP>('ThreatIP', threatIPSchema);
