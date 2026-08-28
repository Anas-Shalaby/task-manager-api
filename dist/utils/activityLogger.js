import prisma from '../config/prisma.js';
export const logActivity = async (params) => {
    try {
        await prisma.activityLog.create({
            data: {
                actorId: params.actorId || null,
                action: params.action,
                entityType: params.entityType || 'TASK',
                entityId: params.entityId || null,
                changes: params.changes || {},
                metadata: params.metadata || {},
            }
        });
    }
    catch (error) {
        console.error('Failed to log activity:', error);
        // We intentionally don't throw to prevent activity logging failures from breaking the main flow
    }
};
//# sourceMappingURL=activityLogger.js.map