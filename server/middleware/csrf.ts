import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import CSRFToken from '../models/CSRFToken';

/**
 * 🛡️ CSRF Token Protection Middleware
 * 
 * Prevent Cross-Site Request Forgery attacks
 */

export interface CSRFRequest extends Request {
  csrfToken?: string;
}

/**
 * Generate CSRF token for GET requests (forms)
 */
export const generateCSRFToken = async (
  req: CSRFRequest,
  res: Response,
  next: NextFunction
) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const userId = (req as any).user?.id;
      const sessionId = req.sessionID;
      const ipAddress = req.ip;

      // Save CSRF token
      await CSRFToken.create({
        userId,
        token,
        sessionId,
        ipAddress,
        isValid: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Add token to request and locals
      req.csrfToken = token;
      res.locals.csrfToken = token;
    } catch (err) {
      console.error('CSRF token generation error:', err);
    }
  }

  next();
};

/**
 * Validate CSRF token for POST/PUT/DELETE requests
 */
export const validateCSRFToken = async (
  req: CSRFRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    const token = req.body?.csrfToken || req.headers['x-csrf-token'];

    if (!token) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token missing',
      });
    }

    // Find and validate token
    const csrfToken = await CSRFToken.findOne({
      token,
      isValid: true,
      expiresAt: { $gt: new Date() },
    });

    if (!csrfToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired CSRF token',
      });
    }

    // Verify IP and session match
    if (csrfToken.ipAddress !== req.ip) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token IP mismatch',
      });
    }

    if (csrfToken.sessionId !== req.sessionID) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token session mismatch',
      });
    }

    // Mark token as used
    csrfToken.isValid = false;
    csrfToken.usedAt = new Date();
    await csrfToken.save();

    req.csrfToken = token;
    next();
  } catch (err) {
    console.error('CSRF validation error:', err);
    res.status(500).json({
      success: false,
      message: 'CSRF validation failed',
    });
  }
};
