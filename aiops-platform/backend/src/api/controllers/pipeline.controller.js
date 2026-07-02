import { Pipeline } from '../../models/Pipeline.model.js';
import { Analysis } from '../../models/Analysis.model.js';
import { pipelineQueue } from '../../queues/queues.js';
import { logger } from '../../utils/logger.js';

export async function getAllPipelines(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      projectId,
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [pipelines, total] = await Promise.all([
      Pipeline.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Pipeline.countDocuments(filter),
    ]);

    res.json({
      pipelines,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPipelineById(req, res, next) {
  try {
    const pipeline = await Pipeline.findOne({ pipelineId: req.params.id }).lean();
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    const analysis = await Analysis.findOne({ pipelineId: req.params.id }).lean();
    res.json({ ...pipeline, analysis });
  } catch (error) {
    next(error);
  }
}

export async function getProjects(req, res, next) {
  try {
    const projects = await Pipeline.aggregate([
      { $group: { _id: '$projectId', projectName: { $last: '$projectName' } } },
      { $project: { _id: 0, projectId: '$_id', projectName: 1 } },
      { $sort: { projectName: 1 } },
    ]);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
}

export async function getPipelineStats(req, res, next) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalPipelines, failedPipelines, analyses, trendsRaw] = await Promise.all([
      Pipeline.countDocuments(),
      Pipeline.countDocuments({ status: 'failed' }),
      Analysis.find({ resolved: true, mttr: { $gt: 0 } }).select('mttr').lean(),
      Pipeline.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            total: { $sum: 1 },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const avgMTTR =
      analyses.length > 0
        ? analyses.reduce((sum, a) => sum + a.mttr, 0) / analyses.length
        : 0;

    const topFailureTypes = await Analysis.aggregate([
      { $group: { _id: '$errorType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalPipelines,
      failureRate:
        totalPipelines > 0
          ? ((failedPipelines / totalPipelines) * 100).toFixed(1)
          : 0,
      avgMTTR: Math.round(avgMTTR),
      topFailureTypes,
      trendsLast7Days: trendsRaw,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMetrics(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [byProject, trendsRaw, topErrors, incidentStats] = await Promise.all([
      Pipeline.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$projectId',
            projectName: { $last: '$projectName' },
            total: { $sum: 1 },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            projectId: '$_id',
            projectName: 1,
            total: 1,
            failed: 1,
            successRate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $multiply: [{ $divide: [{ $subtract: ['$total', '$failed'] }, '$total'] }, 100] },
                100,
              ],
            },
          },
        },
        { $sort: { failed: -1 } },
      ]),
      Pipeline.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Analysis.aggregate([
        { $group: { _id: '$errorType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      import('../../models/Incident.model.js').then(async ({ Incident }) => {
        const [total, resolved, mttrData] = await Promise.all([
          Incident.countDocuments(),
          Incident.countDocuments({ status: 'resolved' }),
          Incident.find({ status: 'resolved', mttr: { $gt: 0 } }).select('mttr').lean(),
        ]);
        const avgMTTR = mttrData.length > 0
          ? Math.round(mttrData.reduce((s, i) => s + i.mttr, 0) / mttrData.length)
          : 0;
        return { total, resolved, avgMTTR };
      }),
    ]);

    const overallTotal = byProject.reduce((s, p) => s + p.total, 0);
    const overallFailed = byProject.reduce((s, p) => s + p.failed, 0);

    res.json({
      period: '30d',
      overall: {
        total: overallTotal,
        failed: overallFailed,
        successRate: overallTotal > 0
          ? +((((overallTotal - overallFailed) / overallTotal) * 100).toFixed(1))
          : 100,
      },
      incidents: incidentStats,
      byProject,
      trends: trendsRaw,
      topErrors,
    });
  } catch (error) {
    next(error);
  }
}

export async function retriggerAnalysis(req, res, next) {
  try {
    const pipeline = await Pipeline.findOne({ pipelineId: req.params.id }).lean();
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    await pipelineQueue.add('analyze-pipeline', {
      projectId: pipeline.projectId,
      pipelineId: pipeline.pipelineId,
      ref: pipeline.ref,
    });
    logger.info('Analysis re-triggered', {
      pipelineId: pipeline.pipelineId,
      by: req.user.email,
    });
    res.json({ message: 'Analysis re-triggered', pipelineId: pipeline.pipelineId });
  } catch (error) {
    next(error);
  }
}
