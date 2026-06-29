import { Analysis } from '../../models/Analysis.model.js';
import { Pipeline } from '../../models/Pipeline.model.js';
import { knowledgeBaseService } from '../../services/knowledgeBase.service.js';
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
    const { page = 1, limit = 20, status, riskLevel } = req.query;
    const filter = {};
    if (status === 'resolved') filter.resolved = true;
    if (status === 'open') filter.resolved = { $ne: true };
    if (riskLevel) filter.riskLevel = riskLevel;

    const skip = (Number(page) - 1) * Number(limit);
    const [analyses, total] = await Promise.all([
      Analysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Analysis.countDocuments(filter),
    ]);

    res.json({
      analyses,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
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

    await knowledgeBaseService.saveFromAnalysis(analysis.toObject(), req.user.email).catch(err => {
      logger.warn('Could not save resolution to knowledge base', { error: err.message });
    });

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

export async function getUsageStats(req, res, next) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [result] = await Analysis.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgProcessingTime: { $avg: '$processingTime' },
        },
      },
    ]);

    res.json({
      totalAnalyses: result?.totalAnalyses || 0,
      avgConfidence: result?.avgConfidence ? Math.round(result.avgConfidence * 100) : 0,
      avgProcessingTimeSec: result?.avgProcessingTime ? Math.round(result.avgProcessingTime / 1000 * 10) / 10 : 0,
    });
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
