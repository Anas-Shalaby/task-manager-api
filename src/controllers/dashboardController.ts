import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';

export const getOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    const user = req.user as any;
    
    // Determine scope
    const where: any = {};
    if (user.role === 'supervisor') {
      where.teamId = user.teamId;
    } else if (user.role === 'employee') {
      // Employees generally shouldn't see full dashboard, but just in case
      where.assignees = { some: { userId: user.id } };
    }
    
    const [
      totalTasks,
      inProgressTasks,
      blockedTasks,
      readyForReviewTasks,
      overdueTasks,
      liveTasksRaw,
      recentActivity,
      teamWorkloadRaw,
      teams
    ] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'in_progress' } }),
      prisma.task.count({ where: { ...where, status: 'blocked' } }),
      prisma.task.count({ where: { ...where, status: 'ready_for_review' } }),
      prisma.task.count({ where: { ...where, deadline: { lt: now }, status: { not: 'completed' } } }),
      
      // Live Tasks: Fetch up to 50 recently updated non-completed tasks for memory sorting
      prisma.task.findMany({
        take: 50,
        orderBy: { updatedAt: 'desc' },
        where: { ...where, status: { not: 'completed' } },
        include: {
          assignees: {
            include: { user: { select: { id: true, name: true, rank: true } } }
          }
        }
      }),

      // Get 10 recent operational activities for the timeline
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
          action: {
            in: [
              'TASK_CREATED', 
              'TASK_STARTED', 
              'TASK_BLOCKED', 
              'TASK_UNBLOCKED', 
              'PROGRESS_UPDATED', 
              'STATUS_CHANGED', 
              'TASK_REVIEWED', 
              'TASK_COMPLETED'
            ]
          }
        },
        include: { user: { select: { name: true, rank: true, role: true } } }
      }),

      // Group workload by Team instead of User, since phase 6 asks for "Team Workload"
      prisma.task.groupBy({
        by: ['teamId'],
        _count: { id: true },
        where: {
          ...where,
          status: { not: 'completed' },
          teamId: { not: null }
        }
      }),

      // Fetch teams for workload mapping
      prisma.team.findMany({
        select: { id: true, name: true }
      })
    ]);

    // Format team workload
    const teamMap = new Map(teams.map(t => [t.id, t]));
    let maxWorkload = 1;
    const workloadRaw = teamWorkloadRaw
      .map(t => {
        const teamInfo = teamMap.get(t.teamId!);
        if (!teamInfo) return null;
        if (t._count.id > maxWorkload) maxWorkload = t._count.id;
        return {
          id: teamInfo.id,
          name: teamInfo.name,
          activeCount: t._count.id
        };
      })
      .filter(Boolean) as { id: string; name: string; activeCount: number }[];

    const workload = workloadRaw
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, 10)
      .map(w => ({
        ...w,
        percentage: Math.min(100, (w.activeCount / Math.max(10, maxWorkload)) * 100)
      }));

    // Score and sort Live Tasks
    // 1. Blocked (100) 2. Overdue (90) 3. Ready for Review (80) 4. Critical (70) 5. Recent (50) 6. In Progress (40)
    const scoredTasks = liveTasksRaw.map(task => {
      let score = 0;
      if (task.status === 'blocked') score += 100;
      if (task.deadline && new Date(task.deadline) < now) score += 90;
      if (task.status === 'ready_for_review') score += 80;
      if (task.priority === 'critical') score += 70;
      if (task.status === 'in_progress') score += 40;
      
      // Add recency bonus (0 to 10 points based on within last 24 hours)
      const hoursSinceUpdate = (now.getTime() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) {
        score += Math.max(0, 10 - (hoursSinceUpdate / 2.4));
      }

      return { ...task, score };
    });

    const liveTasks = scoredTasks
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(t => {
        const { score, ...rest } = t;
        return rest;
      });

    // Format recent activity
    const formattedRecentActivity = recentActivity.map(log => ({
      ...log,
      target: (log.metadata as any)?.title || 'مهمة'
    }));

    return sendSuccess(res, {
      summary: {
        total: totalTasks,
        inProgress: inProgressTasks,
        blocked: blockedTasks,
        readyForReview: readyForReviewTasks,
        overdue: overdueTasks,
      },
      attention: {
        blocked: blockedTasks,
        overdue: overdueTasks,
        review: readyForReviewTasks,
      },
      liveTasks,
      recentActivity: formattedRecentActivity,
      workload
    });
  } catch (error) {
    next(error);
  }
};
