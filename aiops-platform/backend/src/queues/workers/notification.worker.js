import { Worker } from 'bullmq';
import { bullmqConnection } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';

async function processNotification(job) {
  const { type, payload } = job.data;
  logger.info('Processing notification', { jobId: job.id, type });
  // Future: integrate email/Slack/PagerDuty notifications
  logger.info('Notification processed', { type, payload });
  return { sent: true };
}

export const notificationWorker = new Worker(
  'notifications',
  processNotification,
  { connection: bullmqConnection, concurrency: 10 }
);

notificationWorker.on('completed', (job) => {
  logger.info('Notification job completed', { jobId: job.id });
});

notificationWorker.on('failed', (job, err) => {
  logger.error('Notification job failed', { jobId: job?.id, error: err.message });
});
