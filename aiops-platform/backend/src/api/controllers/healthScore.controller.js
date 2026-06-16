import { healthScoreService } from '../../services/healthScore.service.js';
import { ProjectHealth }      from '../../models/ProjectHealth.model.js';

export async function getAllScores(req, res, next) {
  try {
    const scores = await healthScoreService.getAllScores();
    res.json(scores);
  } catch (error) {
    next(error);
  }
}

export async function getProjectScore(req, res, next) {
  try {
    const { projectId } = req.params;
    const score = await healthScoreService.computeScore(projectId);
    res.json(score);
  } catch (error) {
    next(error);
  }
}

export async function getScoreHistory(req, res, next) {
  try {
    const { projectId } = req.params;
    const history = await ProjectHealth.find({ projectId })
      .sort({ computedAt: -1 })
      .limit(8)
      .lean();
    res.json(history);
  } catch (error) {
    next(error);
  }
}

export async function computeAll(req, res, next) {
  try {
    const scores = await healthScoreService.computeAllScores();
    res.json({ computed: scores.length, scores });
  } catch (error) {
    next(error);
  }
}
