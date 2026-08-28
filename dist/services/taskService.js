import prisma from '../config/prisma.js';
import { getIO } from '../sockets/index.js';
import { createNotification, createManyNotifications, emitNotificationCreated } from './notificationService.js';
import { canViewTask, canCreateTask } from '../policies/taskPolicy.js';
import { canTransitionTask, validateProgressRules } from '../policies/taskLifecyclePolicy.js';
export const getTasks = async (filters, page, limit, user) => {
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.status)
        where.status = filters.status;
    if (filters.priority)
        where.priority = filters.priority;
    if (filters.search) {
        where.title = { contains: filters.search };
    }
    if (filters.teamId) {
        // ensure user can view this team's tasks
        if (['admin', 'manager'].includes(user.role) || user.teamId === filters.teamId) {
            where.teamId = filters.teamId;
        }
    }
    if (user.role === 'employee') {
        where.assignees = { some: { userId: user.id } };
    }
    else if (user.role === 'supervisor') {
        where.teamId = user.teamId;
    }
    if (filters.assigneeId) {
        where.assignees = {
            some: { userId: filters.assigneeId }
        };
    }
    let orderBy = { updatedAt: 'desc' };
    if (filters.sort) {
        if (filters.sort === 'deadline')
            orderBy = { deadline: 'asc' };
        else if (filters.sort === 'priority')
            orderBy = { priority: 'desc' };
        // else keep default
    }
    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                assignees: {
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        }),
        prisma.task.count({ where })
    ]);
    return { tasks, total, pages: Math.ceil(total / limit) };
};
export const getTaskMetrics = async (user, filters = {}) => {
    const where = {};
    if (filters.teamId) {
        if (['admin', 'manager'].includes(user.role) || user.teamId === filters.teamId) {
            where.teamId = filters.teamId;
        }
    }
    if (user.role === 'employee') {
        where.assignees = { some: { userId: user.id } };
    }
    else if (user.role === 'supervisor') {
        where.teamId = user.teamId;
    }
    const [totalTasks, activeTasks, blockedTasks, reviewTasks, overdueTasks] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.count({ where: { ...where, status: 'in_progress' } }),
        prisma.task.count({ where: { ...where, status: 'blocked' } }),
        prisma.task.count({ where: { ...where, status: 'ready_for_review' } }),
        prisma.task.count({ where: { ...where, deadline: { lt: new Date() }, status: { not: 'completed' } } })
    ]);
    return { totalTasks, activeTasks, blockedTasks, reviewTasks, overdueTasks };
};
export const fetchMyTasks = async (user, filters, page, limit) => {
    const skip = (page - 1) * limit;
    // The fundamental scoping rule for "My Tasks":
    // It ONLY returns tasks where the authenticated user is an assignee.
    const where = {
        assignees: { some: { userId: user.id } }
    };
    if (filters.status)
        where.status = filters.status;
    if (filters.priority)
        where.priority = filters.priority;
    if (filters.search) {
        where.title = { contains: filters.search };
    }
    // Handle Owner/Contributor filtering
    if (filters.isOwner !== undefined && filters.isOwner !== '') {
        const isOwner = filters.isOwner === 'true';
        where.assignees = {
            some: {
                userId: user.id,
                isOwner: isOwner
            }
        };
    }
    let orderBy = { updatedAt: 'desc' };
    if (filters.sort) {
        if (filters.sort === 'deadline')
            orderBy = { deadline: 'asc' };
        else if (filters.sort === 'priority')
            orderBy = { priority: 'desc' };
        else if (filters.sort === 'createdAt')
            orderBy = { createdAt: 'desc' };
    }
    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                assignees: {
                    include: { user: { select: { id: true, name: true, role: true } } }
                }
            }
        }),
        prisma.task.count({ where })
    ]);
    return { tasks, total, pages: Math.ceil(total / limit) };
};
export const fetchMyTaskMetrics = async (user) => {
    const where = {
        assignees: { some: { userId: user.id } }
    };
    const [totalTasks, activeTasks, blockedTasks, reviewTasks, overdueTasks] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.count({ where: { ...where, status: 'in_progress' } }),
        prisma.task.count({ where: { ...where, status: 'blocked' } }),
        prisma.task.count({ where: { ...where, status: 'ready_for_review' } }),
        prisma.task.count({ where: { ...where, deadline: { lt: new Date() }, status: { not: 'completed' } } })
    ]);
    return { totalTasks, activeTasks, blockedTasks, reviewTasks, overdueTasks };
};
export const getTaskById = async (id, user) => {
    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            assignees: {
                include: { user: { select: { id: true, name: true, role: true } } }
            },
            updates: {
                include: { user: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' }
            },
            comments: {
                include: { user: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' }
            },
            blockers: {
                include: { user: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' }
            }
        }
    });
    if (task && !canViewTask(user, task)) {
        const error = new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
        error.code = 'FORBIDDEN';
        throw error;
    }
    return task;
};
export const createTask = async (data, user) => {
    if (!canCreateTask(user)) {
        const error = new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
        error.code = 'FORBIDDEN';
        throw error;
    }
    const userId = user.id;
    const { title, description, priority, deadline, assignees } = data;
    let notificationsToEmit = [];
    const task = await prisma.$transaction(async (tx) => {
        // Verify cross-team assignment and active users
        if (data.teamId) {
            if (user.role === 'supervisor' && user.teamId !== data.teamId) {
                throw Object.assign(new Error('لا يمكنك إنشاء مهمة خارج فريقك'), { code: 'FORBIDDEN' });
            }
        }
        const newTask = await tx.task.create({
            data: {
                title,
                description,
                priority,
                status: 'pending',
                progress: 0,
                deadline: deadline ? new Date(deadline) : null,
                teamId: data.teamId || user.teamId, // default to creator's team if not specified
            }
        });
        if (assignees && assignees.length > 0) {
            await tx.taskAssignee.createMany({
                data: assignees.map((a) => ({
                    taskId: newTask.id,
                    userId: a.userId,
                    isOwner: a.isOwner
                }))
            });
            const notifyUsers = assignees.filter((a) => a.userId !== userId);
            if (notifyUsers.length > 0) {
                notificationsToEmit = await createManyNotifications(notifyUsers.map((a) => ({
                    userId: a.userId,
                    type: 'TASK_ASSIGNED',
                    title: 'مهمة جديدة',
                    message: `تم إسناد مهمة جديدة إليك: ${title}`,
                    entityType: 'TASK',
                    entityId: newTask.id
                })), tx);
            }
        }
        await tx.activityLog.create({
            data: {
                actorId: userId,
                action: 'TASK_CREATED',
                entityType: 'TASK',
                entityId: newTask.id,
                metadata: { title },
                changes: { status: { from: null, to: 'pending' }, progress: { from: null, to: 0 } }
            }
        });
        return tx.task.findUnique({
            where: { id: newTask.id },
            include: {
                assignees: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }
            }
        });
    });
    const io = getIO();
    if (io && task) {
        // Determine rooms based on assignees, or send specific task created events
        // Assuming assignees join user-specific rooms like `user:${userId}` to receive their assigned tasks
        task.assignees.forEach(assignee => {
            io.to(`user:${assignee.userId}`).emit('task.created', task);
        });
        // Optional: emit to managers globally, or wait for dashboard updates
        io.emit('dashboard.task_created', task);
        notificationsToEmit.forEach(emitNotificationCreated);
    }
    return task;
};
export const updateTask = async (id, data, user) => {
    const existingTask = await prisma.task.findUnique({
        where: { id },
        include: { assignees: true }
    });
    if (!existingTask)
        throw Object.assign(new Error('المهمة غير موجودة'), { code: 'NOT_FOUND' });
    // Only owners or managers can edit
    const isOwner = existingTask.assignees.some(a => a.userId === user.id && a.isOwner);
    const isManager = ['admin', 'manager', 'supervisor'].includes(user.role);
    if (!isOwner && !isManager)
        throw Object.assign(new Error('ليس لديك صلاحية لتعديل هذه المهمة'), { code: 'FORBIDDEN' });
    const { title, description, priority, deadline, teamId, assignees } = data;
    const task = await prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existingTask.title,
                description: description !== undefined ? description : existingTask.description,
                priority: priority !== undefined ? priority : existingTask.priority,
                deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : existingTask.deadline,
                teamId: teamId !== undefined ? teamId : existingTask.teamId,
            }
        });
        if (assignees !== undefined) {
            // Re-create assignees
            await tx.taskAssignee.deleteMany({ where: { taskId: id } });
            if (assignees.length > 0) {
                await tx.taskAssignee.createMany({
                    data: assignees.map((a) => ({
                        taskId: id,
                        userId: a.userId,
                        isOwner: a.isOwner
                    }))
                });
            }
        }
        const changes = {};
        if (title && title !== existingTask.title)
            changes.title = { from: existingTask.title, to: title };
        if (priority && priority !== existingTask.priority)
            changes.priority = { from: existingTask.priority, to: priority };
        if (Object.keys(changes).length > 0 || assignees !== undefined) {
            await tx.activityLog.create({
                data: {
                    actorId: user.id,
                    action: 'TASK_UPDATED',
                    entityType: 'TASK',
                    entityId: id,
                    changes,
                    metadata: { title: updated.title }
                }
            });
        }
        return tx.task.findUnique({
            where: { id },
            include: { assignees: { include: { user: { select: { id: true, name: true, role: true } } } } }
        });
    });
    getIO().to('dashboard').emit('task.updated', task);
    getIO().to(`task:${id}`).emit('task.updated', task);
    return task;
};
export const deleteTask = async (id, user) => {
    const existingTask = await prisma.task.findUnique({
        where: { id },
        include: { assignees: true }
    });
    if (!existingTask)
        throw Object.assign(new Error('المهمة غير موجودة'), { code: 'NOT_FOUND' });
    // Only owners or managers can delete
    const isOwner = existingTask.assignees.some(a => a.userId === user.id && a.isOwner);
    const isManager = ['admin', 'manager', 'supervisor'].includes(user.role);
    if (!isOwner && !isManager)
        throw Object.assign(new Error('ليس لديك صلاحية لمسح هذه المهمة'), { code: 'FORBIDDEN' });
    await prisma.$transaction(async (tx) => {
        // Delete the task (cascades related assignees, updates, comments, blockers)
        await tx.task.delete({ where: { id } });
        await tx.activityLog.create({
            data: {
                actorId: user.id,
                action: 'TASK_DELETED',
                entityType: 'TASK',
                entityId: id, // Even though it's deleted, we log it
                metadata: { title: existingTask.title }
            }
        });
    });
    getIO().to('dashboard').emit('task.deleted', { id });
    return { success: true };
};
// Domain Actions
const executeTransition = async (id, user, targetStatus, validateProgressFn, extraTxLogic) => {
    const existingTask = await prisma.task.findUnique({
        where: { id },
        include: { assignees: true }
    });
    if (!existingTask) {
        const error = new Error('المهمة غير موجودة');
        error.code = 'NOT_FOUND';
        throw error;
    }
    if (!canTransitionTask(existingTask, existingTask.status, targetStatus, user)) {
        const error = new Error(`لا يمكن تغيير الحالة من ${existingTask.status} إلى ${targetStatus}`);
        error.code = 'CONFLICT';
        throw error;
    }
    if (validateProgressFn) {
        validateProgressFn(existingTask);
    }
    let notificationsToEmit = [];
    const task = await prisma.$transaction(async (tx) => {
        let progressUpdate = {};
        if (targetStatus === 'ready_for_review' || targetStatus === 'completed') {
            progressUpdate = { progress: 100 };
        }
        const updated = await tx.task.update({
            where: { id },
            data: { status: targetStatus, ...progressUpdate }
        });
        const changes = { status: { from: existingTask.status, to: targetStatus } };
        if (progressUpdate.progress && existingTask.progress !== 100) {
            changes.progress = { from: existingTask.progress, to: 100 };
        }
        await tx.activityLog.create({
            data: {
                actorId: user.id,
                action: 'STATUS_CHANGED',
                entityType: 'TASK',
                entityId: id,
                changes,
                metadata: { title: updated.title }
            }
        });
        if (extraTxLogic) {
            await extraTxLogic(tx, notificationsToEmit);
        }
        return updated;
    });
    try {
        getIO().to('dashboard').emit('task.updated', task);
        getIO().to(`task:${id}`).emit('task.updated', task);
        getIO().to(`task:${id}`).emit('task.timeline_updated', task);
        notificationsToEmit.forEach(emitNotificationCreated);
    }
    catch (e) { }
    return task;
};
export const startTask = (id, user) => {
    return executeTransition(id, user, 'in_progress');
};
export const blockTask = (id, reason, user) => {
    return executeTransition(id, user, 'blocked', undefined, async (tx, notificationsToEmit) => {
        await tx.taskBlocker.create({
            data: { taskId: id, userId: user.id, reason }
        });
        const task = await tx.task.findUnique({ where: { id }, include: { assignees: true } });
        const owner = task?.assignees.find((a) => a.isOwner);
        if (owner && owner.userId !== user.id) {
            const n = await createNotification({
                userId: owner.userId,
                type: 'TASK_BLOCKED',
                title: 'تم إيقاف المهمة',
                message: `تم إيقاف المهمة: ${task?.title}`,
                entityType: 'TASK',
                entityId: id
            }, tx);
            notificationsToEmit.push(n);
        }
    });
};
export const unblockTask = (id, user) => {
    return executeTransition(id, user, 'in_progress', undefined, async (tx, notificationsToEmit) => {
        // Find active blocker and resolve it
        const activeBlocker = await tx.taskBlocker.findFirst({
            where: { taskId: id, resolved: false }
        });
        if (activeBlocker) {
            await tx.taskBlocker.update({
                where: { id: activeBlocker.id },
                data: { resolved: true, resolvedAt: new Date() }
            });
        }
        const task = await tx.task.findUnique({ where: { id }, include: { assignees: true } });
        const owner = task?.assignees.find((a) => a.isOwner);
        if (owner && owner.userId !== user.id) {
            const n = await createNotification({
                userId: owner.userId,
                type: 'TASK_UNBLOCKED',
                title: 'استئناف المهمة',
                message: `تم استئناف العمل على المهمة: ${task?.title}`,
                entityType: 'TASK',
                entityId: id
            }, tx);
            notificationsToEmit.push(n);
        }
    });
};
export const submitForReview = (id, user) => {
    return executeTransition(id, user, 'ready_for_review', undefined, async (tx, notificationsToEmit) => {
        const task = await tx.task.findUnique({ where: { id } });
        // Find managers to notify (simplified: find all users with role 'manager' or 'supervisor' who can review)
        // For now, we might not have a direct manager relation, let's skip for the moment or just emit to owners if they are different.
        // To be precise, if the actor is an employee, we should notify managers.
        // Instead of querying all managers, we will just notify the owner if the actor is not the owner.
        // Otherwise, we'll notify supervisors if we had a specific link.
    });
};
export const reviewTask = (id, approved, feedback, user) => {
    const targetStatus = approved ? 'completed' : 'in_progress';
    return executeTransition(id, user, targetStatus, undefined, async (tx, notificationsToEmit) => {
        if (!approved && feedback) {
            await tx.taskComment.create({
                data: { taskId: id, userId: user.id, message: `[ملاحظات المراجعة]: ${feedback}` }
            });
        }
        const task = await tx.task.findUnique({ where: { id }, include: { assignees: true } });
        const owner = task?.assignees.find((a) => a.isOwner);
        if (owner && owner.userId !== user.id) {
            const n = await createNotification({
                userId: owner.userId,
                type: approved ? 'TASK_REVIEW_APPROVED' : 'TASK_REVIEW_REJECTED',
                title: approved ? 'تم اعتماد المهمة' : 'تم رفض مراجعة المهمة',
                message: approved ? `تمت الموافقة على المهمة: ${task?.title}` : `تم رفض المراجعة: ${task?.title}`,
                entityType: 'TASK',
                entityId: id
            }, tx);
            notificationsToEmit.push(n);
        }
    });
};
export const addOperationalUpdate = async (id, data, user) => {
    const existingTask = await prisma.task.findUnique({
        where: { id },
        include: { assignees: true }
    });
    if (!existingTask)
        throw Object.assign(new Error('المهمة غير موجودة'), { code: 'NOT_FOUND' });
    // Only assignees or managers can update
    const isAssigned = existingTask.assignees.some(a => a.userId === user.id);
    const isManager = ['admin', 'manager', 'supervisor'].includes(user.role);
    if (!isAssigned && !isManager)
        throw Object.assign(new Error('ليس لديك صلاحية'), { code: 'FORBIDDEN' });
    let newProgress = existingTask.progress;
    if (data.progress !== undefined) {
        if (!validateProgressRules(data.status || existingTask.status, data.progress)) {
            throw Object.assign(new Error('نسبة الإنجاز لا تتوافق مع الحالة الحالية للمهمة'), { code: 'CONFLICT' });
        }
        newProgress = data.progress;
    }
    let newStatus = existingTask.status;
    if (data.status && data.status !== existingTask.status) {
        if (!canTransitionTask(existingTask, existingTask.status, data.status, user)) {
            throw Object.assign(new Error(`لا يمكن الانتقال من ${existingTask.status} إلى ${data.status}`), { code: 'CONFLICT' });
        }
        newStatus = data.status;
    }
    const task = await prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
            where: { id },
            data: { progress: newProgress, status: newStatus }
        });
        await tx.taskUpdate.create({
            data: {
                taskId: id,
                userId: user.id,
                message: data.message,
                progress: newProgress !== existingTask.progress ? newProgress : null,
                status: newStatus !== existingTask.status ? newStatus : null
            }
        });
        if (newProgress !== existingTask.progress || newStatus !== existingTask.status) {
            const changes = {};
            if (newProgress !== existingTask.progress)
                changes.progress = { from: existingTask.progress, to: newProgress };
            if (newStatus !== existingTask.status)
                changes.status = { from: existingTask.status, to: newStatus };
            await tx.activityLog.create({
                data: {
                    actorId: user.id,
                    action: 'PROGRESS_UPDATED',
                    entityType: 'TASK',
                    entityId: id,
                    changes,
                    metadata: { title: updated.title }
                }
            });
        }
        return updated;
    });
    try {
        getIO().to('dashboard').emit('task.updated', task);
        getIO().to(`task:${id}`).emit('task.updated', task);
        getIO().to(`task:${id}`).emit('task.timeline_updated', task);
    }
    catch (e) { }
    return task;
};
export const addComment = async (id, message, user) => {
    const existingTask = await prisma.task.findUnique({
        where: { id },
        include: { assignees: true }
    });
    if (!existingTask)
        throw Object.assign(new Error('المهمة غير موجودة'), { code: 'NOT_FOUND' });
    if (!canViewTask(user, existingTask))
        throw Object.assign(new Error('ليس لديك صلاحية'), { code: 'FORBIDDEN' });
    const comment = await prisma.taskComment.create({
        data: { taskId: id, userId: user.id, message }
    });
    const participantsToNotify = existingTask.assignees.filter((a) => a.userId !== user.id);
    if (participantsToNotify.length > 0) {
        const notifications = await createManyNotifications(participantsToNotify.map((a) => ({
            userId: a.userId,
            type: 'TASK_COMMENTED',
            title: 'تعليق جديد',
            message: `تم إضافة تعليق جديد على المهمة: ${existingTask.title}`,
            entityType: 'TASK',
            entityId: id
        })));
    }
    try {
        getIO().to(`task:${id}`).emit('task.comment_added', comment);
        getIO().to(`task:${id}`).emit('task.timeline_updated', comment);
    }
    catch (e) { }
    return comment;
};
//# sourceMappingURL=taskService.js.map