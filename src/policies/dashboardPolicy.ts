export const canViewDashboard = (user: any) => {
  return ['admin', 'manager', 'supervisor'].includes(user.role);
};
