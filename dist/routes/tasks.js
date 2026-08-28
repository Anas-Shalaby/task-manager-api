import express from 'express';
const { Router } = express;
import * as taskController from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.use(authenticate); // Protect all task routes
router.get('/', taskController.listTasks);
router.get('/metrics', taskController.getMetrics);
router.post('/', taskController.createTask);
router.get('/my', taskController.getMyTasks);
router.get('/my/metrics', taskController.getMyMetrics);
router.get('/:id', taskController.getTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.get('/:id/timeline', taskController.getTimeline);
// Domain Actions
router.post('/:id/start', taskController.startTask);
router.post('/:id/block', taskController.blockTask);
router.post('/:id/unblock', taskController.unblockTask);
router.post('/:id/submit-review', taskController.submitForReview);
router.post('/:id/review', taskController.reviewTask);
router.post('/:id/updates', taskController.addUpdate);
router.post('/:id/comments', taskController.addComment);
export default router;
//# sourceMappingURL=tasks.js.map