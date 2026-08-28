import prisma from '../config/prisma.js';

export const getActivityScope = async (user: any): Promise<any> => {
  // Global scope
  if (user.role === 'admin' || user.role === 'manager') {
    return {}; 
  }

  // Supervisor scope
  if (user.role === 'supervisor') {
    // 1. Get user IDs in their team
    const usersInTeam = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: { id: true }
    });
    const userIds = usersInTeam.map(u => u.id);
    
    // 2. Get tasks assigned to their team
    const teamTasks = await prisma.task.findMany({
      where: { teamId: user.teamId },
      select: { id: true }
    });
    const taskIds = teamTasks.map(t => t.id);

    return {
      OR: [
        { actorId: { in: userIds } },
        { entityType: 'TASK', entityId: { in: taskIds } },
        { entityType: 'USER', entityId: { in: userIds } },
        { entityType: 'TEAM', entityId: user.teamId }
      ]
    };
  }

  // Employee scope
  if (user.role === 'employee') {
    // Get tasks assigned to this employee
    const myTasks = await prisma.taskAssignee.findMany({
      where: { userId: user.id },
      select: { taskId: true }
    });
    const myTaskIds = myTasks.map(mt => mt.taskId);

    return {
      OR: [
        { actorId: user.id }, // actions they performed
        { entityType: 'TASK', entityId: { in: myTaskIds } }, // actions on their tasks
        { entityType: 'USER', entityId: user.id } // actions affecting them specifically
      ]
    };
  }

  // Default fallback (block)
  return { id: 'blocked-scope-impossible-id' };
};
