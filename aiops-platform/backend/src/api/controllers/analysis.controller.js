import { Analysis } from '../../models/Analysis.model.js';
import { Pipeline } from '../../models/Pipeline.model.js';
import { logger } from '../../utils/logger.js';

export async function getAnalysisByPipeline(req, res, next) {
  try {
    const analysis = await Analysis.findOne({
      pipelineId: req.params.pipelineId,
    }).lean();
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found for this pipeline' });
    }
    res.json(analysis);
  } catch (error) {
    next(error);
  }
}

export async function getRecentAnalyses(req, res, next) {
  try {
    const analyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(analyses);
  } catch (error) {
    next(error);
  }
}

export async function markResolved(req, res, next) {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (analysis.resolved) {
      return res.status(400).json({ error: 'Analysis already resolved' });
    }

    const resolvedAt = new Date();

    // Compute MTTR from pipeline creation time
    let mttr = null;
    try {
      const pipeline = await Pipeline.findOne({
        pipelineId: analysis.pipelineId,
      }).lean();
      if (pipeline?.createdAt) {
        mttr = Math.round(
          (resolvedAt - new Date(pipeline.createdAt)) / (1000 * 60)
        );
      }
    } catch (err) {
      logger.warn('Could not compute MTTR', { error: err.message });
    }

    analysis.resolved = true;
    analysis.resolvedAt = resolvedAt;
    if (mttr !== null) analysis.mttr = mttr;
    await analysis.save();

    logger.info('Analysis marked resolved', {
      analysisId: analysis._id,
      pipelineId: analysis.pipelineId,
      resolvedBy: req.user.email,
      mttr,
    });

    res.json(analysis.toObject());
  } catch (error) {
    next(error);
  }
}

export async function getTopRecurringIssues(req, res, next) {
  try {
    const topIssues = await Analysis.aggregate([
      {
        $group: {
          _id: '$errorType',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          errorType: '$_id',
          count: 1,
          avgConfidence: 1,
          _id: 0,
        },
      },
    ]);
    res.json(topIssues);
  } catch (error) {
    next(error);
  }
}
