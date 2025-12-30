import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session';

/**
 * 🔄 Refresh Token Rotation Service
 * 
 * Implement refresh token rotation to prevent token compromise
 * Old tokens are invalidated when new tokens are issued
 */

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface DecodedToken {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Generate new token pair
 */
export const generateTokenPair = (
  userId: string,
  email: string,
  sessionId: string
): TokenPair => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
  const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';

  // Access token (short-lived)
  const accessToken = jwt.sign(
    { userId, email, sessionId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

  // Refresh token (long-lived)
  const refreshToken = jwt.sign(
    { userId, sessionId, type: 'refresh', tokenId: crypto.randomBytes(16).toString('hex') },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRE }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRE,
  };
};

/**
 * Rotate refresh token
 * Issues new token pair and invalidates old refresh token
 */
export const rotateRefreshToken = async (
  oldRefreshToken: string,
  ipAddress: string,
  userAgent: string
): Promise<TokenPair | null> => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    // Verify old refresh token
    const decoded = jwt.verify(oldRefreshToken, JWT_SECRET) as DecodedToken;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find and verify session
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new Error('Session not found or expired');
    }

    // Verify request matches session
    if (session.ipAddress !== ipAddress || session.userAgent !== userAgent) {
      // Token reuse detected! Potential security breach
      // Invalidate entire session
      await Session.updateOne(
        { sessionId: decoded.sessionId },
        { isActive: false }
      );

      console.warn(
        `🚨 Token reuse detected for user ${decoded.userId}. Session invalidated.`
      );

      throw new Error('Token reuse detected - session terminated');
    }

    // Update session last activity
    session.lastActivityAt = new Date();
    await session.save();

    // Generate new token pair
    const newTokens = generateTokenPair(
      decoded.userId,
      session.userId.toString(),
      decoded.sessionId
    );

    return newTokens;
  } catch (err: any) {
    console.error('Token rotation error:', err.message);
    return null;
  }
};

/**
 * Validate refresh token
 */
export const validateRefreshToken = (token: string): DecodedToken | null => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded;
  } catch (err) {
    return null;
  }
};

/**
 * Revoke refresh token (on logout)
 */
export const revokeRefreshToken = async (
  userId: string,
  sessionId: string
): Promise<boolean> => {
  try {
    const result = await Session.updateOne(
      { userId, sessionId },
      { isActive: false, loggedOutAt: new Date() }
    );

    return result.modifiedCount > 0;
  } catch (err) {
    console.error('Token revocation error:', err);
    return false;
  }
};

/**
 * Cleanup expired sessions
 * Run periodically (e.g., via cron job)
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(`✅ Cleaned up ${result.deletedCount} expired sessions`);
    return result.deletedCount;
  } catch (err) {
    console.error('Session cleanup error:', err);
    return 0;
  }
};

/**
 * Get active sessions for user
 */
export const getUserActiveSessions = async (
  userId: string
): Promise<any[]> => {
  try {
    return await Session.find({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .select('-refreshToken -__v')
      .sort({ lastActivityAt: -1 })
      .limit(10);
  } catch (err) {
    console.error('Get sessions error:', err);
    return [];
  }
};

/**
 * Logout from specific session
 */
export const logoutSession = async (
  userId: string,
  sessionId: string
): Promise<boolean> => {
  try {
    const result = await Session.updateOne(
      { _id: sessionId, userId },
      { isActive: false, loggedOutAt: new Date() }
    );

    return result.modifiedCount > 0;
  } catch (err) {
    console.error('Logout error:', err);
    return false;
  }
};

/**
 * Logout from all sessions except current
 */
export const logoutAllExcept = async (
  userId: string,
  currentSessionId: string
): Promise<number> => {
  try {
    const result = await Session.updateMany(
      { userId, _id: { $ne: currentSessionId } },
      { isActive: false, loggedOutAt: new Date() }
    );

    return result.modifiedCount;
  } catch (err) {
    console.error('Logout all error:', err);
    return 0;
  }
};
