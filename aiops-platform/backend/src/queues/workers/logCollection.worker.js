import { Worker } from 'bullmq';
import { bullmqConnection } from '../../config/redis.js';
import { logCollectionService } from '../../services/gitlab/logCollection.service.js';
import { logger } from '../../utils/logger.js';

async function processLogCollection(job) {
  const { projectId, pipelineId } = job.data;
  logger.info('Processing log collection job', { jobId: job.id, projectId, pipelineId });
  const logs = await logCollectionService.collectLogs(projectId, pipelineId);
  logger.info('Log collection completed', { jobId: job.id, jobCount: logs.length });
  return logs;
}

export const logCollectionWorker = new Worker(
  'log-collection',
  processLogCollection,
  { connection: bullmqConnection, concurrency: 3 }
);

logCollectionWorker.on('completed', (job) => {
  logger.info('Log collection job completed', { jobId: job.id });
});

logCollectionWorker.on('failed', (job, err) => {
  logger.error('Log collection job failed', { jobId: job?.id, error: err.message });
});
