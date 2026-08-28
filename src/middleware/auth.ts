import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'غير مصرح لك بالوصول', 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verifyToken(token as string) as any;
    // Check if user still exists in DB
    const { default: prisma } = await import('../config/prisma.js');
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      return sendError(res, 'UNAUTHORIZED', 'الحساب غير موجود أو تم حذفه', 401);
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'UNAUTHORIZED', 'جلسة غير صالحة أو منتهية', 401);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'لا تملك صلاحية لهذه العملية', 403);
    }
    next();
  };
};
