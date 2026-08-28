export const canViewTask = (user: any, task: any) => {
  if (['admin', 'manager'].includes(user.role)) return true;
  if (user.role === 'supervisor') return user.teamId === task.teamId;
  
  // Employee can only view if assigned
  const isAssigned = task.assignees?.some((a: any) => a.userId === user.id);
  return isAssigned;
};

export const canUpdateTaskProgress = (user: any, task: any) => {
  if (['admin', 'manager'].includes(user.role)) {
    return true;
  }
  
  // Supervisors and Employees can only update progress if they are assigned
  const isAssigned = task.assignees?.some((a: any) => a.userId === user.id);
  return isAssigned;
};

export const canChangeTaskStatus = (user: any, task: any) => {
  if (['admin', 'manager'].includes(user.role)) {
    return true;
  }
  
  // Supervisors and Employees can only change status if they are assigned
  const isAssigned = task.assignees?.some((a: any) => a.userId === user.id);
  return isAssigned;
};

export const canCreateTask = (user: any) => {
  return ['admin', 'manager'].includes(user.role);
};
