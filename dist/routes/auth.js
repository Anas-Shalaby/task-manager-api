import express from 'express';
const { Router } = express;
import { login } from '../controllers/authController.js';
const router = Router();
router.post('/login', login);
export default router;
//# sourceMappingURL=auth.js.map