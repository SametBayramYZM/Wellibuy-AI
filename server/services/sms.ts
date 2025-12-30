/**
 * 📱 SMS Verification Service (Twilio)
 * 
 * Phone number verification with SMS OTP
 */

import twilio from 'twilio';
import User from '../models/User';
import crypto from 'crypto';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: any = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

interface OTPStore {
  [key: string]: {
    otp: string;
    expiresAt: Date;
    attempts: number;
  };
}

// In-memory OTP storage (use Redis in production)
const otpStore: OTPStore = {};

/**
 * Generate 6-digit OTP
 */
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send SMS verification code
 */
export const sendSMSVerification = async (
  phoneNumber: string,
  userId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio not configured');
    }

    // Validate phone number format
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return {
        success: false,
        message: 'Invalid phone number format (use E.164 format)',
      };
    }

    // Rate limiting (max 3 per hour per number)
    const key = phoneNumber;
    const now = new Date();
    
    if (otpStore[key]) {
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      if (otpStore[key].expiresAt > hourAgo && otpStore[key].attempts >= 3) {
        return {
          success: false,
          message: 'Too many attempts. Please try again later.',
        };
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    // Send SMS
    await twilioClient.messages.create({
      body: `Your Wellibuy verification code is: ${otp}. Valid for 5 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    // Store OTP
    otpStore[key] = {
      otp,
      expiresAt,
      attempts: (otpStore[key]?.attempts || 0) + 1,
    };

    return {
      success: true,
      message: 'Verification code sent',
    };
  } catch (err: any) {
    console.error('Send SMS error:', err);
    return {
      success: false,
      message: err.message || 'Failed to send SMS',
    };
  }
};

/**
 * Verify SMS OTP
 */
export const verifySMSOTP = async (
  phoneNumber: string,
  otp: string,
  userId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const key = phoneNumber;
    const stored = otpStore[key];

    if (!stored) {
      return {
        success: false,
        message: 'No verification code found for this number',
      };
    }

    // Check expiry
    if (new Date() > stored.expiresAt) {
      delete otpStore[key];
      return {
        success: false,
        message: 'Verification code expired',
      };
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return {
        success: false,
        message: 'Invalid verification code',
      };
    }

    // Update user if provided
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        phoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      });
    }

    // Remove OTP after successful verification
    delete otpStore[key];

    return {
      success: true,
      message: 'Phone number verified successfully',
    };
  } catch (err: any) {
    console.error('Verify SMS OTP error:', err);
    return {
      success: false,
      message: err.message || 'Failed to verify OTP',
    };
  }
};

/**
 * Send SMS alert
 */
export const sendSMSAlert = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    if (!twilioClient) return false;

    await twilioClient.messages.create({
      body: `⚠️ Wellibuy Security Alert: ${message}`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return true;
  } catch (err) {
    console.error('Send SMS alert error:', err);
    return false;
  }
};
