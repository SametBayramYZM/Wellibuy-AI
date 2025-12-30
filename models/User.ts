import mongoose, { Schema, Document, Model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

/**
 * 🔐 User Model - Güvenli Kullanıcı Depolama
 * 
 * Features:
 * - Password hashing (bcryptjs)
 * - Email verification
 * - Role-based access
 * - Sensitive data encryption
 * - Account status tracking
 * - Audit logging integration
 */

export interface IUser extends Document {
  // Basic Info
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  
  // Address (Encrypted)
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Payment Info (Encrypted) - NEVER logged
  paymentMethods?: {
    _id?: string;
    cardHolder: string;
    cardLastFour: string; // Last 4 digits only
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
    encrypted: boolean;
  }[];
  
  // Account Status
  role: 'user' | 'admin' | 'moderator' | 'guest';
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  
  // Security
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastPasswordChange?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  
  // Account Management
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
  toJSON(): any;
}

const userSchema = new Schema<IUser>(
  {
    // Basic Info
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email'
      ]
    },
    
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
      validate: {
        validator: function(password: string) {
          // At least 1 uppercase, 1 lowercase, 1 number, 1 special char
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
        },
        message: 'Password must contain uppercase, lowercase, number, and special character'
      }
    },
    
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    
    phone: {
      type: String,
      trim: true,
      sparse: true,
      validate: {
        validator: function(phone: string) {
          return !phone || /^\+?[1-9]\d{1,14}$/.test(phone);
        },
        message: 'Please provide a valid phone number'
      }
    },
    
    // Address (Encrypted in application layer)
    address: {
      street: { type: String, maxlength: 100 },
      city: { type: String, maxlength: 50 },
      state: { type: String, maxlength: 50 },
      zipCode: { type: String, maxlength: 20 },
      country: { type: String, maxlength: 50 }
    },
    
    // Payment Methods (Encrypted in application layer)
    paymentMethods: [{
      cardHolder: { type: String, maxlength: 100 },
      cardLastFour: { type: String, minlength: 4, maxlength: 4 },
      expiryMonth: { type: Number, min: 1, max: 12 },
      expiryYear: { type: Number, min: 2025, max: 2099 },
      isDefault: { type: Boolean, default: false },
      encrypted: { type: Boolean, default: true }
    }],
    
    // Account Status
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator', 'guest'],
      default: 'user'
    },
    
    emailVerified: {
      type: Boolean,
      default: false
    },
    
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Security
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    
    twoFactorSecret: {
      type: String,
      select: false
    },
    
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    lastPasswordChange: Date,
    lastLogin: Date,
    
    // Phone Verification (Phase 4)
    phoneNumber: {
      type: String,
      sparse: true
    },
    
    phoneVerified: {
      type: Boolean,
      default: false
    },
    
    phoneVerifiedAt: Date,
    
    // Subscription Tier (Phase 4)
    subscriptionTier: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free'
    },
    
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    
    lockUntil: {
      type: Date,
      select: false
    },
    
    // Account Management
    isActive: {
      type: Boolean,
      default: true
    },
    
    deletedAt: {
      type: Date,
      default: null,
      select: false
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(this: IUser, next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Don't return password or sensitive fields
 */
userSchema.post('find', function(this: any, docs: IUser[]) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      doc.toJSON();
    });
  }
});

/**
 * Compare password with hash
 */
userSchema.methods.comparePassword = async function(this: IUser, password: string): Promise<boolean> {
  return await bcryptjs.compare(password, this.password);
};

/**
 * Generate email verification token
 */
userSchema.methods.generateEmailVerificationToken = function(this: IUser): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

/**
 * Generate password reset token
 */
userSchema.methods.generatePasswordResetToken = function(this: IUser): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return token;
};

/**
 * Increment login attempts
 */
userSchema.methods.incrementLoginAttempts = async function(this: IUser): Promise<void> {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  } else {
    const updates: any = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 attempts
    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
      updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
    }
    
    await this.updateOne(updates);
  }
};

/**
 * Reset login attempts
 */
userSchema.methods.resetLoginAttempts = async function(this: IUser): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Check if account is locked
 */
userSchema.methods.isLocked = function(this: IUser): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/**
 * Safe JSON response (no passwords/secrets)
 */
userSchema.methods.toJSON = function(this: IUser) {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.twoFactorSecret;
  delete user.loginAttempts;
  delete user.lockUntil;
  delete user.__v;
  return user;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
