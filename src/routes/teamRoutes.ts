import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as teamController from '../controllers/teamController.js';

const router = Router();

router.use(authenticate);

router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', teamController.createTeam);
router.patch('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

export default router;
