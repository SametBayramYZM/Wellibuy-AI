import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

/**
 * 📝 Audit Logging Middleware
 * 
 * Automatically log all significant actions for compliance and security
 */

export interface AuditRequest extends Request {
  auditLog?: {
    userId?: string;
    action: string;
    actionType: string;
    resource?: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
  };
  securityContext?: {
    ip: string;
    userAgent: string;
    timestamp: Date;
  };
}

export const auditMiddleware = async (
  req: AuditRequest,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    // Log after response is sent
    if (req.auditLog) {
      const auditData = {
        userId: req.auditLog.userId || (req as any).user?.id,
        action: req.auditLog.action,
        actionType: req.auditLog.actionType,
        resource: req.auditLog.resource,
        resourceId: req.auditLog.resourceId,
        status: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS',
        details: {
          ip: req.securityContext?.ip || req.ip,
          userAgent: req.securityContext?.userAgent || req.get('user-agent'),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          oldValue: req.auditLog.oldValue,
          newValue: req.auditLog.newValue,
          duration: Date.now() - (req as any).requestStart,
          errorMessage:
            res.statusCode >= 400
              ? typeof data === 'string'
                ? data
                : data?.message
              : undefined,
        },
      };

      // Save audit log asynchronously
      AuditLog.create(auditData).catch((err) => {
        console.error('Audit log error:', err);
      });
    }

    return originalSend.call(this, data);
  };

  // Mark request start time
  (req as any).requestStart = Date.now();

  next();
};

/**
 * Helper to set audit information on request
 */
export const setAuditLog = (
  req: AuditRequest,
  action: string,
  actionType: string,
  resource?: string,
  resourceId?: string
) => {
  req.auditLog = {
    action,
    actionType,
    resource,
    resourceId,
  };
};

/**
 * Audit specific action with old and new values
 */
export const auditUpdate = (
  req: AuditRequest,
  action: string,
  resource: string,
  resourceId: string,
  oldValue: any,
  newValue: any
) => {
  req.auditLog = {
    action,
    actionType: 'UPDATE',
    resource,
    resourceId,
    oldValue,
    newValue,
  };
};
