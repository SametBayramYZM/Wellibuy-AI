import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateMagicLink,
  verifyMagicLink,
  generateEmailOTP,
  verifyEmailOTP,
} from '../services/passwordless';

/**
 * 🔗 Passwordless Authentication Routes
 * 
 * Magic links and email OTP
 */

const router = express.Router();

/**
 * POST /api/passwordless/magic-link
 * Request magic link
 */
router.post('/magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required',
      });
    }

    const result = await generateMagicLink(
      email,
      req.ip,
      req.get('user-agent') || ''
    );

    res.json(result);
  } catch (err) {
    console.error('Magic link request error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send magic link',
    });
  }
});

/**
 * GET /api/passwordless/verify-magic-link
 * Verify magic link and login
 */
router.get('/verify-magic-link', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Token required',
      });
    }

    const result = await verifyMagicLink(
      token,
      req.ip,
      req.get('user-agent') || ''
    );

    if (result.success) {
      res.json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        message: result.message,
      });
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error('Verify magic link error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify magic link',
    });
  }
});

/**
 * POST /api/passwordless/otp
 * Request email OTP
 */
router.post('/otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required',
      });
    }

    const result = await generateEmailOTP(email);
    res.json(result);
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});

/**
 * POST /api/passwordless/verify-otp
 * Verify OTP and login
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP required',
      });
    }

    const result = await verifyEmailOTP(
      email,
      otp,
      req.ip,
      req.get('user-agent') || ''
    );

    if (result.success) {
      res.json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        message: result.message,
      });
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

export default router;
