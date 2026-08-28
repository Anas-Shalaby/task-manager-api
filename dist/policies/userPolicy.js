export const canViewUser = (currentUser, targetUser) => {
    if (['admin', 'manager'].includes(currentUser.role))
        return true;
    return currentUser.teamId === targetUser.teamId;
};
export const canCreateUser = (currentUser) => {
    return ['admin', 'manager'].includes(currentUser.role);
};
export const canUpdateUser = (currentUser, targetUser) => {
    if (currentUser.role === 'admin')
        return true;
    if (currentUser.role === 'manager')
        return true; // Could restrict to authorized teams
    return false;
};
export const canDeactivateUser = (currentUser) => {
    return ['admin', 'manager'].includes(currentUser.role);
};
export const canAssignUser = (currentUser, targetUserId, targetUserTeamId) => {
    if (['admin', 'manager'].includes(currentUser.role))
        return true;
    if (currentUser.role === 'supervisor')
        return currentUser.teamId === targetUserTeamId;
    return false;
};
//# sourceMappingURL=userPolicy.js.map