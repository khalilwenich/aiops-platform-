import crypto from 'crypto';
import { KnowledgeBase } from '../models/KnowledgeBase.model.js';
import { logger } from '../utils/logger.js';

class KnowledgeBaseService {
  generateSignature(errorType, rootCause) {
    const normalized = `${errorType}:${rootCause.slice(0, 100).toLowerCase().trim()}`;
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  async findCachedSolution(errorType, logSnippet) {
    const signatures = this.extractSignatures(errorType, logSnippet);
    const entry = await KnowledgeBase.findOne({
      errorSignature: { $in: signatures },
    }).sort({ usedCount: -1 });

    if (entry) {
      await KnowledgeBase.updateOne(
        { _id: entry._id },
        { $inc: { usedCount: 1 }, $set: { lastUsed: new Date() } }
      );
      logger.info('KB cache hit', { signature: entry.errorSignature, type: entry.errorType });
      return entry;
    }
    return null;
  }

  async saveFromAnalysis(analysis, resolvedBy) {
    const signature = this.generateSignature(analysis.errorType, analysis.rootCause);
    const existing = await KnowledgeBase.findOne({ errorSignature: signature });

    if (existing) {
      await KnowledgeBase.updateOne(
        { _id: existing._id },
        {
          $inc: { usedCount: 1 },
          $addToSet: { projectIds: analysis.projectId },
          $set: { lastUsed: new Date() },
        }
      );
      return existing;
    }

    const fix = analysis.suggestedFixes?.[0];
    return KnowledgeBase.create({
      errorSignature: signature,
      errorType:      analysis.errorType,
      title:          (analysis.rootCause || '').slice(0, 80),
      rootCause:      analysis.rootCause,
      solution:       fix?.description || analysis.summary || '',
      command:        fix?.command || null,
      codeHint:       fix?.codeHint || null,
      tags:           this.extractTags(analysis),
      projectIds:     [analysis.projectId],
      createdBy:      resolvedBy,
    });
  }

  async getTopSolutions(limit = 20) {
    return KnowledgeBase.find().sort({ usedCount: -1 }).limit(limit).lean();
  }

  async search(query) {
    return KnowledgeBase.find({
      $or: [
        { title:     { $regex: query, $options: 'i' } },
        { rootCause: { $regex: query, $options: 'i' } },
        { tags:      { $in: [query.toLowerCase()] } },
        { errorType: query },
      ],
    }).sort({ usedCount: -1 }).limit(20).lean();
  }

  extractTags(analysis) {
    const tags = [analysis.errorType];
    const rc = (analysis.rootCause || '').toLowerCase();
    if (rc.includes('npm'))    tags.push('npm');
    if (rc.includes('docker')) tags.push('docker');
    if (rc.includes('python')) tags.push('python');
    if (rc.includes('test'))   tags.push('testing');
    if (rc.includes('maven'))  tags.push('maven');
    return tags;
  }

  extractSignatures(errorType, logSnippet) {
    return [
      this.generateSignature(errorType, logSnippet.slice(0, 100)),
      this.generateSignature(errorType, logSnippet.slice(0, 50)),
    ];
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
