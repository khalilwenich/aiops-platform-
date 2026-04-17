import { pipelineQueue } from '../../queues/queues.js';
import { logger } from '../../utils/logger.js';

export async function handleGitlabWebhook(req, res) {
  const event = req.headers['x-gitlab-event'];
  const body = req.body;

  // Respond 202 immediately so GitLab doesn't time out
  res.status(202).json({ received: true });

  try {
    if (event === 'Pipeline Hook') {
      const { object_attributes: pipeline, project } = body;
      if (pipeline?.status === 'failed') {
        logger.info('Pipeline failure received, queuing analysis', {
          pipelineId: pipeline.id,
          projectId: project?.id,
          ref: pipeline.ref,
        });
        await pipelineQueue.add('analyze-pipeline', {
          projectId: String(project?.id || body.project_id),
          pipelineId: String(pipeline.id),
          ref: pipeline.ref,
        });
      } else {
        logger.info('Pipeline hook received (not failed)', {
          status: pipeline?.status,
          pipelineId: pipeline?.id,
        });
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
