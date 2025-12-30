import express, { Request, Response } from 'express';
import User from '../models/User';
import { sendEmail } from '../services/emailService';
import { generateVerificationCode } from '../utils/security';
import { authenticate } from '../middleware/auth';
import { setAuditLog } from '../middleware/audit';

/**
 * 📧 Email Verification Routes
 * 
 * Manage email verification and re-send verification codes
 */

const router = express.Router();

/**
 * POST /api/email-verification/send
 * Send verification email
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If email exists, verification code has been sent',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Check rate limiting (max 3 requests per hour)
    const recentRequests = (user as any).emailVerificationAttempts || 0;
    const lastAttempt = (user as any).lastEmailVerificationTime;

    if (lastAttempt && Date.now() - lastAttempt < 3600000) {
      if (recentRequests >= 3) {
        return res.status(429).json({
          success: false,
          message:
            'Too many verification attempts. Please try again later.',
        });
      }
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.emailVerificationCode = verificationCode;
    (user as any).emailVerificationCodeExpires = verificationCodeExpires;
    (user as any).emailVerificationAttempts = recentRequests + 1;
    (user as any).lastEmailVerificationTime = Date.now();

    await user.save();

    // Send email
    await sendEmail({
      to: email,
      subject: 'Verify Your Wellibuy Email',
      template: 'emailVerification',
      data: {
        name: user.firstName || user.email,
        code: verificationCode,
        expiresIn: '15 minutes',
      },
    });

    res.json({
      success: true,
      message: 'Verification code sent to email',
    });
  } catch (err) {
    console.error('Send verification email error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
    });
  }
});

/**
 * POST /api/email-verification/verify
 * Verify email with code
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Check code
    if (
      user.emailVerificationCode !== code ||
      !(user as any).emailVerificationCodeExpires ||
      (user as any).emailVerificationCodeExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationCode = undefined;
    (user as any).emailVerificationCodeExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
    });
  }
});

/**
 * POST /api/email-verification/resend
 * Resend verification code
 */
router.post('/resend', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Rate limiting
    const lastAttempt = (user as any).lastEmailVerificationTime;
    if (lastAttempt && Date.now() - lastAttempt < 60000) {
      return res.status(429).json({
        success: false,
        message: 'Please wait at least 1 minute before requesting another code',
      });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    user.emailVerificationCode = verificationCode;
    (user as any).emailVerificationCodeExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );
    (user as any).lastEmailVerificationTime = Date.now();

    await user.save();

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Wellibuy Email Verification Code',
      template: 'emailVerification',
      data: {
        name: user.firstName || user.email,
        code: verificationCode,
        expiresIn: '15 minutes',
      },
    });

    setAuditLog(
      req,
      'Email verification resent',
      'EMAIL_VERIFICATION',
      'User',
      userId
    );

    res.json({
      success: true,
      message: 'Verification code resent to email',
    });
  } catch (err) {
    console.error('Resend verification email error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
    });
  }
});

/**
 * GET /api/email-verification/status
 * Check email verification status
 */
router.get('/status', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('email isEmailVerified');

    res.json({
      success: true,
      email: user?.email,
      isVerified: user?.isEmailVerified,
    });
  } catch (err) {
    console.error('Get verification status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status',
    });
  }
});

export default router;
