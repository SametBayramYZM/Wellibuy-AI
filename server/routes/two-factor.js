import express, { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import TwoFactor from '../models/TwoFactor';
import { authenticate } from '../middleware/auth';
import { setAuditLog } from '../middleware/audit';

/**
 * 🔐 Two-Factor Authentication (2FA) Routes
 * 
 * TOTP-based 2FA with backup codes
 */

const router = express.Router();

/**
 * POST /api/2fa/setup
 * Generate TOTP secret and QR code for 2FA setup
 */
router.post('/setup', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Wellibuy (${req.user.email})`,
      issuer: 'Wellibuy',
      length: 32,
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store in session temporarily (not saved yet)
    (req.session as any).twoFactorSetup = {
      secret: secret.base32,
      backupCodes,
      setupTime: Date.now(),
    };

    setAuditLog(req, '2FA setup initiated', 'SECURITY_CHANGE', 'TwoFactor', userId);

    res.json({
      success: true,
      qrCode,
      secret: secret.base32,
      backupCodes,
      message:
        'Scan the QR code with Google Authenticator or similar app, then verify with a code',
    });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
    });
  }
});

/**
 * POST /api/2fa/verify
 * Verify TOTP code and enable 2FA
 */
router.post('/verify', authenticate, async (req: any, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    const setupData = (req.session as any).twoFactorSetup;

    if (!setupData) {
      return res.status(400).json({
        success: false,
        message: '2FA setup not initiated',
      });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: setupData.secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow ±2 time windows
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Check if 2FA already exists
    let twoFactor = await TwoFactor.findOne({ userId });

    if (!twoFactor) {
      twoFactor = new TwoFactor({
        userId,
        secret: setupData.secret,
        backupCodes: setupData.backupCodes.map((code: string) => ({
          code,
          used: false,
        })),
        isEnabled: true,
        enabledAt: new Date(),
      });
    } else {
      twoFactor.secret = setupData.secret;
      twoFactor.backupCodes = setupData.backupCodes.map((code: string) => ({
        code,
        used: false,
      }));
      twoFactor.isEnabled = true;
      twoFactor.enabledAt = new Date();
    }

    await twoFactor.save();

    // Clear setup data
    delete (req.session as any).twoFactorSetup;

    setAuditLog(
      req,
      '2FA enabled',
      'SECURITY_CHANGE',
      'TwoFactor',
      userId
    );

    res.json({
      success: true,
      message: '2FA enabled successfully. Save your backup codes in a secure location.',
    });
  } catch (err) {
    console.error('2FA verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA',
    });
  }
});

/**
 * POST /api/2fa/validate
 * Validate 2FA code during login
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or code',
      });
    }

    const twoFactor = await TwoFactor.findOne({ userId, isEnabled: true });

    if (!twoFactor) {
      return res.status(400).json({
        success: false,
        message: '2FA not enabled for this user',
      });
    }

    // Try to verify TOTP code
    let isValid = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    // If TOTP fails, check backup codes
    if (!isValid) {
      const backupCode = twoFactor.backupCodes.find(
        (bc) => bc.code === code && !bc.used
      );

      if (backupCode) {
        backupCode.used = true;
        await twoFactor.save();
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA code',
      });
    }

    res.json({
      success: true,
      message: '2FA code verified',
    });
  } catch (err) {
    console.error('2FA validation error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to validate 2FA code',
    });
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA
 */
router.post('/disable', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Disable 2FA
    const twoFactor = await TwoFactor.findOneAndUpdate(
      { userId },
      {
        isEnabled: false,
        disabledAt: new Date(),
      }
    );

    setAuditLog(
      req,
      '2FA disabled',
      'SECURITY_CHANGE',
      'TwoFactor',
      userId
    );

    res.json({
      success: true,
      message: '2FA disabled',
    });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
    });
  }
});

/**
 * GET /api/2fa/status
 * Check 2FA status
 */
router.get('/status', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const twoFactor = await TwoFactor.findOne({ userId });

    const backupCodesRemaining = twoFactor
      ? twoFactor.backupCodes.filter((bc) => !bc.used).length
      : 0;

    res.json({
      success: true,
      isEnabled: twoFactor?.isEnabled || false,
      backupCodesRemaining,
      enabledAt: twoFactor?.enabledAt,
    });
  } catch (err) {
    console.error('2FA status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status',
    });
  }
});

/**
 * GET /api/2fa/backup-codes
 * Get remaining backup codes
 */
router.get('/backup-codes', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const twoFactor = await TwoFactor.findOne({ userId });

    if (!twoFactor) {
      return res.status(404).json({
        success: false,
        message: '2FA not enabled',
      });
    }

    const remainingCodes = twoFactor.backupCodes
      .filter((bc) => !bc.used)
      .map((bc) => bc.code);

    res.json({
      success: true,
      backupCodes: remainingCodes,
    });
  } catch (err) {
    console.error('Backup codes error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup codes',
    });
  }
});

export default router;
