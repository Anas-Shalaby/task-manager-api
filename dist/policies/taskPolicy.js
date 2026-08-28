export const canViewTask = (user, task) => {
    if (['admin', 'manager'].includes(user.role))
        return true;
    if (user.role === 'supervisor')
        return user.teamId === task.teamId;
    // Employee can only view if assigned
    const isAssigned = task.assignees?.some((a) => a.userId === user.id);
    return isAssigned;
};
export const canUpdateTaskProgress = (user, task) => {
    if (['admin', 'manager'].includes(user.role)) {
        return true;
    }
    // Supervisors and Employees can only update progress if they are assigned
    const isAssigned = task.assignees?.some((a) => a.userId === user.id);
    return isAssigned;
};
export const canChangeTaskStatus = (user, task) => {
    if (['admin', 'manager'].includes(user.role)) {
        return true;
    }
    // Supervisors and Employees can only change status if they are assigned
    const isAssigned = task.assignees?.some((a) => a.userId === user.id);
    return isAssigned;
};
export const canCreateTask = (user) => {
    return ['admin', 'manager'].includes(user.role);
};
//# sourceMappingURL=taskPolicy.js.map