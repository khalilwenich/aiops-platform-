import { Pipeline }      from '../models/Pipeline.model.js';
import { Analysis }      from '../models/Analysis.model.js';
import { Vulnerability } from '../models/Vulnerability.model.js';
import { healthScoreService } from './healthScore.service.js';
import { logger } from '../utils/logger.js';

class WeeklyReportService {
  async generateReport(weekOffset = 0) {
    const { start, end } = this.getWeekRange(weekOffset);

    const [pipelines, analyses, vulnerabilities] = await Promise.all([
      Pipeline.find({ createdAt: { $gte: start, $lte: end } }).lean(),
      Analysis.find({ createdAt: { $gte: start, $lte: end } }).lean(),
      Vulnerability.find({ createdAt: { $gte: start, $lte: end } }).lean(),
    ]);

    let healthScores = [];
    try {
      healthScores = await healthScoreService.getAllScores();
    } catch (err) {
      logger.warn('Could not fetch health scores for report', { error: err.message });
    }

    const totalPipelines = pipelines.length;
    const failed  = pipelines.filter(p => p.status === 'failed');
    const success = pipelines.filter(p => p.status === 'success');
    const failureRate = totalPipelines > 0
      ? Math.round((failed.length / totalPipelines) * 100) : 0;

    const failuresByType = analyses.reduce((acc, a) => {
      acc[a.errorType] = (acc[a.errorType] || 0) + 1;
      return acc;
    }, {});

    const topIssues = Object.entries(failuresByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));

    const resolved = analyses.filter(a => a.resolved && a.mttr);
    const avgMTTR  = resolved.length
      ? Math.round(resolved.reduce((s, a) => s + a.mttr, 0) / resolved.length)
      : 0;

    const devImpact = {};
    failed.forEach(p => {
      if (p.triggeredBy) devImpact[p.triggeredBy] = (devImpact[p.triggeredBy] || 0) + 1;
    });
    const topDev = Object.entries(devImpact).sort(([, a], [, b]) => b - a)[0];

    const mostStable = [...healthScores].sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    return {
      weekLabel: `Week of ${start.toLocaleDateString('fr-TN')}`,
      weekOffset,
      period: { start, end },
      summary: {
        totalPipelines,
        successCount:      success.length,
        failedCount:       failed.length,
        failureRate,
        avgMTTR,
        criticalVulns:     vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        resolvedIncidents: resolved.length,
      },
      topIssues,
      projectScores:      healthScores,
      mostImpactedDev:    topDev ? { name: topDev[0], count: topDev[1] } : null,
      mostStableProject:  mostStable || null,
      generatedAt:        new Date(),
    };
  }

  getWeekRange(weekOffset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek - weekOffset * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  listAvailableWeeks(count = 8) {
    return Array.from({ length: count }, (_, i) => {
      const { start } = this.getWeekRange(i);
      return {
        weekOffset: i,
        label: i === 0 ? 'This week' : i === 1 ? 'Last week' : `${start.toLocaleDateString('fr-TN')}`,
        start,
      };
    });
  }
}

export const weeklyReportService = new WeeklyReportService();
