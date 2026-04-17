import { gitlabService } from './gitlab.service.js';
import { logger } from '../../utils/logger.js';

// Simple concurrency-limited async map (no p-limit dependency needed)
async function pMap(items, mapper, concurrency = 5) {
  const results = [];
  const queue = [...items];
  const workers = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item !== undefined) {
        results.push(await mapper(item));
      }
    }
  }

  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

class LogCollectionService {
  async collectLogs(projectId, pipelineId) {
    const failedJobs = await gitlabService.fetchFailedJobs(projectId, pipelineId);
    if (!failedJobs || failedJobs.length === 0) {
      logger.info('No failed jobs found', { projectId, pipelineId });
      return [];
    }

    const results = await pMap(failedJobs, async (job) => {
      try {
        const rawLog = await gitlabService.fetchJobLogs(projectId, job.id);
        const logs = rawLog ? this.chunkLog(rawLog) : [];
        const errorLines = rawLog ? this.extractErrorLines(rawLog) : [];

        return {
          jobId: String(job.id),
          jobName: job.name,
          stage: job.stage,
          logs,
          errorLines,
        };
      } catch (error) {
        logger.error('Failed to collect logs for job', {
          jobId: job.id,
          jobName: job.name,
          error: error.message,
        });
        return {
          jobId: String(job.id),
          jobName: job.name,
          stage: job.stage,
          logs: [],
          errorLines: [],
        };
      }
    }, 5);

    return results;
  }

  chunkLog(rawLog, maxLines = 200) {
    const lines = rawLog.split('\n');
    const MAX_BYTES = 50 * 1024;
    if (Buffer.byteLength(rawLog, 'utf8') > MAX_BYTES) {
      return lines.slice(-maxLines);
    }
    return lines.slice(-maxLines);
  }

  extractErrorLines(log) {
    const errorPattern = /\b(ERROR|FATAL|EXCEPTION|Exception|Error:|failed|FAILED|panic:|PANIC)\b/i;
    return log.split('\n')
      .filter(line => errorPattern.test(line))
      .slice(-50);
  }
}

export const logCollectionService = new LogCollectionService();
