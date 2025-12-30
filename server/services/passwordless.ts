import crypto from 'crypto';
import MagicLink from '../models/MagicLink';
import User from '../models/User';
import { sendEmail } from '../services/emailService';
import { generateTokenPair } from '../services/tokenRotation';
import Session from '../models/Session';

/**
 * 🔗 Passwordless Authentication Service
 * 
 * Magic links and email OTP for login without passwords
 */

/**
 * Generate magic link
 */
export const generateMagicLink = async (
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If account exists, magic link has been sent',
      };
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save magic link
    await MagicLink.create({
      userId: user._id,
      email,
      token,
      ipAddress,
      userAgent,
      isUsed: false,
      expiresAt,
    });

    // Send email with magic link
    const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/magic-link?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Your Login Link - Wellibuy',
      template: 'magicLink',
      data: {
        name: user.firstName || user.email,
        magicLink: magicLinkUrl,
        expiresIn: '15 minutes',
        ipAddress,
      },
    });

    return {
      success: true,
      message: 'Magic link sent to your email',
    };
  } catch (err) {
    console.error('Generate magic link error:', err);
    return {
      success: false,
      message: 'Failed to generate magic link',
    };
  }
};

/**
 * Verify magic link and login
 */
export const verifyMagicLink = async (
  token: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  message: string;
}> => {
  try {
    // Find magic link
    const magicLink = await MagicLink.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!magicLink) {
      return {
        success: false,
        message: 'Invalid or expired magic link',
      };
    }

    // Verify IP and user agent match (optional - can be relaxed)
    // if (magicLink.ipAddress !== ipAddress) {
    //   return {
    //     success: false,
    //     message: 'Magic link IP mismatch',
    //   };
    // }

    // Get user
    const user = await User.findById(magicLink.userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Mark as used
    magicLink.isUsed = true;
    magicLink.usedAt = new Date();
    await magicLink.save();

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const tokens = generateTokenPair(user._id.toString(), user.email, sessionId);

    // Create session
    await Session.create({
      userId: user._id,
      sessionId,
      ipAddress,
      userAgent,
      refreshToken: tokens.refreshToken,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Login successful',
    };
  } catch (err) {
    console.error('Verify magic link error:', err);
    return {
      success: false,
      message: 'Failed to verify magic link',
    };
  }
};

/**
 * Generate email OTP (6-digit code)
 */
export const generateEmailOTP = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return {
        success: true,
        message: 'If account exists, OTP has been sent',
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store in user document (temporary)
    (user as any).emailOTP = otpHash;
    (user as any).emailOTPExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    // Send email
    await sendEmail({
      to: email,
      subject: 'Your Login Code - Wellibuy',
      template: 'emailOTP',
      data: {
        name: user.firstName || user.email,
        otp,
        expiresIn: '5 minutes',
      },
    });

    return {
      success: true,
      message: 'OTP sent to your email',
    };
  } catch (err) {
    console.error('Generate OTP error:', err);
    return {
      success: false,
      message: 'Failed to generate OTP',
    };
  }
};

/**
 * Verify email OTP
 */
export const verifyEmailOTP = async (
  email: string,
  otp: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  message: string;
}> => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    // Check OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const storedOTP = (user as any).emailOTP;
    const expiresAt = (user as any).emailOTPExpires;

    if (!storedOTP || !expiresAt || expiresAt < new Date()) {
      return {
        success: false,
        message: 'OTP expired or not found',
      };
    }

    if (otpHash !== storedOTP) {
      return {
        success: false,
        message: 'Invalid OTP',
      };
    }

    // Clear OTP
    (user as any).emailOTP = undefined;
    (user as any).emailOTPExpires = undefined;
    await user.save();

    // Generate session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const tokens = generateTokenPair(user._id.toString(), user.email, sessionId);

    await Session.create({
      userId: user._id,
      sessionId,
      ipAddress,
      userAgent,
      refreshToken: tokens.refreshToken,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Login successful',
    };
  } catch (err) {
    console.error('Verify OTP error:', err);
    return {
      success: false,
      message: 'Failed to verify OTP',
    };
  }
};
