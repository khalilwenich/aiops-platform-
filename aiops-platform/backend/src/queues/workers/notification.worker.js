import { Worker } from 'bullmq';
import { bullmqConnection } from '../../config/redis.js';
import { Settings } from '../../models/Settings.model.js';
import { logger } from '../../utils/logger.js';

async function sendSlack(webhookUrl, text) {
  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) throw new Error(`Slack returned HTTP ${resp.status}`);
}

function buildSlackText(type, payload) {
  const { projectName, pipelineId, rootCause, riskLevel, summary } = payload;
  const riskEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[riskLevel] || '⚪';
  switch (type) {
    case 'pipeline-failed':
      return `${riskEmoji} *[AIOps] Pipeline failure* — ${projectName} #${pipelineId}\n*Cause:* ${rootCause || summary || 'Unknown'}\n*Sévérité:* ${riskLevel || 'medium'}`;
    case 'incident-critical':
      return `🔴 *[AIOps] Incident critique* — ${projectName} / pipeline #${pipelineId}\n<!channel> Sévérité : *${riskLevel}*. Veuillez investiguer.`;
    case 'incident-resolved':
      return `✅ *[AIOps] Incident résolu* — ${projectName} / pipeline #${pipelineId}`;
    default:
      return `[AIOps] ${type}: ${JSON.stringify(payload).slice(0, 300)}`;
  }
}

async function processNotification(job) {
  const { type, payload } = job.data;
  logger.info('Processing notification', { jobId: job.id, type, projectId: payload?.projectId });

  const settings = await Settings.getSingleton().catch(() => null);
  const slackCfg = settings?.notifications?.channels?.slack;
  const notifCfg = settings?.notifications;

  const typeEnabled =
    (type === 'pipeline-failed'   && notifCfg?.pipeline?.failed   !== false) ||
    (type === 'incident-critical' && notifCfg?.security?.critical  !== false) ||
    (type === 'incident-resolved' && notifCfg?.pipeline?.recovered !== false) ||
    !['pipeline-failed', 'incident-critical', 'incident-resolved'].includes(type);

  if (!typeEnabled) {
    logger.info('Notification suppressed by settings', { type });
    return { sent: false, reason: 'disabled' };
  }

  if (slackCfg?.enabled && slackCfg?.webhookUrl) {
    const text = buildSlackText(type, payload);
    await sendSlack(slackCfg.webhookUrl, text);
    logger.info('Global Slack notification sent', { type, projectId: payload?.projectId });
  }

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
