import crypto from 'crypto';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export const validateGitlabWebhook = (req, res, next) => {
  const token = req.headers['x-gitlab-token'];
  const expected = config.gitlab.webhookSecret;

  if (!token || !expected) {
    return res.status(401).json({ error: 'Missing webhook token' });
  }

  try {
    const tokenBuffer = Buffer.from(token, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (tokenBuffer.length !== expectedBuffer.length) {
      logger.warn('Invalid webhook token attempt (length mismatch)');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const valid = crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
    if (!valid) {
      logger.warn('Invalid webhook token attempt');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    next();
  } catch (err) {
    logger.error('Webhook validation error', { error: err.message });
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
};
