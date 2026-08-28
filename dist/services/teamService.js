import prisma from '../config/prisma.js';
import { canManageTeam, canViewTeam } from '../policies/teamPolicy.js';
import { getIO } from '../sockets/index.js';
export const getTeams = async (filters, page, limit, user) => {
    const skip = (page - 1) * limit;
    // Even if user can only view their own team, we might list teams for managers/admins.
    const where = {};
    if (user.role === 'supervisor' || user.role === 'employee') {
        where.id = user.teamId;
    }
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search } },
            { code: { contains: filters.search } }
        ];
    }
    const [teams, total] = await Promise.all([
        prisma.team.findMany({
            where,
            skip,
            take: limit,
            include: {
                manager: { select: { id: true, name: true } },
                _count: { select: { users: true, tasks: { where: { status: { not: 'completed' } } } } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.team.count({ where })
    ]);
    return { teams, total, pages: Math.ceil(total / limit) };
};
export const getTeamById = async (id, user) => {
    if (!canViewTeam(user, id)) {
        throw Object.assign(new Error('ليس لديك صلاحية لعرض هذا الفريق'), { code: 'FORBIDDEN' });
    }
    return prisma.team.findUnique({
        where: { id },
        include: {
            manager: { select: { id: true, name: true, role: true } },
            users: { select: { id: true, name: true, role: true, isActive: true, _count: { select: { tasksAssigned: { where: { task: { status: { not: 'completed' } } } } } } } }
        }
    });
};
export const createTeam = async (data, user) => {
    if (!canManageTeam(user)) {
        throw Object.assign(new Error('ليس لديك صلاحية لإنشاء فريق'), { code: 'FORBIDDEN' });
    }
    const team = await prisma.$transaction(async (tx) => {
        const newTeam = await tx.team.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                managerId: data.managerId || null,
                isActive: data.isActive ?? true
            },
            include: { manager: { select: { id: true, name: true } }, _count: { select: { users: true, tasks: true } } }
        });
        await tx.activityLog.create({
            data: {
                actorId: user.id,
                action: 'TEAM_CREATED',
                entityType: 'TEAM',
                entityId: newTeam.id,
                metadata: { name: newTeam.name, code: newTeam.code }
            }
        });
        return newTeam;
    });
    return team;
};
export const updateTeam = async (id, data, user) => {
    if (!canManageTeam(user)) {
        throw Object.assign(new Error('ليس لديك صلاحية لتعديل هذا الفريق'), { code: 'FORBIDDEN' });
    }
    const team = await prisma.$transaction(async (tx) => {
        const updatedTeam = await tx.team.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                managerId: data.managerId,
                isActive: data.isActive
            },
            include: { manager: { select: { id: true, name: true } }, _count: { select: { users: true, tasks: true } } }
        });
        await tx.activityLog.create({
            data: {
                actorId: user.id,
                action: 'TEAM_UPDATED',
                entityType: 'TEAM',
                entityId: id,
                metadata: { name: updatedTeam.name, code: updatedTeam.code }
            }
        });
        return updatedTeam;
    });
    getIO().to(`team:${id}`).emit('team.updated', team);
    getIO().to('dashboard').emit('team.updated', team);
    return team;
};
export const deleteTeam = async (id, user) => {
    if (!canManageTeam(user)) {
        throw Object.assign(new Error('ليس لديك صلاحية لمسح هذا الفريق'), { code: 'FORBIDDEN' });
    }
    const existingTeam = await prisma.team.findUnique({ where: { id } });
    if (!existingTeam) {
        throw Object.assign(new Error('الفريق غير موجود'), { code: 'NOT_FOUND' });
    }
    await prisma.$transaction(async (tx) => {
        // Delete the team
        await tx.team.delete({ where: { id } });
        await tx.activityLog.create({
            data: {
                actorId: user.id,
                action: 'TEAM_DELETED',
                entityType: 'TEAM',
                entityId: id,
                metadata: { name: existingTeam.name, code: existingTeam.code }
            }
        });
    });
    getIO().to('dashboard').emit('team.deleted', { id });
    return { success: true };
};
//# sourceMappingURL=teamService.js.map