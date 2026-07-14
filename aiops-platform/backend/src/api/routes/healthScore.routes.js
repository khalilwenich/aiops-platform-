import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { resolveTeamAccess } from '../middlewares/teamAccess.middleware.js';
import { getAllScores, getProjectScore, getScoreHistory, computeAll } from '../controllers/healthScore.controller.js';

const router = Router();

router.get('/',                       authenticate, resolveTeamAccess, getAllScores);
router.post('/compute-all',           authenticate, authorize('admin'), computeAll);
router.get('/:projectId',             authenticate, resolveTeamAccess, getProjectScore);
router.get('/:projectId/history',     authenticate, resolveTeamAccess, getScoreHistory);

export default router;
