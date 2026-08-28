import express from 'express';
const { Router } = express;
import { sendSuccess, sendError } from '../utils/response.js';
import prisma from '../config/prisma.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        // Test DB connection
        await prisma.$queryRaw `SELECT 1`;
        return sendSuccess(res, {
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return sendError(res, 'HEALTH_CHECK_FAILED', 'فشل فحص النظام', 500, error);
    }
});
export default router;
//# sourceMappingURL=health.js.map