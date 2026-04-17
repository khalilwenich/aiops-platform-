import { Router } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  const mongoState = mongoose.connection.readyState === 1 ? 'ok' : 'error';
  let redisState = 'error';
  try {
    await redisClient.ping();
    redisState = 'ok';
  } catch (e) {
    logger.warn('Redis health check failed', { error: e.message });
  }

  res.json({
    status: 'ok',
    mongodb: mongoState,
    redis: redisState,
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  let redisOk = false;
  try {
    const pong = await redisClient.ping();
    redisOk = pong === 'PONG';
  } catch (e) {
    logger.warn('Redis readiness check failed', { error: e.message });
  }

  if (!mongoOk || !redisOk) {
    return res.status(503).json({
      status: 'not ready',
      mongodb: mongoOk ? 'ok' : 'error',
      redis: redisOk ? 'ok' : 'error',
    });
  }

  res.json({ status: 'ready', mongodb: 'ok', redis: 'ok' });
});

export default router;
