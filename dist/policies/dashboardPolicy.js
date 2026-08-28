export const canViewDashboard = (user) => {
    return ['admin', 'manager', 'supervisor'].includes(user.role);
};
//# sourceMappingURL=dashboardPolicy.js.map