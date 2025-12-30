import express, { Request, Response } from 'express';
import crypto from 'crypto';
import APIKey from '../models/APIKey';
import { authenticate } from '../middleware/auth';
import { setAuditLog } from '../middleware/audit';

/**
 * 🔑 API Key Management Routes
 * 
 * Create, revoke, and manage API keys
 */

const router = express.Router();

/**
 * Helper: Hash API key
 */
const hashAPIKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Helper: Generate API key
 */
const generateAPIKey = (): { key: string; prefix: string } => {
  const key = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = key.substring(0, 20) + '****';
  return { key, prefix };
};

/**
 * GET /api/api-keys
 * List user's API keys
 */
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const keys = await APIKey.find({ userId, isActive: true })
      .select('-hashedKey -__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      keys: keys.map((key) => ({
        id: key._id,
        name: key.keyName,
        prefix: key.keyPrefix,
        scopes: key.scopes,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
      })),
      count: keys.length,
    });
  } catch (err) {
    console.error('Get API keys error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get API keys',
    });
  }
});

/**
 * POST /api/api-keys
 * Create new API key
 */
router.post('/', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { keyName, scopes, expiresAt, rateLimitPerMinute, rateLimitPerDay } =
      req.body;

    if (!keyName) {
      return res.status(400).json({
        success: false,
        message: 'Key name is required',
      });
    }

    // Generate key
    const { key, prefix } = generateAPIKey();
    const hashedKey = hashAPIKey(key);

    const apiKey = new APIKey({
      userId,
      keyName,
      keyPrefix: prefix,
      hashedKey,
      scopes: scopes || ['read'],
      rateLimit: {
        requestsPerMinute: rateLimitPerMinute || 60,
        requestsPerDay: rateLimitPerDay || 10000,
      },
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: userId,
    });

    await apiKey.save();

    setAuditLog(req, `API key created: ${keyName}`, 'API_KEY', 'APIKey', apiKey._id?.toString());

    res.json({
      success: true,
      key: {
        id: apiKey._id,
        name: apiKey.keyName,
        fullKey: key, // Only shown once during creation
        prefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
      },
      message: 'Save your API key - you will not see it again',
    });
  } catch (err) {
    console.error('Create API key error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create API key',
    });
  }
});

/**
 * PUT /api/api-keys/:keyId
 * Update API key (name, scopes, rate limits)
 */
router.put('/:keyId', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const { keyName, scopes, rateLimitPerMinute, rateLimitPerDay } = req.body;

    const apiKey = await APIKey.findOneAndUpdate(
      { _id: keyId, userId },
      {
        ...(keyName && { keyName }),
        ...(scopes && { scopes }),
        ...(rateLimitPerMinute && {
          'rateLimit.requestsPerMinute': rateLimitPerMinute,
        }),
        ...(rateLimitPerDay && {
          'rateLimit.requestsPerDay': rateLimitPerDay,
        }),
      },
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found',
      });
    }

    setAuditLog(
      req,
      `API key updated: ${keyName}`,
      'API_KEY',
      'APIKey',
      keyId
    );

    res.json({
      success: true,
      key: {
        id: apiKey._id,
        name: apiKey.keyName,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
      },
    });
  } catch (err) {
    console.error('Update API key error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
    });
  }
});

/**
 * DELETE /api/api-keys/:keyId
 * Revoke API key
 */
router.delete('/:keyId', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const apiKey = await APIKey.findOneAndUpdate(
      { _id: keyId, userId },
      { isActive: false },
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found',
      });
    }

    setAuditLog(req, `API key revoked: ${apiKey.keyName}`, 'API_KEY', 'APIKey', keyId);

    res.json({
      success: true,
      message: 'API key revoked',
    });
  } catch (err) {
    console.error('Revoke API key error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key',
    });
  }
});

/**
 * Middleware: Verify API key
 */
export const verifyAPIKey = async (req: any, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const key = authHeader.substring(7);
    const hashedKey = hashAPIKey(key);

    const apiKey = await APIKey.findOne({
      hashedKey,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key',
      });
    }

    // Update last used
    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    // Attach to request
    req.apiKey = apiKey;
    req.user = { id: apiKey.userId };

    next();
  } catch (err) {
    console.error('API key verification error:', err);
    next();
  }
};

export default router;
