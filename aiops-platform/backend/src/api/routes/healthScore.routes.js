import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getAllScores, getProjectScore, getScoreHistory, computeAll } from '../controllers/healthScore.controller.js';

const router = Router();

router.get('/',                       authenticate, getAllScores);
router.post('/compute-all',           authenticate, computeAll);
router.get('/:projectId',             authenticate, getProjectScore);
router.get('/:projectId/history',     authenticate, getScoreHistory);

export default router;
