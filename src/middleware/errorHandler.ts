import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return sendError(res, 'VALIDATION_ERROR', 'بيانات غير صالحة', 400, (err as any).errors);
  }

  // Handle Custom Errors (from Services)
  if (err.code === 'FORBIDDEN') {
    return sendError(res, 'FORBIDDEN', err.message || 'ليس لديك صلاحية', 403);
  }
  
  if (err.code === 'NOT_FOUND') {
    return sendError(res, 'NOT_FOUND', err.message || 'غير موجود', 404);
  }

  // Handle specific known error structures (e.g. Prisma codes) if needed here

  // Default internal server error
  return sendError(res, 'INTERNAL_SERVER_ERROR', 'حدث خطأ في النظام', 500);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  return sendError(res, 'NOT_FOUND', 'المسار غير موجود', 404);
};
