import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as notificationService from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const listNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getNotifications(req.user.id, page, limit);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id as string, req.user.id);
    return sendSuccess(res, notification, 'تم تحديد الإشعار كمقروء');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') return sendError(res, error.code, error.message, 404);
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return sendSuccess(res, result, 'تم تحديد جميع الإشعارات كمقروءة');
  } catch (error) {
    next(error);
  }
};
