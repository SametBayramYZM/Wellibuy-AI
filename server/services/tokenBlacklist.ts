import crypto from 'crypto';
import TokenBlacklist from '../models/TokenBlacklist';
import jwt from 'jsonwebtoken';

/**
 * ⛔ JWT Token Blacklist Service
 * 
 * Immediate token revocation with blacklist
 */

const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * Add token to blacklist
 */
export const blacklistToken = async (
  token: string,
  userId: string,
  reason: 'logout' | 'security' | 'expired' | 'admin'
): Promise<boolean> => {
  try {
    // Decode token to get expiry
    const decoded: any = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }

    const expiresAt = new Date(decoded.exp * 1000);

    // Add to blacklist
    await TokenBlacklist.create({
      token,
      userId,
      reason,
      expiresAt,
    });

    return true;
  } catch (err) {
    console.error('Blacklist token error:', err);
    return false;
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const blacklisted = await TokenBlacklist.findOne({ token });
    return !!blacklisted;
  } catch (err) {
    console.error('Check blacklist error:', err);
    return false;
  }
};

/**
 * Revoke all tokens for user
 */
export const revokeAllUserTokens = async (
  userId: string,
  reason: 'security' | 'admin'
): Promise<number> => {
  try {
    // Get all active sessions
    const Session = require('../models/Session').default;
    const sessions = await Session.find({ userId, isActive: true });

    let count = 0;
    for (const session of sessions) {
      if (session.refreshToken) {
        await blacklistToken(session.refreshToken, userId, reason);
        count++;
      }
      session.isActive = false;
      await session.save();
    }

    return count;
  } catch (err) {
    console.error('Revoke all tokens error:', err);
    return 0;
  }
};

/**
 * Middleware: Check token blacklist
 */
export const checkTokenBlacklist = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const isBlacklisted = await isTokenBlacklisted(token);

    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
      });
    }

    next();
  } catch (err) {
    console.error('Token blacklist middleware error:', err);
    next();
  }
};
