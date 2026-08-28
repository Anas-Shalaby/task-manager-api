import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { loginSchema } from '../validators/authValidator.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user) {
      return sendError(res, 'AUTH_FAILED', 'بيانات الدخول غير صحيحة', 401);
    }
    
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      return sendError(res, 'AUTH_FAILED', 'بيانات الدخول غير صحيحة', 401);
    }
    
    const token = generateToken({ id: user.id, role: user.role });
    
    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
};
