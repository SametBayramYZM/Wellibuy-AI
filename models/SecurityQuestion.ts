import mongoose, { Schema, Document } from 'mongoose';

/**
 * 🔐 Security Question Model
 * 
 * Store security questions for account recovery
 */

export interface ISecurityQuestion extends Document {
  userId: mongoose.Types.ObjectId;
  questions: Array<{
    question: string;
    answerHash: string; // bcrypt hashed
    createdAt: Date;
  }>;
  lastUpdatedAt: Date;
  createdAt: Date;
}

const securityQuestionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        answerHash: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISecurityQuestion>('SecurityQuestion', securityQuestionSchema);
