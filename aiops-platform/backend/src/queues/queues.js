import { Queue } from 'bullmq';
import { bullmqConnection } from '../config/redis.js';

export const pipelineQueue = new Queue('pipeline-analysis', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const logQueue = new Queue('log-collection', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 2000 },
  },
});

export const notificationQueue = new Queue('notifications', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
