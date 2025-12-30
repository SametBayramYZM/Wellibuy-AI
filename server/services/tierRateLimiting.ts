/**
 * ⚡ Tier-Based Rate Limiting
 * 
 * Different rate limits for free, premium, and enterprise users
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User';

/**
 * Rate limit tiers
 */
export const RATE_LIMITS = {
  free: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 requests per hour
    message: 'Free tier rate limit exceeded. Upgrade to Premium for higher limits.',
  },
  premium: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour
    message: 'Premium tier rate limit exceeded.',
  },
  enterprise: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10000, // 10000 requests per hour (virtually unlimited)
    message: 'Enterprise tier rate limit exceeded.',
  },
  anonymous: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    message: 'Anonymous rate limit exceeded. Please log in for higher limits.',
  },
};

/**
 * Get user tier from database
 */
const getUserTier = async (userId: string): Promise<keyof typeof RATE_LIMITS> => {
  try {
    const user = await User.findById(userId).select('subscriptionTier');
    
    if (!user || !user.subscriptionTier) {
      return 'free';
    }

    return user.subscriptionTier as keyof typeof RATE_LIMITS;
  } catch (err) {
    console.error('Get user tier error:', err);
    return 'free';
  }
};

/**
 * Tier-based rate limiting middleware
 */
export const tierRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // Default 1 hour
  max: async (req: Request) => {
    try {
      // Check if user is authenticated
      if (!req.user?.id) {
        return RATE_LIMITS.anonymous.max;
      }

      // Get user tier
      const tier = await getUserTier(req.user.id);
      return RATE_LIMITS[tier].max;
    } catch (err) {
      console.error('Tier rate limiter error:', err);
      return RATE_LIMITS.free.max;
    }
  },
  message: async (req: Request) => {
    if (!req.user?.id) {
      return RATE_LIMITS.anonymous.message;
    }

    const tier = await getUserTier(req.user.id);
    return RATE_LIMITS[tier].message;
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
  handler: (req: Request, res: Response) => {
    const tier = req.user?.id ? 'authenticated' : 'anonymous';
    
    res.status(429).json({
      success: false,
      message: `Rate limit exceeded for ${tier} users`,
      retryAfter: res.getHeader('Retry-After'),
      limit: res.getHeader('X-RateLimit-Limit'),
      remaining: res.getHeader('X-RateLimit-Remaining'),
      reset: res.getHeader('X-RateLimit-Reset'),
    });
  },
});

/**
 * Specific rate limiters for different endpoints
 */

// Auth endpoints (stricter)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment endpoints (very strict)
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payments per hour
  message: 'Payment rate limit exceeded. Please contact support if you need to make more transactions.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search endpoints (moderate)
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: async (req: Request) => {
    if (!req.user?.id) return 10; // Anonymous: 10/min
    
    const tier = await getUserTier(req.user.id);
    return {
      free: 20,
      premium: 100,
      enterprise: 500,
    }[tier] || 20;
  },
  message: 'Search rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to check and enforce tier limits
 */
export const checkTierLimit = (
  feature: string,
  limits: Record<string, number>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const tier = await getUserTier(req.user.id);
      const limit = limits[tier];

      if (limit === 0 || limit === undefined) {
        return res.status(403).json({
          success: false,
          message: `Feature "${feature}" not available for ${tier} tier`,
          upgrade: tier === 'free' ? 'premium' : 'enterprise',
        });
      }

      // Feature is available
      next();
    } catch (err) {
      console.error('Check tier limit error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to check tier limit',
      });
    }
  };
};

/**
 * Get current rate limit status for user
 */
export const getRateLimitStatus = async (userId: string) => {
  const tier = await getUserTier(userId);
  const limits = RATE_LIMITS[tier];

  return {
    tier,
    windowMs: limits.windowMs,
    max: limits.max,
    resetIn: limits.windowMs,
  };
};
