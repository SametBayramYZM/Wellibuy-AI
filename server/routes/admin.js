import express, { Request, Response, Router } from 'express';
import { User, IUser } from '../models/User';
import { authMiddleware } from '../middleware/auth';

/**
 * 🔐 Admin Routes
 * 
 * Endpoints:
 * GET /api/admin/users - Get all users
 * GET /api/admin/users/:id - Get user details
 * PUT /api/admin/users/:id/role - Change user role
 * PUT /api/admin/users/:id/status - Enable/disable user
 * DELETE /api/admin/users/:id - Delete user
 * GET /api/admin/audit-logs - Get audit logs
 * GET /api/admin/stats - Get security stats
 */

const router = Router();

/**
 * Admin middleware - Check if user is admin
 */
const adminMiddleware = (req: Request, res: Response, next: any) => {
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (paginated)
 * @access  Private (Admin only)
 */
router.get(
  '/users',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 20, role, status } = req.query;
      const skip = ((parseInt(page as string) - 1) * parseInt(limit as string)) || 0;
      
      // Build filter
      const filter: any = {};
      if (role) filter.role = role;
      if (status === 'active') filter.isActive = true;
      if (status === 'inactive') filter.isActive = false;
      
      // Get users
      const users = await User.find(filter)
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('-password -passwordResetToken -twoFactorSecret')
        .sort({ createdAt: -1 });
      
      const total = await User.countDocuments(filter);
      
      res.status(200).json({
        success: true,
        users,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
      
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details
 * @access  Private (Admin only)
 */
router.get(
  '/users/:id',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id)
        .select('-password -passwordResetToken -twoFactorSecret');
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.status(200).json({
        success: true,
        user
      });
      
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Change user role
 * @access  Private (Admin only)
 */
router.put(
  '/users/:id/role',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      // Validate role
      const validRoles = ['user', 'admin', 'moderator', 'guest'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }
      
      // Prevent last admin from being demoted
      if (role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 1) {
          const user = await User.findById(id);
          if (user?.role === 'admin') {
            res.status(400).json({ error: 'Cannot remove the last admin' });
            return;
          }
        }
      }
      
      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      ).select('-password -passwordResetToken');
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Log audit event
      console.log(`👤 Admin changed user ${id} role to ${role}`);
      
      res.status(200).json({
        success: true,
        message: 'User role updated',
        user
      });
      
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Enable/disable user account
 * @access  Private (Admin only)
 */
router.put(
  '/users/:id/status',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await User.findByIdAndUpdate(
        id,
        { isActive },
        { new: true }
      ).select('-password -passwordResetToken');
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Log audit event
      const action = isActive ? 'enabled' : 'disabled';
      console.log(`🔒 Admin ${action} user ${id}`);
      
      res.status(200).json({
        success: true,
        message: `User account ${action}`,
        user
      });
      
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user permanently
 * @access  Private (Admin only)
 */
router.delete(
  '/users/:id',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;
      
      // Prevent admin from deleting themselves
      if (id === adminId) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }
      
      // Prevent deletion of last admin
      const user = await User.findById(id);
      if (user?.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 1) {
          res.status(400).json({ error: 'Cannot delete the last admin' });
          return;
        }
      }
      
      await User.findByIdAndDelete(id);
      
      // Log audit event
      console.log(`🗑️  Admin ${adminId} deleted user ${id}`);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

/**
 * @route   GET /api/admin/stats
 * @desc    Get security statistics
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const admins = await User.countDocuments({ role: 'admin' });
      const moderators = await User.countDocuments({ role: 'moderator' });
      const emailVerified = await User.countDocuments({ emailVerified: true });
      const twoFactorEnabled = await User.countDocuments({ twoFactorEnabled: true });
      const withPaymentMethods = await User.countDocuments({
        paymentMethods: { $exists: true, $ne: [] }
      });
      
      // Recent signups (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentSignups = await User.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });
      
      res.status(200).json({
        success: true,
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
            recentSignups
          },
          roles: {
            admin: admins,
            moderator: moderators,
            user: totalUsers - admins - moderators
          },
          security: {
            emailVerified,
            twoFactorEnabled,
            withPaymentMethods,
            paymentMethodsRate: totalUsers > 0 ? ((withPaymentMethods / totalUsers) * 100).toFixed(2) : 0
          }
        }
      });
      
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs (from console logs - TODO: implement proper logging)
 * @access  Private (Admin only)
 */
router.get(
  '/audit-logs',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Implement proper audit logging system
      // For now, return placeholder
      res.status(200).json({
        success: true,
        message: 'Audit logging system coming soon',
        logs: [
          {
            id: 1,
            action: 'User registered',
            userId: 'user123',
            timestamp: new Date(),
            details: 'User john@example.com registered'
          },
          {
            id: 2,
            action: 'Password changed',
            userId: 'user123',
            timestamp: new Date(),
            details: 'User changed password'
          }
        ],
        note: 'Implement MongoDB audit collection for production'
      });
      
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

export default router;
