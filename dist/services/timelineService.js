import prisma from '../config/prisma.js';
import { canViewTask } from '../policies/taskPolicy.js';
export const getTaskTimeline = async (taskId, limit, cursor, user) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignees: true }
    });
    if (!task) {
        const error = new Error('المهمة غير موجودة');
        error.code = 'NOT_FOUND';
        throw error;
    }
    if (!canViewTask(user, task)) {
        const error = new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
        error.code = 'FORBIDDEN';
        throw error;
    }
    const cursorDate = cursor ? new Date(cursor) : new Date();
    // Fetch from 4 streams
    const [activities, updates, comments, blockers] = await Promise.all([
        prisma.activityLog.findMany({
            where: { entityType: 'TASK', entityId: taskId, createdAt: { lt: cursorDate } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: { select: { id: true, name: true, role: true } } }
        }),
        prisma.taskUpdate.findMany({
            where: { taskId, createdAt: { lt: cursorDate } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: { select: { id: true, name: true, role: true } } }
        }),
        prisma.taskComment.findMany({
            where: { taskId, createdAt: { lt: cursorDate } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: { select: { id: true, name: true, role: true } } }
        }),
        prisma.taskBlocker.findMany({
            where: { taskId, createdAt: { lt: cursorDate } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: { select: { id: true, name: true, role: true } } }
        })
    ]);
    const timelineItems = [];
    for (const a of activities) {
        timelineItems.push({
            id: a.id,
            type: 'ACTIVITY',
            timestamp: a.createdAt,
            actor: a.user ? { name: a.user.name, role: a.user.role } : { name: 'النظام', role: 'system' },
            content: a.action,
            metadata: { changes: a.changes, metadata: a.metadata }
        });
    }
    for (const u of updates) {
        timelineItems.push({
            id: u.id,
            type: 'UPDATE',
            timestamp: u.createdAt,
            actor: { name: u.user.name, role: u.user.role },
            content: u.message,
            metadata: { progress: u.progress, status: u.status }
        });
    }
    for (const c of comments) {
        timelineItems.push({
            id: c.id,
            type: 'COMMENT',
            timestamp: c.createdAt,
            actor: { name: c.user.name, role: c.user.role },
            content: c.message,
            metadata: {}
        });
    }
    for (const b of blockers) {
        // Blocker creation event
        timelineItems.push({
            id: b.id + '_created',
            type: 'BLOCKER',
            timestamp: b.createdAt,
            actor: { name: b.user.name, role: b.user.role },
            content: b.reason,
            metadata: { status: 'created' }
        });
        // Blocker resolution event (if resolved)
        if (b.resolved && b.resolvedAt && b.resolvedAt < cursorDate) {
            timelineItems.push({
                id: b.id + '_resolved',
                type: 'BLOCKER',
                timestamp: b.resolvedAt,
                actor: { name: 'النظام', role: 'system' }, // we don't track resolvedBy explicitly yet
                content: 'تم حل المشكلة واستئناف المهمة',
                metadata: { status: 'resolved' }
            });
        }
    }
    // Sort unified array descending by timestamp
    timelineItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    // Slice to limit
    const paginated = timelineItems.slice(0, limit);
    const nextCursor = paginated.length === limit ? paginated[paginated.length - 1].timestamp.toISOString() : null;
    return { items: paginated, nextCursor };
};
//# sourceMappingURL=timelineService.js.map