import express from 'express';
const { Router } = express;
import { getOverview } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['admin', 'manager', 'supervisor']));

router.get('/overview', getOverview);

export default router;
