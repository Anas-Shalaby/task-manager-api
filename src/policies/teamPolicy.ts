export const canViewTeam = (user: any, teamId: string) => {
  if (['admin', 'manager'].includes(user.role)) return true;
  return user.teamId === teamId;
};

export const canManageTeam = (user: any) => {
  return ['admin', 'manager'].includes(user.role);
};

export const canViewTeamMembers = (user: any, teamId: string) => {
  if (['admin', 'manager'].includes(user.role)) return true;
  return user.teamId === teamId;
};

export const canAssignWithinTeam = (user: any, teamId: string) => {
  if (['admin', 'manager'].includes(user.role)) return true;
  if (user.role === 'supervisor') return user.teamId === teamId;
  return false;
};
