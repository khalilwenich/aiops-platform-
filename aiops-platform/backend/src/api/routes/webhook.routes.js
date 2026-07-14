import { Router } from 'express';
import { webhookLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateGitlabWebhook } from '../middlewares/hmac.middleware.js';
import { handleGitlabWebhook, handleJenkinsWebhook } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/gitlab',  webhookLimiter, validateGitlabWebhook, handleGitlabWebhook);
router.post('/jenkins', webhookLimiter, handleJenkinsWebhook);

export default router;
