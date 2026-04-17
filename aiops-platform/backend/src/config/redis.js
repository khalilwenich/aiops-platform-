import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
};

export const redisClient = new Redis({
  ...redisOptions,
  maxRetriesPerRequest: 3,
});

export const bullmqConnection = new Redis(redisOptions);

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis client error', { error: err.message }));
redisClient.on('close', () => logger.warn('Redis client connection closed'));

bullmqConnection.on('connect', () => logger.info('BullMQ Redis connected'));
bullmqConnection.on('error', (err) => logger.error('BullMQ Redis error', { error: err.message }));
