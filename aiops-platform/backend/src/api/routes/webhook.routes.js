import { Router } from 'express';
import { webhookLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateGitlabWebhook } from '../middlewares/hmac.middleware.js';
import { handleGitlabWebhook } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/gitlab', webhookLimiter, validateGitlabWebhook, handleGitlabWebhook);

export default router;
