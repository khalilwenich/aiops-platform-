import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getSettings, updateSection, testIntegration, testSlackWebhook,
  getPlatformStatus, clearCache, purgeOldAnalyses, exportData,
} from '../controllers/settings.controller.js';

const router = Router();

router.get('/',                            authenticate, authorize('admin'), getSettings);
router.get('/platform/status',             authenticate, authorize('admin'), getPlatformStatus);
router.get('/platform/export',             authenticate, authorize('admin'), exportData);
router.post('/platform/clear-cache',       authenticate, authorize('admin'), clearCache);
router.post('/platform/purge-analyses',    authenticate, authorize('admin'), purgeOldAnalyses);
router.post('/integrations/test/:service', authenticate, authorize('admin'), testIntegration);
router.post('/notifications/test-slack',   authenticate, authorize('admin'), testSlackWebhook);
router.patch('/:section',                  authenticate, authorize('admin'), updateSection);

export default router;
