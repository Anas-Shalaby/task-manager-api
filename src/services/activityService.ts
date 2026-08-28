import prisma from '../config/prisma.js';

export interface ActivityFilters {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  actorId?: string;
  entityType?: string;
  action?: string;
  taskId?: string; // Quick filter for task details integration
  teamId?: string; // Supervisor override / specific filtering
  search?: string; // Text search over titles
}

export const getActivityLogs = async (filters: ActivityFilters, authScope: any) => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 50));
  const skip = (page - 1) * limit;

  // Build WHERE clause
  const where: any = { ...authScope };

  // Combine auth scope with explicit filters safely
  const andConditions: any[] = [];

  if (filters.from || filters.to) {
    const dateFilter: any = {};
    if (filters.from) dateFilter.gte = new Date(filters.from);
    if (filters.to) dateFilter.lte = new Date(filters.to);
    andConditions.push({ createdAt: dateFilter });
  }

  if (filters.actorId) andConditions.push({ actorId: filters.actorId });
  if (filters.entityType) andConditions.push({ entityType: filters.entityType });
  if (filters.action) andConditions.push({ action: filters.action });
  
  if (filters.taskId) {
    andConditions.push({ entityType: 'TASK', entityId: filters.taskId });
  }

  // If specific team filter is passed and we have global scope
  // We can filter by tasks in that team.
  if (filters.teamId) {
    const teamTasks = await prisma.task.findMany({
      where: { teamId: filters.teamId },
      select: { id: true }
    });
    const taskIds = teamTasks.map(t => t.id);
    const teamUsers = await prisma.user.findMany({
      where: { teamId: filters.teamId },
      select: { id: true }
    });
    const userIds = teamUsers.map(u => u.id);

    andConditions.push({
      OR: [
        { actorId: { in: userIds } },
        { entityType: 'TASK', entityId: { in: taskIds } },
        { entityType: 'USER', entityId: { in: userIds } },
        { entityType: 'TEAM', entityId: filters.teamId }
      ]
    });
  }

  // Very basic search over actor name or task title in metadata
  if (filters.search) {
    andConditions.push({
      OR: [
        { user: { name: { contains: filters.search } } },
        { action: { contains: filters.search } }
      ]
    });
  }

  if (andConditions.length > 0) {
    // If authScope already has an OR (like Supervisor/Employee), we must nest it
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        ...andConditions
      ];
      delete where.OR;
    } else {
      where.AND = andConditions;
    }
  }

  const [total, items, rawSummary] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, role: true, rank: true }
        }
      }
    }),
    // Fetch summary metrics efficiently
    prisma.activityLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where
    })
  ]);

  // Aggregate summary
  let totalTasks = 0;
  let totalCreates = 0;
  let totalStatus = 0;
  let totalReviews = 0;

  rawSummary.forEach(s => {
    if (s.action.includes('TASK_')) totalTasks += s._count.id;
    if (s.action.includes('_CREATED')) totalCreates += s._count.id;
    if (s.action === 'TASK_STATUS_CHANGED' || s.action === 'TASK_BLOCKED' || s.action === 'TASK_UNBLOCKED') totalStatus += s._count.id;
    if (s.action.includes('REVIEW')) totalReviews += s._count.id;
  });

  const summary = {
    total,
    tasks: totalTasks,
    creates: totalCreates,
    status: totalStatus,
    reviews: totalReviews
  };

  // Map to DTO
  const formattedItems = items.map(item => ({
    id: item.id,
    action: item.action,
    entityType: item.entityType,
    entityId: item.entityId,
    actor: item.user || null,
    entity: {
      id: item.entityId,
      title: (item.metadata as any)?.title || 'عنصر النظام', // Assumes metadata stores title of the task
      type: item.entityType
    },
    changes: item.changes,
    metadata: item.metadata,
    createdAt: item.createdAt
  }));

  return {
    items: formattedItems,
    summary,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrevious: page > 1
    }
  };
};
