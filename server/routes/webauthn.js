import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateRegistration,
  verifyRegistration,
  generateAuthentication,
  verifyAuthentication,
} from '../services/webauthn';
import WebAuthnCredential from '../models/WebAuthnCredential';

/**
 * 🔑 WebAuthn / FIDO2 Routes
 * 
 * Security key and biometric authentication
 */

const router = express.Router();

/**
 * POST /api/webauthn/register/generate
 * Generate registration options for new security key
 */
router.post('/register/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const { options, challenge } = await generateRegistration(
      req.user.id,
      req.user.email
    );

    // Store challenge in session
    req.session.webauthnChallenge = challenge;

    res.json({
      success: true,
      options,
    });
  } catch (err: any) {
    console.error('Generate WebAuthn registration error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate registration options',
    });
  }
});

/**
 * POST /api/webauthn/register/verify
 * Verify registration response and save credential
 */
router.post('/register/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { response, deviceName } = req.body;
    const expectedChallenge = req.session.webauthnChallenge;

    if (!expectedChallenge) {
      return res.status(400).json({
        success: false,
        message: 'No challenge found in session',
      });
    }

    const result = await verifyRegistration(
      req.user.id,
      response,
      expectedChallenge
    );

    if (result.verified) {
      // Update device name if provided
      if (deviceName && result.credentialId) {
        await WebAuthnCredential.findOneAndUpdate(
          { credentialId: result.credentialId },
          { deviceName }
        );
      }

      // Clear challenge from session
      delete req.session.webauthnChallenge;

      res.json({
        success: true,
        message: 'Security key registered successfully',
        credentialId: result.credentialId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Registration verification failed',
      });
    }
  } catch (err: any) {
    console.error('Verify WebAuthn registration error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to verify registration',
    });
  }
});

/**
 * POST /api/webauthn/authenticate/generate
 * Generate authentication options
 */
router.post('/authenticate/generate', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user by email
    const User = require('../models/User').default;
    const user = await User.findOne({ email });

    const { options, challenge } = await generateAuthentication(
      user ? user._id.toString() : undefined
    );

    // Store challenge in session
    req.session.webauthnChallenge = challenge;

    res.json({
      success: true,
      options,
    });
  } catch (err: any) {
    console.error('Generate WebAuthn authentication error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate authentication options',
    });
  }
});

/**
 * POST /api/webauthn/authenticate/verify
 * Verify authentication response and login
 */
router.post('/authenticate/verify', async (req: Request, res: Response) => {
  try {
    const { response } = req.body;
    const expectedChallenge = req.session.webauthnChallenge;

    if (!expectedChallenge) {
      return res.status(400).json({
        success: false,
        message: 'No challenge found in session',
      });
    }

    const result = await verifyAuthentication(response, expectedChallenge);

    if (result.verified && result.userId) {
      // Clear challenge from session
      delete req.session.webauthnChallenge;

      // Generate JWT token
      const jwt = require('jsonwebtoken');
      const accessToken = jwt.sign(
        { userId: result.userId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: result.userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Authentication successful',
        accessToken,
        refreshToken,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Authentication verification failed',
      });
    }
  } catch (err: any) {
    console.error('Verify WebAuthn authentication error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to verify authentication',
    });
  }
});

/**
 * GET /api/webauthn/credentials
 * Get user's registered security keys
 */
router.get('/credentials', authenticate, async (req: Request, res: Response) => {
  try {
    const credentials = await WebAuthnCredential.find({ userId: req.user.id })
      .select('deviceType deviceName createdAt lastUsedAt')
      .sort('-createdAt');

    res.json({
      success: true,
      credentials,
    });
  } catch (err) {
    console.error('Get WebAuthn credentials error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get credentials',
    });
  }
});

/**
 * DELETE /api/webauthn/credentials/:id
 * Remove a security key
 */
router.delete('/credentials/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const credential = await WebAuthnCredential.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found',
      });
    }

    res.json({
      success: true,
      message: 'Security key removed successfully',
    });
  } catch (err) {
    console.error('Delete WebAuthn credential error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete credential',
    });
  }
});

export default router;
