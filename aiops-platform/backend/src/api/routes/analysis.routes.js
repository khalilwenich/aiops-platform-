import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { resolveTeamAccess } from '../middlewares/teamAccess.middleware.js';
import {
  getAnalysisByPipeline,
  getRecentAnalyses,
  markResolved,
  getTopRecurringIssues,
  getUsageStats,
} from '../controllers/analysis.controller.js';

const router = Router();

router.get('/', authenticate, resolveTeamAccess, getRecentAnalyses);
router.get('/recurring', authenticate, resolveTeamAccess, getTopRecurringIssues);
router.get('/stats/usage', authenticate, getUsageStats);
router.get('/:pipelineId', authenticate, getAnalysisByPipeline);
router.patch('/:id/resolve', authenticate, authorize('admin', 'analyst'), markResolved);

export default router;
