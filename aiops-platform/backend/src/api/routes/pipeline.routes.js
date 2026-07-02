import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAllPipelines,
  getPipelineById,
  getPipelineStats,
  getProjects,
  getMetrics,
  retriggerAnalysis,
} from '../controllers/pipeline.controller.js';

const router = Router();

router.get('/', authenticate, getAllPipelines);
router.get('/stats', authenticate, getPipelineStats);
router.get('/projects', authenticate, getProjects);
router.get('/metrics', authenticate, getMetrics);
router.get('/:id', authenticate, getPipelineById);
router.post('/:id/retry', authenticate, authorize('admin', 'analyst'), retriggerAnalysis);

export default router;
