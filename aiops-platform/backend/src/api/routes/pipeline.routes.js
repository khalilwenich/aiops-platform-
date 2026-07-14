import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { resolveTeamAccess } from '../middlewares/teamAccess.middleware.js';
import {
  getAllPipelines,
  getPipelineById,
  getPipelineStats,
  getProjects,
  getMetrics,
  retriggerAnalysis,
} from '../controllers/pipeline.controller.js';

const router = Router();

router.get('/', authenticate, resolveTeamAccess, getAllPipelines);
router.get('/stats', authenticate, resolveTeamAccess, getPipelineStats);
router.get('/projects', authenticate, resolveTeamAccess, getProjects);
router.get('/metrics', authenticate, resolveTeamAccess, getMetrics);
router.get('/:id', authenticate, getPipelineById);
router.post('/:id/retry', authenticate, authorize('admin', 'analyst'), retriggerAnalysis);

export default router;
