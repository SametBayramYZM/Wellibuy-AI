import express, { Request, Response } from 'express';
import Device from '../models/Device';
import { authenticate } from '../middleware/auth';
import { setAuditLog } from '../middleware/audit';
import crypto from 'crypto';

/**
 * 📱 Device Management Routes
 * 
 * Manage trusted devices, logout from specific devices
 */

const router = express.Router();

/**
 * Helper: Generate device ID from fingerprint
 */
const generateDeviceId = (userAgent: string, ip: string): string => {
  return crypto
    .createHash('sha256')
    .update(userAgent + ip)
    .digest('hex')
    .substring(0, 32);
};

/**
 * GET /api/devices
 * List all user devices
 */
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const devices = await Device.find({ userId, isActive: true })
      .select('-__v')
      .sort({ lastUsedAt: -1 });

    res.json({
      success: true,
      devices: devices.map((device) => ({
        id: device._id,
        name: device.deviceName,
        type: device.deviceType,
        ipAddress: device.ipAddress,
        lastUsedAt: device.lastUsedAt,
        firstSeenAt: device.firstSeenAt,
        isTrusted: device.isTrusted,
      })),
      count: devices.length,
    });
  } catch (err) {
    console.error('Get devices error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
    });
  }
});

/**
 * POST /api/devices
 * Register/update current device
 */
router.post('/', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { deviceName, deviceType } = req.body;
    const ip = req.ip;
    const userAgent = req.get('user-agent') || '';
    const deviceId = generateDeviceId(userAgent, ip);

    let device = await Device.findOne({ userId, deviceId });

    if (device) {
      // Update existing device
      device.lastUsedAt = new Date();
      device.isActive = true;
    } else {
      // Create new device
      device = new Device({
        userId,
        deviceName: deviceName || `Device ${Date.now()}`,
        deviceType: deviceType || 'UNKNOWN',
        deviceId,
        ipAddress: ip,
        userAgent,
        isActive: true,
        firstSeenAt: new Date(),
        lastUsedAt: new Date(),
      });
    }

    await device.save();

    setAuditLog(
      req,
      'Device registered',
      'DEVICE_MANAGEMENT',
      'Device',
      device._id?.toString()
    );

    res.json({
      success: true,
      device: {
        id: device._id,
        name: device.deviceName,
        type: device.deviceType,
      },
      message: 'Device registered successfully',
    });
  } catch (err) {
    console.error('Register device error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
    });
  }
});

/**
 * PUT /api/devices/:deviceId
 * Trust a device
 */
router.put('/:deviceId', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.params;
    const { isTrusted, deviceName } = req.body;

    const device = await Device.findOneAndUpdate(
      { _id: deviceId, userId },
      {
        isTrusted,
        ...(deviceName && { deviceName }),
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    setAuditLog(
      req,
      `Device ${isTrusted ? 'trusted' : 'untrusted'}`,
      'DEVICE_MANAGEMENT',
      'Device',
      deviceId
    );

    res.json({
      success: true,
      device: {
        id: device._id,
        isTrusted: device.isTrusted,
      },
    });
  } catch (err) {
    console.error('Update device error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update device',
    });
  }
});

/**
 * DELETE /api/devices/:deviceId
 * Remove/revoke a device
 */
router.delete('/:deviceId', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.params;

    const device = await Device.findOneAndUpdate(
      { _id: deviceId, userId },
      { isActive: false },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    setAuditLog(
      req,
      'Device revoked',
      'DEVICE_MANAGEMENT',
      'Device',
      deviceId
    );

    res.json({
      success: true,
      message: 'Device revoked successfully',
    });
  } catch (err) {
    console.error('Delete device error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke device',
    });
  }
});

/**
 * POST /api/devices/:deviceId/logout
 * Logout from specific device
 */
router.post(
  '/:deviceId/logout',
  authenticate,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;

      const device = await Device.findOneAndUpdate(
        { _id: deviceId, userId },
        { isActive: false },
        { new: true }
      );

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
        });
      }

      setAuditLog(
        req,
        'Logged out from device',
        'LOGOUT',
        'Device',
        deviceId
      );

      res.json({
        success: true,
        message: 'Logged out from device',
      });
    } catch (err) {
      console.error('Device logout error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to logout from device',
      });
    }
  }
);

/**
 * POST /api/devices/logout-all
 * Logout from all devices except current
 */
router.post('/logout-all', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const currentDeviceId = req.body.currentDeviceId;

    await Device.updateMany(
      {
        userId,
        _id: { $ne: currentDeviceId },
        isActive: true,
      },
      { isActive: false }
    );

    setAuditLog(
      req,
      'Logged out from all devices',
      'LOGOUT',
      'Device'
    );

    res.json({
      success: true,
      message: 'Logged out from all other devices',
    });
  } catch (err) {
    console.error('Logout all devices error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices',
    });
  }
});

export default router;
