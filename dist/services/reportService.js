import prisma from '../config/prisma.js';
import { getAuthorizedTeamScope } from '../policies/reportPolicy.js';
import { subDays, startOfDay, endOfDay, subMonths } from 'date-fns';
const buildDateRange = (filters) => {
    const now = new Date();
    let from;
    let to;
    switch (filters.period) {
        case 'today':
            from = startOfDay(now);
            to = endOfDay(now);
            break;
        case 'this_week':
            from = startOfDay(subDays(now, 7)); // roughly rolling 7 days for now
            to = endOfDay(now);
            break;
        case 'this_month':
            from = startOfDay(subMonths(now, 1));
            to = endOfDay(now);
            break;
        case 'last_30_days':
            from = startOfDay(subDays(now, 30));
            to = endOfDay(now);
            break;
        case 'last_90_days':
            from = startOfDay(subDays(now, 90));
            to = endOfDay(now);
            break;
        case 'custom':
            if (filters.from)
                from = startOfDay(new Date(filters.from));
            if (filters.to)
                to = endOfDay(new Date(filters.to));
            break;
        default:
            // default to last 30 days
            from = startOfDay(subDays(now, 30));
            to = endOfDay(now);
    }
    return { from, to };
};
export const generateOperationalReport = async (filters, user) => {
    const scope = getAuthorizedTeamScope(user, filters.teamId);
    if (!scope)
        throw Object.assign(new Error('Unauthorized scope'), { code: 'FORBIDDEN' });
    const { from, to } = buildDateRange(filters);
    const baseWhere = { ...scope };
    if (filters.status)
        baseWhere.status = filters.status;
    if (filters.priority)
        baseWhere.priority = filters.priority;
    if (from && to) {
        baseWhere.createdAt = { gte: from, lte: to };
    }
    // 1. Executive Summary
    const [totalTasks, completedTasks, inProgressTasks, blockedTasks, reviewTasks, overdueTasks] = await Promise.all([
        prisma.task.count({ where: baseWhere }),
        prisma.task.count({ where: { ...baseWhere, status: 'completed' } }),
        prisma.task.count({ where: { ...baseWhere, status: 'in_progress' } }),
        prisma.task.count({ where: { ...baseWhere, status: 'blocked' } }),
        prisma.task.count({ where: { ...baseWhere, status: 'ready_for_review' } }),
        prisma.task.count({ where: { ...baseWhere, deadline: { lt: new Date() }, status: { not: 'completed' } } })
    ]);
    // Operational Health Formula:
    // Critical if blocked > 15% or overdue > 15%
    // Needs Attention if blocked > 5% or overdue > 5%
    // Healthy otherwise
    let healthStatus = 'Healthy';
    let healthReasons = [];
    if (totalTasks > 0) {
        if (blockedTasks / totalTasks > 0.15) {
            healthStatus = 'Critical';
            healthReasons.push('ارتفاع حاد في نسبة المهام المتوقفة');
        }
        else if (blockedTasks / totalTasks > 0.05) {
            healthStatus = 'Needs Attention';
            healthReasons.push('تزايد ملحوظ في المهام المتوقفة');
        }
        if (overdueTasks / totalTasks > 0.15) {
            healthStatus = 'Critical';
            healthReasons.push('نسبة المهام المتأخرة تجاوزت الحد الآمن');
        }
        else if (overdueTasks / totalTasks > 0.05) {
            if (healthStatus !== 'Critical')
                healthStatus = 'Needs Attention';
            healthReasons.push('ارتفاع عدد المهام المتأخرة');
        }
    }
    // 2. Status Distribution
    const pendingTasks = totalTasks - (completedTasks + inProgressTasks + blockedTasks + reviewTasks);
    const statusDistribution = [
        { name: 'مكتملة', value: completedTasks },
        { name: 'بانتظار المراجعة', value: reviewTasks },
        { name: 'قيد التنفيذ', value: inProgressTasks },
        { name: 'متوقفة', value: blockedTasks },
        { name: 'لم تبدأ', value: pendingTasks }
    ];
    // 3. Trends (Simplify by just returning raw arrays mapped by date for the frontend to chart)
    // To avoid complex raw SQL grouped by date, we fetch tasks and bucket them in TS. 
    // For massive datasets this is suboptimal, but fine for typical periods (30-90 days).
    const tasksForTrend = await prisma.task.findMany({
        where: baseWhere,
        select: { createdAt: true, status: true, updatedAt: true }
    });
    const trendMap = {};
    tasksForTrend.forEach(t => {
        const cDate = t.createdAt.toISOString().split('T')[0] || '1970-01-01';
        if (!trendMap[cDate])
            trendMap[cDate] = { created: 0, completed: 0 };
        trendMap[cDate].created += 1;
        // Use updatedAt as proxy for completedAt
        if (t.status === 'completed') {
            const uDate = t.updatedAt.toISOString().split('T')[0] || '1970-01-01';
            if (!trendMap[uDate])
                trendMap[uDate] = { created: 0, completed: 0 };
            trendMap[uDate].completed += 1;
        }
    });
    const trends = Object.keys(trendMap).sort().map(date => ({
        date,
        created: trendMap[date].created,
        completed: trendMap[date].completed
    }));
    // 4. Team Workload
    const teamWorkloadRaw = await prisma.task.groupBy({
        by: ['teamId', 'status'],
        where: { ...scope, teamId: { not: null } },
        _count: { id: true }
    });
    const teamDetails = await prisma.team.findMany({
        where: scope.teamId ? { id: scope.teamId } : {},
        select: { id: true, name: true }
    });
    const teamWorkloadMap = {};
    teamDetails.forEach(t => {
        teamWorkloadMap[t.id] = { id: t.id, name: t.name, total: 0, completed: 0, active: 0, blocked: 0 };
    });
    teamWorkloadRaw.forEach(agg => {
        const tid = agg.teamId;
        if (!teamWorkloadMap[tid])
            return; // Fallback
        const count = agg._count.id;
        teamWorkloadMap[tid].total += count;
        if (agg.status === 'completed')
            teamWorkloadMap[tid].completed += count;
        else if (agg.status === 'in_progress')
            teamWorkloadMap[tid].active += count;
        else if (agg.status === 'blocked')
            teamWorkloadMap[tid].blocked += count;
    });
    const teamWorkload = Object.values(teamWorkloadMap).sort((a, b) => b.total - a.total);
    // 5. Management Attention (Long blocked, severely overdue)
    const threeDaysAgo = subDays(new Date(), 3);
    const longBlockedTasks = await prisma.task.findMany({
        where: { ...scope, status: 'blocked' },
        include: {
            blockers: { where: { resolved: false }, orderBy: { createdAt: 'desc' }, take: 1 },
            assignees: { where: { isOwner: true }, include: { user: { select: { name: true } } } }
        },
        take: 10
    });
    const criticalOverdueTasks = await prisma.task.findMany({
        where: { ...scope, status: { not: 'completed' }, deadline: { lt: new Date() }, priority: { in: ['high', 'critical'] } },
        include: {
            assignees: { where: { isOwner: true }, include: { user: { select: { name: true } } } }
        },
        take: 10,
        orderBy: { priority: 'desc' }
    });
    const attentionItems = [
        ...longBlockedTasks.map(t => ({
            id: t.id,
            title: t.title,
            type: 'BLOCKED',
            reason: t.blockers[0]?.reason || 'غير محدد',
            blockedSince: t.blockers[0]?.createdAt,
            owner: t.assignees[0]?.user?.name || 'غير معين'
        })),
        ...criticalOverdueTasks.map(t => ({
            id: t.id,
            title: t.title,
            type: 'OVERDUE',
            priority: t.priority,
            deadline: t.deadline,
            progress: t.progress,
            owner: t.assignees[0]?.user?.name || 'غير معين'
        }))
    ];
    return {
        meta: {
            generatedAt: new Date().toISOString(),
            period: filters.period,
            from,
            to,
            scope: scope.teamId || 'ALL'
        },
        summary: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            blockedTasks,
            reviewTasks,
            overdueTasks,
            completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0.0"
        },
        health: {
            status: healthStatus,
            reasons: healthReasons
        },
        statusDistribution,
        trends,
        teamWorkload,
        attentionItems
    };
};
//# sourceMappingURL=reportService.js.map