export const canViewTeam = (user, teamId) => {
    if (['admin', 'manager'].includes(user.role))
        return true;
    return user.teamId === teamId;
};
export const canManageTeam = (user) => {
    return ['admin', 'manager'].includes(user.role);
};
export const canViewTeamMembers = (user, teamId) => {
    if (['admin', 'manager'].includes(user.role))
        return true;
    return user.teamId === teamId;
};
export const canAssignWithinTeam = (user, teamId) => {
    if (['admin', 'manager'].includes(user.role))
        return true;
    if (user.role === 'supervisor')
        return user.teamId === teamId;
    return false;
};
//# sourceMappingURL=teamPolicy.js.map