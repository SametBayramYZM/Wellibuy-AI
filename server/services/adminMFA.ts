import User from '../models/User';
import TwoFactor from '../models/TwoFactor';

/**
 * 🔐 Admin MFA Enforcement Service
 * 
 * Required 2FA for all admin accounts
 */

/**
 * Check if admin has MFA enabled
 */
export const checkAdminMFA = async (userId: string): Promise<{
  hasMFA: boolean;
  isAdmin: boolean;
  requiresSetup: boolean;
}> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { hasMFA: false, isAdmin: false, requiresSetup: false };
    }

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    
    if (!isAdmin) {
      return { hasMFA: false, isAdmin: false, requiresSetup: false };
    }

    const twoFactor = await TwoFactor.findOne({ userId, isEnabled: true });
    const hasMFA = !!twoFactor;

    return {
      hasMFA,
      isAdmin,
      requiresSetup: isAdmin && !hasMFA,
    };
  } catch (err) {
    console.error('Check admin MFA error:', err);
    return { hasMFA: false, isAdmin: false, requiresSetup: false };
  }
};

/**
 * Middleware: Enforce MFA for admin routes
 */
export const enforceAdminMFA = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const mfaStatus = await checkAdminMFA(userId);

    if (mfaStatus.requiresSetup) {
      return res.status(403).json({
        success: false,
        message: 'Two-factor authentication required for admin access',
        requiresMFA: true,
        setupUrl: '/api/2fa/setup',
      });
    }

    next();
  } catch (err) {
    console.error('Enforce admin MFA error:', err);
    res.status(500).json({
      success: false,
      message: 'MFA enforcement failed',
    });
  }
};

/**
 * Force MFA setup for all existing admins
 */
export const enforceAllAdminsMFA = async (): Promise<number> => {
  try {
    const admins = await User.find({
      role: { $in: ['admin', 'superadmin'] },
    });

    let count = 0;
    for (const admin of admins) {
      const twoFactor = await TwoFactor.findOne({
        userId: admin._id,
        isEnabled: true,
      });

      if (!twoFactor) {
        // Send email notification
        console.log(`📧 Admin ${admin.email} requires MFA setup`);
        count++;
      }
    }

    return count;
  } catch (err) {
    console.error('Enforce all admins MFA error:', err);
    return 0;
  }
};
