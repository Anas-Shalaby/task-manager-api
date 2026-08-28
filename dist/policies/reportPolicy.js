export const canViewOperationalReport = (user) => {
    // Employees cannot view operational reports
    if (user.role === 'employee')
        return false;
    return true;
};
export const canViewTeamReport = (user, targetTeamId) => {
    if (user.role === 'admin' || user.role === 'manager')
        return true;
    if (user.role === 'supervisor') {
        return user.teamId === targetTeamId;
    }
    return false;
};
// Utility to compute authorized team scopes for the query
export const getAuthorizedTeamScope = (user, requestedTeamId) => {
    // If the user requested a specific team
    if (requestedTeamId) {
        if (canViewTeamReport(user, requestedTeamId)) {
            return { teamId: requestedTeamId };
        }
        // If they request a team they can't view, return something that yields nothing, 
        // or just throw. Let's throw in the controller, so we just return null to indicate failure.
        return undefined;
    }
    // If no specific team is requested, bound the scope by role
    if (user.role === 'admin' || user.role === 'manager') {
        return {}; // All teams
    }
    if (user.role === 'supervisor') {
        return { teamId: user.teamId }; // Bound to their own team
    }
    return undefined; // Employees have no scope
};
//# sourceMappingURL=reportPolicy.js.map