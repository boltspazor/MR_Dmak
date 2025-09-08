import { Request, Response, NextFunction } from 'express';

export const isSuperAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Access denied. Super admin privileges required.' 
    });
  }
  return next();
};

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  return next();
};

export const isMarketingManager = (req: any, res: Response, next: NextFunction) => {
  if (!req.user.isMarketingManager && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Access denied. Marketing manager privileges required.' 
    });
  }
  return next();
};

export const canAccessMR = (req: any, res: Response, next: NextFunction) => {
  // Super admin can access all MRs
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Marketing managers can only access their own MRs
  if (req.user.isMarketingManager) {
    // This will be checked in the service layer
    return next();
  }

  return res.status(403).json({ 
    error: 'Access denied. Insufficient privileges.' 
  });
};
