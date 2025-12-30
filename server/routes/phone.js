import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sendSMSVerification, verifySMSOTP } from '../services/sms';

/**
 * 📱 Phone Verification Routes
 */

const router = express.Router();

/**
 * POST /api/phone/send-verification
 * Send SMS verification code
 */
router.post('/send-verification', authenticate, async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number required',
      });
    }

    const result = await sendSMSVerification(phoneNumber, req.user.id);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error('Send phone verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
    });
  }
});

/**
 * POST /api/phone/verify
 * Verify SMS OTP
 */
router.post('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP required',
      });
    }

    const result = await verifySMSOTP(phoneNumber, otp, req.user.id);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error('Verify phone OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

/**
 * DELETE /api/phone/remove
 * Remove phone number from account
 */
router.delete('/remove', authenticate, async (req: Request, res: Response) => {
  try {
    const User = require('../models/User').default;
    
    await User.findByIdAndUpdate(req.user.id, {
      phoneNumber: null,
      phoneVerified: false,
      phoneVerifiedAt: null,
    });

    res.json({
      success: true,
      message: 'Phone number removed',
    });
  } catch (err) {
    console.error('Remove phone error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to remove phone number',
    });
  }
});

export default router;
