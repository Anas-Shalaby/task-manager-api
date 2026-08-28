import express from 'express';
import { getOperationalReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js'; // reusing authenticate middleware
const router = express.Router();
router.use(authenticate);
// GET /api/reports/operational
router.get('/operational', getOperationalReport);
export default router;
//# sourceMappingURL=reportRoutes.js.map