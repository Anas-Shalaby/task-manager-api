import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import dashboardRouter from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notificationRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import { initSockets } from './sockets/index.js';
dotenv.config();
const app = express();
const httpServer = createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// Config CORS for production safety
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
// Socket.IO Foundation
const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST']
    }
});
initSockets(io);
// App Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity', activityRoutes);
// Handle unknown routes
app.use(notFoundHandler);
// Centralized Error Handling
app.use(errorHandler);
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`[Server]: API is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map