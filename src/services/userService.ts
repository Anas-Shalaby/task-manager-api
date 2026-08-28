import prisma from '../config/prisma.js';
import { canViewUser, canCreateUser, canUpdateUser } from '../policies/userPolicy.js';
import { getIO } from '../sockets/index.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (filters: any, page: number, limit: number, currentUser: any) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (currentUser.role === 'supervisor') {
    where.teamId = currentUser.teamId;
  } else if (currentUser.role === 'employee') {
    where.id = currentUser.id; // Or let them see their team members
    // Let's allow employees to see their team members based on policy (canViewUser)
    where.teamId = currentUser.teamId; 
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } }
    ];
  }
  
  if (filters.teamId) {
    // Ensure they only filter within their allowed scope
    if (['admin', 'manager'].includes(currentUser.role) || currentUser.teamId === filters.teamId) {
      where.teamId = filters.teamId;
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, name: true, email: true, role: true, rank: true, isActive: true, teamId: true,
        team: { select: { id: true, name: true } },
        _count: { select: { tasksAssigned: { where: { task: { status: { not: 'completed' } } } } } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  return { users, total, pages: Math.ceil(total / limit) };
};

export const getUserById = async (id: string, currentUser: any) => {
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, rank: true, isActive: true, teamId: true,
      team: { select: { id: true, name: true, managerId: true } },
      _count: { select: { tasksAssigned: { where: { task: { status: { not: 'completed' } } } } } }
    }
  });

  if (!targetUser) {
    throw Object.assign(new Error('المستخدم غير موجود'), { code: 'NOT_FOUND' });
  }

  if (!canViewUser(currentUser, targetUser)) {
    throw Object.assign(new Error('ليس لديك صلاحية لعرض هذا المستخدم'), { code: 'FORBIDDEN' });
  }

  return targetUser;
};

export const createUser = async (data: any, currentUser: any) => {
  if (!canCreateUser(currentUser)) {
    throw Object.assign(new Error('ليس لديك صلاحية لإنشاء مستخدم'), { code: 'FORBIDDEN' });
  }

  const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        rank: data.rank || null,
        teamId: data.teamId || null,
        isActive: data.isActive ?? true
      },
      select: { id: true, name: true, email: true, role: true, rank: true, isActive: true, teamId: true, team: { select: { name: true } } }
    });

    await tx.activityLog.create({
      data: {
        actorId: currentUser.id,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        metadata: { name: newUser.name, email: newUser.email, role: newUser.role, rank: newUser.rank }
      }
    });

    return newUser;
  });

  return user;
};

export const updateUser = async (id: string, data: any, currentUser: any) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw Object.assign(new Error('المستخدم غير موجود'), { code: 'NOT_FOUND' });

  if (!canUpdateUser(currentUser, existingUser)) {
    throw Object.assign(new Error('ليس لديك صلاحية لتعديل هذا المستخدم'), { code: 'FORBIDDEN' });
  }

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        rank: data.rank !== undefined ? data.rank : existingUser.rank,
        teamId: data.teamId,
        isActive: data.isActive
      },
      select: { id: true, name: true, email: true, role: true, rank: true, isActive: true, teamId: true, team: { select: { name: true } } }
    });

    await tx.activityLog.create({
      data: {
        actorId: currentUser.id,
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: id,
        metadata: { name: updatedUser.name, role: updatedUser.role, rank: updatedUser.rank, isActive: updatedUser.isActive }
      }
    });

    return updatedUser;
  });

  getIO().to(`user:${id}`).emit('user.updated', user);
  if (user.teamId) {
    getIO().to(`team:${user.teamId}`).emit('team.member_updated', user);
  }
  getIO().to('dashboard').emit('user.updated', user);

  return user;
};

export const getAssignableUsers = async (currentUser: any, teamId?: string) => {
  const where: any = { isActive: true };
  
  if (teamId) {
    // Only return users for the requested team (validated that current user can view them)
    if (currentUser.role === 'supervisor' || currentUser.role === 'employee') {
      if (currentUser.teamId !== teamId) {
        throw Object.assign(new Error('ليس لديك صلاحية لعرض هذا الفريق'), { code: 'FORBIDDEN' });
      }
    }
    where.teamId = teamId;
  } else if (currentUser.role === 'supervisor' || currentUser.role === 'employee') {
    where.teamId = currentUser.teamId;
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      rank: true,
      teamId: true
    },
    orderBy: {
      name: 'asc'
    }
  });
};

export const deleteUser = async (id: string, currentUser: any) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw Object.assign(new Error('المستخدم غير موجود'), { code: 'NOT_FOUND' });

  // Only admins or managers can delete users
  if (!['admin', 'manager'].includes(currentUser.role)) {
    throw Object.assign(new Error('ليس لديك صلاحية لمسح هذا المستخدم'), { code: 'FORBIDDEN' });
  }

  // Prevent deleting oneself
  if (currentUser.id === id) {
    throw Object.assign(new Error('لا يمكنك مسح حسابك الشخصي'), { code: 'CONFLICT' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id } });

    await tx.activityLog.create({
      data: {
        actorId: currentUser.id,
        action: 'USER_DELETED',
        entityType: 'USER',
        entityId: id,
        metadata: { name: existingUser.name, email: existingUser.email }
      }
    });
  });

  getIO().to('dashboard').emit('user.deleted', { id });
  return { success: true };
};
