export const canTransitionTask = (task, fromStatus, toStatus, user) => {
    if (task.status !== fromStatus)
        return false;
    const isManagerOrSupervisor = ['admin', 'manager', 'supervisor'].includes(user.role);
    const isOwner = task.assignees?.some((a) => a.userId === user.id && a.isOwner);
    const isContributor = task.assignees?.some((a) => a.userId === user.id && !a.isOwner);
    const canExecute = isManagerOrSupervisor || isOwner || isContributor;
    switch (fromStatus) {
        case 'pending':
            if (toStatus === 'in_progress')
                return canExecute;
            return false;
        case 'in_progress':
            if (toStatus === 'blocked')
                return canExecute;
            if (toStatus === 'ready_for_review')
                return canExecute;
            if (toStatus === 'pending')
                return isManagerOrSupervisor;
            return false;
        case 'blocked':
            if (toStatus === 'in_progress')
                return canExecute;
            return false;
        case 'ready_for_review':
            if (toStatus === 'completed')
                return isManagerOrSupervisor;
            if (toStatus === 'in_progress')
                return isManagerOrSupervisor; // Rejected
            return false;
        case 'completed':
            return false; // Terminal state
        default:
            return false;
    }
};
export const validateProgressRules = (status, progress) => {
    if (progress < 0 || progress > 100)
        return false;
    if (status === 'pending' && progress !== 0)
        return false;
    if (status === 'ready_for_review' && progress !== 100)
        return false;
    if (status === 'completed' && progress !== 100)
        return false;
    // If in progress or blocked, progress shouldn't be 100
    if ((status === 'in_progress' || status === 'blocked') && progress === 100)
        return false;
    return true;
};
//# sourceMappingURL=taskLifecyclePolicy.js.map