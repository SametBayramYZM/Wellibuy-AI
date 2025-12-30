import express, { Request, Response } from 'express';
import IPBlacklist from '../models/IPBlacklist';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/admin';
import { setAuditLog } from '../middleware/audit';

/**
 * 🔒 IP Management Routes
 * 
 * Manage IP blacklist and whitelist
 */

const router = express.Router();

/**
 * GET /api/ip-management
 * Get all IP rules
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  async (req: any, res: Response) => {
    try {
      const rules = await IPBlacklist.find()
        .select('-__v')
        .sort({ createdAt: -1 });

      const blacklist = rules.filter((r) => r.type === 'BLACKLIST');
      const whitelist = rules.filter((r) => r.type === 'WHITELIST');

      res.json({
        success: true,
        blacklist: blacklist.map((r) => ({
          id: r._id,
          ip: r.ipAddress,
          reason: r.reason,
          expiresAt: r.expiresAt,
          addedAt: r.createdAt,
        })),
        whitelist: whitelist.map((r) => ({
          id: r._id,
          ip: r.ipAddress,
          addedAt: r.createdAt,
        })),
        counts: {
          blacklisted: blacklist.length,
          whitelisted: whitelist.length,
        },
      });
    } catch (err) {
      console.error('Get IP rules error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to get IP rules',
      });
    }
  }
);

/**
 * POST /api/ip-management/blacklist
 * Add IP to blacklist
 */
router.post(
  '/blacklist',
  authenticate,
  adminOnly,
  async (req: any, res: Response) => {
    try {
      const { ipAddress, reason, expiresAt } = req.body;

      // Validate IP format
      if (!ipAddress || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid IP address format',
        });
      }

      // Check if already exists
      const existing = await IPBlacklist.findOne({
        ipAddress,
        type: 'BLACKLIST',
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'IP already blacklisted',
        });
      }

      const rule = new IPBlacklist({
        ipAddress,
        type: 'BLACKLIST',
        reason,
        addedBy: req.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      await rule.save();

      setAuditLog(
        req,
        `IP blacklisted: ${ipAddress}`,
        'ADMIN',
        'IPBlacklist',
        rule._id?.toString()
      );

      res.json({
        success: true,
        rule: {
          id: rule._id,
          ip: rule.ipAddress,
          reason: rule.reason,
          expiresAt: rule.expiresAt,
        },
        message: 'IP blacklisted successfully',
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'IP already in system',
        });
      }
      console.error('Blacklist IP error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to blacklist IP',
      });
    }
  }
);

/**
 * POST /api/ip-management/whitelist
 * Add IP to whitelist
 */
router.post(
  '/whitelist',
  authenticate,
  adminOnly,
  async (req: any, res: Response) => {
    try {
      const { ipAddress } = req.body;

      // Validate IP format
      if (!ipAddress || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid IP address format',
        });
      }

      const rule = new IPBlacklist({
        ipAddress,
        type: 'WHITELIST',
        addedBy: req.user.id,
      });

      await rule.save();

      setAuditLog(
        req,
        `IP whitelisted: ${ipAddress}`,
        'ADMIN',
        'IPBlacklist',
        rule._id?.toString()
      );

      res.json({
        success: true,
        rule: {
          id: rule._id,
          ip: rule.ipAddress,
        },
        message: 'IP whitelisted successfully',
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'IP already whitelisted',
        });
      }
      console.error('Whitelist IP error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to whitelist IP',
      });
    }
  }
);

/**
 * DELETE /api/ip-management/:ruleId
 * Remove IP rule
 */
router.delete(
  '/:ruleId',
  authenticate,
  adminOnly,
  async (req: any, res: Response) => {
    try {
      const { ruleId } = req.params;

      const rule = await IPBlacklist.findByIdAndDelete(ruleId);

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Rule not found',
        });
      }

      setAuditLog(
        req,
        `IP rule removed: ${rule.ipAddress}`,
        'ADMIN',
        'IPBlacklist',
        ruleId
      );

      res.json({
        success: true,
        message: 'IP rule removed',
      });
    } catch (err) {
      console.error('Delete IP rule error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete IP rule',
      });
    }
  }
);

/**
 * Middleware to check IP blacklist
 */
export const checkIPBlacklist = async (
  req: any,
  res: Response,
  next: any
) => {
  try {
    const ip = req.ip;

    const rule = await IPBlacklist.findOne({ ipAddress: ip });

    if (rule && rule.type === 'BLACKLIST') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - IP address is blocked',
      });
    }

    next();
  } catch (err) {
    console.error('IP check error:', err);
    next(); // Continue on error
  }
};

export default router;
