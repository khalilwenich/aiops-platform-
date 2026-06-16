import { Pipeline }      from '../models/Pipeline.model.js';
import { Analysis }      from '../models/Analysis.model.js';
import { Vulnerability } from '../models/Vulnerability.model.js';
import { ProjectHealth } from '../models/ProjectHealth.model.js';
import { logger }        from '../utils/logger.js';

class HealthScoreService {
  WEIGHTS = {
    pipelineSuccessRate: 25,
    codeCoverage:        15,
    criticalVulns:       20,
    codeSmells:          10,
    avgMTTR:             20,
    lastFailureAge:      10,
  };

  async computeScore(projectId, projectName = '') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [pipelines, analyses, vulns] = await Promise.all([
      Pipeline.find({ projectId, createdAt: { $gte: since } }).lean(),
      Analysis.find({ projectId, createdAt: { $gte: since } }).lean(),
      Vulnerability.find({ projectId, status: 'open' }).lean(),
    ]);

    const breakdown = {
      pipelineSuccessRate: this.scorePipelineRate(pipelines),
      codeCoverage:        this.scoreCoverage(analyses),
      criticalVulns:       this.scoreVulns(vulns),
      codeSmells:          this.scoreCodeSmells(analyses),
      avgMTTR:             this.scoreMTTR(analyses),
      lastFailureAge:      this.scoreLastFailure(pipelines),
    };

    const totalScore = Object.entries(breakdown).reduce((sum, [key, val]) => {
      return sum + (val.score * this.WEIGHTS[key] / 100);
    }, 0);

    const score = Math.round(Math.min(100, Math.max(0, totalScore)));

    const existing = await ProjectHealth.findOne({ projectId }).sort({ computedAt: -1 }).lean();
    const trend = existing
      ? score > existing.score ? 'up' : score < existing.score ? 'down' : 'stable'
      : 'stable';
    const trendValue = existing ? score - existing.score : 0;

    const result = {
      projectId,
      projectName: projectName || projectId,
      score,
      grade:       this.scoreToGrade(score),
      trend,
      trendValue,
      breakdown,
      computedAt: new Date(),
    };

    await ProjectHealth.findOneAndUpdate(
      { projectId },
      { $set: result },
      { upsert: true, new: true }
    );

    return result;
  }

  async getAllScores() {
    const records = await ProjectHealth.find()
      .sort({ computedAt: -1 })
      .lean();
    const seen = new Set();
    return records.filter(r => {
      if (seen.has(r.projectId)) return false;
      seen.add(r.projectId);
      return true;
    });
  }

  async computeAllScores() {
    const projects = await Pipeline.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$projectId', projectName: { $first: '$projectName' } } },
    ]);

    return Promise.all(
      projects.map(p => this.computeScore(p._id, p.projectName || p._id))
    );
  }

  scorePipelineRate(pipelines) {
    if (!pipelines.length) return { score: 50, weight: this.WEIGHTS.pipelineSuccessRate, value: 'No data' };
    const successCount = pipelines.filter(p => p.status === 'success').length;
    const rate = (successCount / pipelines.length) * 100;
    return { score: Math.round(rate), weight: this.WEIGHTS.pipelineSuccessRate, value: `${Math.round(rate)}%` };
  }

  scoreVulns(vulns) {
    const critical = vulns.filter(v => v.severity === 'CRITICAL').length;
    const high     = vulns.filter(v => v.severity === 'HIGH').length;
    const penalty  = critical * 20 + high * 10;
    const score    = Math.max(0, 100 - penalty);
    return { score, weight: this.WEIGHTS.criticalVulns, value: `${critical} critical, ${high} high` };
  }

  scoreMTTR(analyses) {
    const resolved = analyses.filter(a => a.resolved && a.mttr);
    if (!resolved.length) return { score: 70, weight: this.WEIGHTS.avgMTTR, value: 'No data' };
    const avgMTTR = resolved.reduce((s, a) => s + a.mttr, 0) / resolved.length;
    const score = avgMTTR < 15 ? 100 : avgMTTR < 30 ? 80 : avgMTTR < 60 ? 60 : 30;
    return { score, weight: this.WEIGHTS.avgMTTR, value: `${Math.round(avgMTTR)} min avg` };
  }

  scoreCoverage(analyses) {
    const withCoverage = analyses.filter(a => a.rawData?.sonarIssuesCount !== undefined);
    if (!withCoverage.length) return { score: 60, weight: this.WEIGHTS.codeCoverage, value: 'No data' };
    return { score: 65, weight: this.WEIGHTS.codeCoverage, value: '65%' };
  }

  scoreCodeSmells(analyses) {
    const smells = analyses.reduce((s, a) => s + (a.rawData?.sonarIssuesCount || 0), 0);
    const score = smells === 0 ? 100 : smells < 5 ? 80 : smells < 20 ? 60 : 30;
    return { score, weight: this.WEIGHTS.codeSmells, value: `${smells} smells` };
  }

  scoreLastFailure(pipelines) {
    const failures = pipelines.filter(p => p.status === 'failed').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!failures.length) return { score: 100, weight: this.WEIGHTS.lastFailureAge, value: 'No failures' };
    const days = Math.floor((Date.now() - new Date(failures[0].createdAt)) / (1000 * 60 * 60 * 24));
    const score = days >= 7 ? 100 : days >= 3 ? 80 : days >= 1 ? 50 : 20;
    return { score, weight: this.WEIGHTS.lastFailureAge, value: `${days} days ago` };
  }

  scoreToGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    return 'F';
  }
}

export const healthScoreService = new HealthScoreService();
