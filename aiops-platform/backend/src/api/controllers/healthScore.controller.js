import { healthScoreService } from '../../services/healthScore.service.js';
import { ProjectHealth }      from '../../models/ProjectHealth.model.js';

function canAccessProject(req, projectId) {
  if (req.accessibleProjects === null) return true;
  return req.accessibleProjects.includes(projectId);
}

export async function getAllScores(req, res, next) {
  try {
    const scores = await healthScoreService.getAllScores();
    if (req.accessibleProjects === null) return res.json(scores);
    const accessible = new Set(req.accessibleProjects);
    res.json(scores.filter(s => accessible.has(s.projectId)));
  } catch (error) {
    next(error);
  }
}

export async function getProjectScore(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!canAccessProject(req, projectId)) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
    const score = await healthScoreService.computeScore(projectId);
    res.json(score);
  } catch (error) {
    next(error);
  }
}

export async function getScoreHistory(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!canAccessProject(req, projectId)) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }
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
