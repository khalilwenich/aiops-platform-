import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAnalysisByPipeline,
  getRecentAnalyses,
  markResolved,
  getTopRecurringIssues,
} from '../controllers/analysis.controller.js';

const router = Router();

router.get('/', authenticate, getRecentAnalyses);
router.get('/recurring', authenticate, getTopRecurringIssues);
router.get('/:pipelineId', authenticate, getAnalysisByPipeline);
router.patch('/:id/resolve', authenticate, authorize('admin', 'analyst'), markResolved);

export default router;
