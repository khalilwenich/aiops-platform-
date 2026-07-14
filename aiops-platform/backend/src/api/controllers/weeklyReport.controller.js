import { weeklyReportService } from '../../services/weeklyReport.service.js';

export async function getCurrentReport(req, res, next) {
  try {
    const projectIds = req.accessibleProjects ?? null;
    const report = await weeklyReportService.generateReport(0, projectIds);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function getReport(req, res, next) {
  try {
    const weekOffset = parseInt(req.params.weekOffset, 10) || 0;
    const projectIds = req.accessibleProjects ?? null;
    const report = await weeklyReportService.generateReport(weekOffset, projectIds);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function listReports(req, res, next) {
  try {
    const weeks = weeklyReportService.listAvailableWeeks(8);
    res.json(weeks);
  } catch (error) {
    next(error);
  }
}
