import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import RecoveryCode from '../models/RecoveryCode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * 🔑 Recovery Codes Routes
 * 
 * One-time backup codes for account access
 */

const router = express.Router();

/**
 * Generate recovery code
 */
const generateRecoveryCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * POST /api/recovery-codes/generate
 * Generate new recovery codes
 */
router.post('/generate', authenticate, async (req: Request, res: Response) => {
  try {
    // Generate 10 recovery codes
    const codes = Array.from({ length: 10 }, () => generateRecoveryCode());

    // Hash codes before storing
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        code: await bcrypt.hash(code, 10),
        isUsed: false,
      }))
    );

    // Delete existing codes
    await RecoveryCode.deleteMany({ userId: req.user.id });

    // Save new codes
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry

    await RecoveryCode.create({
      userId: req.user.id,
      codes: hashedCodes,
      generatedAt: new Date(),
      expiresAt,
    });

    res.json({
      success: true,
      codes, // Return plain codes (only time they're visible)
      message: 'Save these codes in a secure place. They can only be used once.',
    });
  } catch (err) {
    console.error('Generate recovery codes error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recovery codes',
    });
  }
});

/**
 * POST /api/recovery-codes/use
 * Use a recovery code to access account
 */
router.post('/use', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and recovery code required',
      });
    }

    const User = require('../models/User').default;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const recoveryCodes = await RecoveryCode.findOne({
      userId: user._id,
      expiresAt: { $gt: new Date() },
    });

    if (!recoveryCodes) {
      return res.status(404).json({
        success: false,
        message: 'No valid recovery codes found',
      });
    }

    // Find matching unused code
    let matchedCodeIndex = -1;
    for (let i = 0; i < recoveryCodes.codes.length; i++) {
      const storedCode = recoveryCodes.codes[i];
      
      if (!storedCode.isUsed && (await bcrypt.compare(code, storedCode.code))) {
        matchedCodeIndex = i;
        break;
      }
    }

    if (matchedCodeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used recovery code',
      });
    }

    // Mark code as used
    recoveryCodes.codes[matchedCodeIndex].isUsed = true;
    recoveryCodes.codes[matchedCodeIndex].usedAt = new Date();
    recoveryCodes.codes[matchedCodeIndex].usedIp = req.ip;
    await recoveryCodes.save();

    // Generate session token
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: 'Recovery code verified',
      accessToken,
      remainingCodes: recoveryCodes.codes.filter((c) => !c.isUsed).length,
    });
  } catch (err) {
    console.error('Use recovery code error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to use recovery code',
    });
  }
});

/**
 * GET /api/recovery-codes/status
 * Get recovery codes status
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const recoveryCodes = await RecoveryCode.findOne({
      userId: req.user.id,
      expiresAt: { $gt: new Date() },
    });

    if (!recoveryCodes) {
      return res.json({
        success: true,
        exists: false,
        total: 0,
        remaining: 0,
      });
    }

    const remaining = recoveryCodes.codes.filter((c) => !c.isUsed).length;

    res.json({
      success: true,
      exists: true,
      total: recoveryCodes.codes.length,
      remaining,
      generatedAt: recoveryCodes.generatedAt,
      expiresAt: recoveryCodes.expiresAt,
    });
  } catch (err) {
    console.error('Get recovery codes status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get recovery codes status',
    });
  }
});

/**
 * DELETE /api/recovery-codes
 * Revoke all recovery codes
 */
router.delete('/', authenticate, async (req: Request, res: Response) => {
  try {
    await RecoveryCode.deleteMany({ userId: req.user.id });

    res.json({
      success: true,
      message: 'All recovery codes revoked',
    });
  } catch (err) {
    console.error('Revoke recovery codes error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke recovery codes',
    });
  }
});

export default router;
