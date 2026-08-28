import * as notificationService from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';
export const listNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await notificationService.getNotifications(req.user.id, page, limit);
        return sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
};
export const getUnreadCount = async (req, res, next) => {
    try {
        const result = await notificationService.getUnreadCount(req.user.id);
        return sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
};
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.id);
        return sendSuccess(res, notification, 'تم تحديد الإشعار كمقروء');
    }
    catch (error) {
        if (error.code === 'NOT_FOUND')
            return sendError(res, error.code, error.message, 404);
        next(error);
    }
};
export const markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllAsRead(req.user.id);
        return sendSuccess(res, result, 'تم تحديد جميع الإشعارات كمقروءة');
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=notificationController.js.map