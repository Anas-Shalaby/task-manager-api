import prisma from '../config/prisma.js';

interface LogActivityParams {
  actorId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: any;
  metadata?: any;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType || 'TASK',
        entityId: params.entityId || null,
        changes: params.changes || {},
        metadata: params.metadata || {},
      } as any
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // We intentionally don't throw to prevent activity logging failures from breaking the main flow
  }
};
