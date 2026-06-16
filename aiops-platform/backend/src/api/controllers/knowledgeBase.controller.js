import { KnowledgeBase } from '../../models/KnowledgeBase.model.js';
import { knowledgeBaseService } from '../../services/knowledgeBase.service.js';
import { logger } from '../../utils/logger.js';

export async function getAllEntries(req, res, next) {
  try {
    const { page = 1, limit = 20, errorType, search } = req.query;
    const filter = {};
    if (errorType) filter.errorType = errorType;
    if (search)    filter.$or = [
      { title:     { $regex: search, $options: 'i' } },
      { rootCause: { $regex: search, $options: 'i' } },
      { tags:      { $in: [search.toLowerCase()] } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [entries, total] = await Promise.all([
      KnowledgeBase.find(filter).sort({ usedCount: -1 }).skip(skip).limit(Number(limit)).lean(),
      KnowledgeBase.countDocuments(filter),
    ]);

    res.json({ entries, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
}

export async function getEntryById(req, res, next) {
  try {
    const entry = await KnowledgeBase.findById(req.params.id).lean();
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    next(error);
  }
}

export async function searchEntries(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await knowledgeBaseService.search(q);
    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function getStats(req, res, next) {
  try {
    const [entries, typeGroups] = await Promise.all([
      KnowledgeBase.find().lean(),
      KnowledgeBase.aggregate([
        { $group: { _id: '$errorType', count: { $sum: 1 }, totalHits: { $sum: '$usedCount' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalEntries   = entries.length;
    const totalCacheHits = entries.reduce((s, e) => s + (e.usedCount || 0), 0);

    res.json({
      totalEntries,
      totalCacheHits,
      topErrorTypes:           typeGroups.map(g => ({ errorType: g._id, count: g.count, hits: g.totalHits })),
      estimatedApiCallsSaved:  Math.max(0, totalCacheHits - totalEntries),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEntry(req, res, next) {
  try {
    const entry = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    logger.info('KB entry deleted', { id: req.params.id, by: req.user?.email });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
