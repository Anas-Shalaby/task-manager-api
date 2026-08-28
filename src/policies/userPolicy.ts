export const canViewUser = (currentUser: any, targetUser: any) => {
  if (['admin', 'manager'].includes(currentUser.role)) return true;
  return currentUser.teamId === targetUser.teamId;
};

export const canCreateUser = (currentUser: any) => {
  return ['admin', 'manager'].includes(currentUser.role);
};

export const canUpdateUser = (currentUser: any, targetUser: any) => {
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'manager') return true; // Could restrict to authorized teams
  return false;
};

export const canDeactivateUser = (currentUser: any) => {
  return ['admin', 'manager'].includes(currentUser.role);
};

export const canAssignUser = (currentUser: any, targetUserId: string, targetUserTeamId: string) => {
  if (['admin', 'manager'].includes(currentUser.role)) return true;
  if (currentUser.role === 'supervisor') return currentUser.teamId === targetUserTeamId;
  return false;
};
