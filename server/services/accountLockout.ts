import AccountLockout from '../models/AccountLockout';
import { sendEmail } from '../services/emailService';

/**
 * 🔒 Account Lockout Service
 * 
 * Track failed login attempts and auto-lock accounts
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

/**
 * Record failed login attempt
 */
export const recordFailedLogin = async (
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<{ isLocked: boolean; remainingAttempts: number }> => {
  try {
    let lockout = await AccountLockout.findOne({ email, ipAddress });

    if (!lockout) {
      lockout = new AccountLockout({
        email,
        ipAddress,
        failedAttempts: 1,
        lastAttemptAt: new Date(),
        attempts: [{ timestamp: new Date(), ipAddress, userAgent }],
      });
    } else {
      // Check if attempt is within window
      const timeSinceLastAttempt = Date.now() - lockout.lastAttemptAt.getTime();

      if (timeSinceLastAttempt > ATTEMPT_WINDOW) {
        // Reset counter if outside window
        lockout.failedAttempts = 1;
        lockout.attempts = [{ timestamp: new Date(), ipAddress, userAgent }];
      } else {
        // Increment counter
        lockout.failedAttempts += 1;
        lockout.attempts.push({ timestamp: new Date(), ipAddress, userAgent });

        // Check if should lock
        if (lockout.failedAttempts >= MAX_ATTEMPTS && !lockout.isLocked) {
          lockout.isLocked = true;
          lockout.lockedAt = new Date();
          lockout.unlockAt = new Date(Date.now() + LOCKOUT_DURATION);

          // Send alert email
          try {
            await sendEmail({
              to: email,
              subject: 'Account Temporarily Locked - Wellibuy',
              template: 'accountLocked',
              data: {
                email,
                lockoutMinutes: 30,
                ipAddress,
                unlockTime: lockout.unlockAt.toLocaleString(),
              },
            });
          } catch (emailErr) {
            console.error('Failed to send lockout email:', emailErr);
          }
        }
      }

      lockout.lastAttemptAt = new Date();
    }

    await lockout.save();

    return {
      isLocked: lockout.isLocked,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - lockout.failedAttempts),
    };
  } catch (err) {
    console.error('Record failed login error:', err);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };
  }
};

/**
 * Check if account is locked
 */
export const checkAccountLockout = async (
  email: string,
  ipAddress: string
): Promise<{ isLocked: boolean; unlockAt?: Date }> => {
  try {
    const lockout = await AccountLockout.findOne({
      email,
      ipAddress,
      isLocked: true,
      unlockAt: { $gt: new Date() },
    });

    if (lockout) {
      return {
        isLocked: true,
        unlockAt: lockout.unlockAt,
      };
    }

    return { isLocked: false };
  } catch (err) {
    console.error('Check lockout error:', err);
    return { isLocked: false };
  }
};

/**
 * Reset failed attempts on successful login
 */
export const resetFailedAttempts = async (
  email: string,
  ipAddress: string
): Promise<void> => {
  try {
    await AccountLockout.deleteOne({ email, ipAddress });
  } catch (err) {
    console.error('Reset attempts error:', err);
  }
};

/**
 * Manually unlock account (admin)
 */
export const unlockAccount = async (email: string): Promise<boolean> => {
  try {
    const result = await AccountLockout.updateMany(
      { email, isLocked: true },
      { isLocked: false, unlockAt: new Date() }
    );

    return result.modifiedCount > 0;
  } catch (err) {
    console.error('Unlock account error:', err);
    return false;
  }
};

/**
 * Get lockout status for user
 */
export const getLockoutStatus = async (
  email: string
): Promise<Array<any>> => {
  try {
    return await AccountLockout.find({ email }).sort({ createdAt: -1 }).limit(10);
  } catch (err) {
    console.error('Get lockout status error:', err);
    return [];
  }
};
