import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { canViewTask } from '../policies/taskPolicy.js';
import { canViewDashboard } from '../policies/dashboardPolicy.js';
import { canViewTeam } from '../policies/teamPolicy.js';
import prisma from '../config/prisma.js';
let ioInstance;
export const initSockets = (io) => {
    ioInstance = io;
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = verifyToken(token);
            socket.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`[Socket]: User connected: ${user.id}`);
        // Every user joins their private room
        socket.join(`user:${user.id}`);
        // Only authorized roles can join dashboard room
        if (canViewDashboard(user)) {
            socket.join('dashboard');
        }
        socket.on('join_task', async (taskId) => {
            try {
                const task = await prisma.task.findUnique({
                    where: { id: taskId },
                    include: { assignees: true }
                });
                if (task && canViewTask(user, task)) {
                    socket.join(`task:${taskId}`);
                    console.log(`[Socket]: User ${user.id} joined task:${taskId}`);
                }
            }
            catch (err) {
                console.error('[Socket]: Error joining task', err);
            }
        });
        socket.on('leave_task', (taskId) => {
            socket.leave(`task:${taskId}`);
        });
        socket.on('join_team', (teamId) => {
            if (canViewTeam(user, teamId)) {
                socket.join(`team:${teamId}`);
                console.log(`[Socket]: User ${user.id} joined team:${teamId}`);
            }
        });
        socket.on('leave_team', (teamId) => {
            socket.leave(`team:${teamId}`);
        });
        socket.on('disconnect', () => {
            console.log(`[Socket]: User disconnected: ${user.id}`);
        });
    });
};
export const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.io is not initialized');
    }
    return ioInstance;
};
//# sourceMappingURL=index.js.map