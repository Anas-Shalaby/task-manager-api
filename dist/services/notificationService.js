import prisma from '../config/prisma.js';
import { getIO } from '../sockets/index.js';
export const createNotification = async (data, tx // Optional Prisma transaction
) => {
    const db = tx || prisma;
    const notification = await db.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            entityType: data.entityType || 'TASK',
            entityId: data.entityId,
            metadata: data.metadata || null
        }
    });
    // Since we shouldn't emit if the transaction fails, 
    // the caller using a transaction should ideally handle the emit after commit,
    // OR we rely on a hook. For now, if no tx is provided, we emit immediately.
    // If tx is provided, we do NOT emit here. The caller must emit using emitNotificationCreated.
    if (!tx) {
        emitNotificationCreated(notification);
    }
    return notification;
};
export const createManyNotifications = async (notificationsData, tx) => {
    if (notificationsData.length === 0)
        return [];
    const db = tx || prisma;
    // We use create instead of createMany to get the returned models to emit them,
    // or we can use createMany and then query them back if performance is a huge issue.
    // Given typical scale of single events (1-5 users), Promise.all(create) is fine and returns IDs.
    const notifications = await Promise.all(notificationsData.map(data => db.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            entityType: data.entityType || 'TASK',
            entityId: data.entityId,
            metadata: data.metadata || null
        }
    })));
    if (!tx) {
        notifications.forEach(emitNotificationCreated);
    }
    return notifications;
};
export const emitNotificationCreated = (notification) => {
    const io = getIO();
    if (io) {
        io.to(`user:${notification.userId}`).emit('notification.created', notification);
    }
};
export const getNotifications = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, readAt: null } })
    ]);
    return {
        notifications,
        total,
        pages: Math.ceil(total / limit),
        unreadCount
    };
};
export const getUnreadCount = async (userId) => {
    const count = await prisma.notification.count({
        where: { userId, readAt: null }
    });
    return { unreadCount: count };
};
export const markAsRead = async (id, userId) => {
    const existing = await prisma.notification.findFirst({
        where: { id, userId } // Ensure user owns the notification
    });
    if (!existing) {
        const error = new Error('الإشعار غير موجود');
        error.code = 'NOT_FOUND';
        throw error;
    }
    if (existing.readAt) {
        return existing; // Already read
    }
    const updated = await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() }
    });
    return updated;
};
export const markAllAsRead = async (userId) => {
    const result = await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() }
    });
    return { updatedCount: result.count };
};
//# sourceMappingURL=notificationService.js.map