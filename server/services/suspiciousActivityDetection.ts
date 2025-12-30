import SuspiciousActivity from '../models/SuspiciousActivity';
import AuditLog from '../models/AuditLog';
import Device from '../models/Device';

/**
 * 🚨 Suspicious Activity Detection Service
 * 
 * Monitor and detect suspicious user behaviors
 */

interface DetectionContext {
  userId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  action?: string;
  details?: any;
}

/**
 * Check for multiple failed login attempts
 */
export const detectFailedLogins = async (
  userId: string,
  ip: string,
  threshold: number = 5,
  timeWindow: number = 15 // minutes
) => {
  const timeAgo = new Date(Date.now() - timeWindow * 60 * 1000);

  const failedAttempts = await AuditLog.countDocuments({
    userId,
    actionType: 'LOGIN',
    status: 'FAILURE',
    createdAt: { $gte: timeAgo },
  });

  if (failedAttempts >= threshold) {
    await logSuspiciousActivity({
      userId,
      activityType: 'MULTIPLE_FAILED_LOGINS',
      severity: 'CRITICAL',
      description: `${failedAttempts} failed login attempts in ${timeWindow} minutes`,
      details: { ip, failedAttempts, timeWindow },
    });
    return true;
  }

  return false;
};

/**
 * Check for unusual IP address
 */
export const detectUnusualIP = async (userId: string, ip: string) => {
  const recentDevices = await Device.find({
    userId,
    isActive: true,
  }).limit(10);

  const knownIPs = recentDevices.map((d) => d.ipAddress);

  if (knownIPs.length > 0 && !knownIPs.includes(ip)) {
    await logSuspiciousActivity({
      userId,
      activityType: 'UNUSUAL_IP',
      severity: 'MEDIUM',
      description: `Login from new IP address: ${ip}`,
      details: { ip, recentIPs: knownIPs },
    });
    return true;
  }

  return false;
};

/**
 * Check for unusual login time
 */
export const detectUnusualTime = async (userId: string) => {
  const now = new Date();
  const hour = now.getHours();

  // Flag logins between 2 AM - 5 AM
  if (hour >= 2 && hour <= 5) {
    const recentLogins = await AuditLog.countDocuments({
      userId,
      actionType: 'LOGIN',
      status: 'SUCCESS',
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    });

    if (recentLogins > 0) {
      await logSuspiciousActivity({
        userId,
        activityType: 'UNUSUAL_TIME',
        severity: 'LOW',
        description: `Login at unusual time: ${hour}:${now.getMinutes().toString().padStart(2, '0')}`,
        details: { hour },
      });
      return true;
    }
  }

  return false;
};

/**
 * Check for unusual payment amount
 */
export const detectUnusualPayment = async (
  userId: string,
  amount: number
) => {
  const recentPayments = await AuditLog.find({
    userId,
    actionType: 'PAYMENT',
    status: 'SUCCESS',
    createdAt: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    },
  }).select('details.newValue');

  if (recentPayments.length > 0) {
    const amounts = recentPayments
      .map((log) => log.details?.newValue?.amount || 0)
      .filter((a) => a > 0);

    if (amounts.length > 0) {
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const maxAmount = Math.max(...amounts);

      // Alert if amount is 3x the average or 2x the max
      if (amount > avgAmount * 3 || amount > maxAmount * 2) {
        await logSuspiciousActivity({
          userId,
          activityType: 'UNUSUAL_PAYMENT_AMOUNT',
          severity: 'MEDIUM',
          description: `Payment amount ${amount} is unusually high (avg: ${avgAmount.toFixed(2)})`,
          details: { amount, avgAmount, maxAmount },
        });
        return true;
      }
    }
  }

  return false;
};

/**
 * Check for bulk operations
 */
export const detectBulkOperations = async (
  userId: string,
  timeWindow: number = 5 // minutes
) => {
  const timeAgo = new Date(Date.now() - timeWindow * 60 * 1000);

  const operationCount = await AuditLog.countDocuments({
    userId,
    createdAt: { $gte: timeAgo },
  });

  // Alert if more than 50 operations in time window
  if (operationCount > 50) {
    await logSuspiciousActivity({
      userId,
      activityType: 'BULK_OPERATIONS',
      severity: 'HIGH',
      description: `${operationCount} operations in ${timeWindow} minutes`,
      details: { operationCount, timeWindow },
    });
    return true;
  }

  return false;
};

/**
 * Log suspicious activity
 */
export const logSuspiciousActivity = async (data: {
  userId: string;
  activityType: string;
  severity: string;
  description: string;
  details?: any;
}) => {
  try {
    const activity = await SuspiciousActivity.create({
      userId: data.userId,
      activityType: data.activityType,
      severity: data.severity,
      description: data.description,
      details: data.details,
      isResolved: false,
    });

    // If severity is CRITICAL, notify admin
    if (data.severity === 'CRITICAL') {
      console.warn(
        `🚨 CRITICAL SUSPICIOUS ACTIVITY: ${data.description}`,
        data
      );
      // TODO: Send email to admins
    }

    return activity;
  } catch (err) {
    console.error('Error logging suspicious activity:', err);
  }
};

/**
 * Resolve suspicious activity
 */
export const resolveSuspiciousActivity = async (
  activityId: string,
  resolvedBy: string,
  action: string
) => {
  return SuspiciousActivity.findByIdAndUpdate(
    activityId,
    {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy,
      action,
    },
    { new: true }
  );
};

/**
 * Get user's suspicious activities
 */
export const getUserSuspiciousActivities = async (userId: string) => {
  return SuspiciousActivity.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);
};
