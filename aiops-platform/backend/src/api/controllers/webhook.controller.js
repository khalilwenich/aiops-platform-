import crypto from 'crypto';
import { pipelineQueue } from '../../queues/queues.js';
import { mrCommentService } from '../../services/mrComment.service.js';
import { logger } from '../../utils/logger.js';

export async function handleGitlabWebhook(req, res) {
  const event = req.headers['x-gitlab-event'];
  const body = req.body;

  // Respond 202 immediately so GitLab doesn't time out
  res.status(202).json({ received: true });

  try {
    if (event === 'Pipeline Hook') {
      const { object_attributes: pipeline, project } = body;
      const triggerStatuses = ['failed', 'success'];
      if (triggerStatuses.includes(pipeline?.status)) {
        logger.info('Pipeline hook received, queuing analysis', {
          pipelineId: pipeline.id,
          projectId: project?.id,
          ref: pipeline.ref,
          status: pipeline.status,
        });
        await pipelineQueue.add('analyze-pipeline', {
          projectId: String(project?.id || body.project_id),
          projectName: project?.name || project?.path_with_namespace || String(project?.id),
          pipelineId: String(pipeline.id),
          ref: pipeline.ref,
          status: pipeline.status,
        });
      } else {
        logger.info('Pipeline hook received (skipped)', {
          status: pipeline?.status,
          pipelineId: pipeline?.id,
        });
      }
    } else if (event === 'Merge Request Hook') {
      const mr = body.object_attributes;
      const project = body.project;
      if (['open', 'update'].includes(mr?.action)) {
        logger.info('Merge request hook received, analyzing pre-merge risk', {
          projectId: project?.id,
          mrIid: mr.iid,
          action: mr.action,
        });
        await mrCommentService.analyzeMRRisk(project?.id, mr.iid).catch(err => {
          logger.warn('MR risk analysis failed', { error: err.message });
        });
      } else {
        logger.info('Merge request hook received (skipped)', { action: mr?.action });
      }
    } else if (event === 'Push Hook') {
      logger.info('Push hook received', {
        project: body.project?.name,
        ref: body.ref,
        commits: body.commits?.length,
        pushedBy: body.user_name,
      });
    } else {
      logger.info('GitLab webhook received (ignored)', { event });
    }
  } catch (error) {
    logger.error('Error processing webhook', { event, error: error.message });
  }
}

/**
 * Jenkins webhook handler.
 * Expects the Jenkins Notification Plugin JSON payload.
 * Secure with ?token=<JENKINS_WEBHOOK_SECRET> query param.
 */
export async function handleJenkinsWebhook(req, res) {
  const secret = process.env.JENKINS_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.query.token || req.headers['x-jenkins-token'];
    if (!provided || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) {
      logger.warn('Jenkins webhook: invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  res.status(202).json({ received: true });

  try {
    const body = req.body;
    // Jenkins Notification Plugin schema
    const buildPhase  = body.build?.phase;   // STARTED | COMPLETED | FINALIZED
    const buildStatus = body.build?.status;  // SUCCESS | FAILURE | UNSTABLE | ABORTED
    const buildNumber = body.build?.number;
    const jobName     = body.name;
    const branch      = body.build?.parameters?.BRANCH
      || body.build?.scm?.branch
      || body.build?.parameters?.GIT_BRANCH
      || 'main';

    if (buildPhase !== 'COMPLETED' && buildPhase !== 'FINALIZED') {
      logger.info('Jenkins hook received (phase skipped)', { phase: buildPhase, jobName });
      return;
    }

    const triggerStatuses = ['FAILURE', 'UNSTABLE'];
    if (!triggerStatuses.includes(buildStatus)) {
      logger.info('Jenkins build not failed — skipping analysis', { buildStatus, jobName });
      return;
    }

    const pipelineId = `jenkins-${jobName}-${buildNumber}`;
    const projectId  = jobName;

    logger.info('Jenkins webhook: queuing analysis', { jobName, buildNumber, buildStatus, branch });
    await pipelineQueue.add('analyze-pipeline', {
      projectId,
      projectName: jobName,
      pipelineId,
      ref: branch,
      status: 'failed',
      source: 'jenkins',
      jenkinsBuildUrl: body.build?.full_url || body.build?.url,
    });
  } catch (error) {
    logger.error('Error processing Jenkins webhook', { error: error.message });
  }
}
