import { Team } from '../../models/Team.model.js';

/**
 * Attaches req.accessibleProjects to every authenticated request.
 *   null  → no restriction (admin or user with no team assigned)
 *   []    → user is in teams but none have projects yet
 *   [...] → array of projectId strings the user may see
 */
export async function resolveTeamAccess(req, _res, next) {
  try {
    if (!req.user) return next();
    req.accessibleProjects = await Team.getAccessibleProjects(
      req.user.id,
      req.user.role,
    );
    next();
  } catch (err) {
    next(err);
  }
}

/** Build a MongoDB filter clause for projectId based on team access. */
export function projectFilter(req) {
  if (req.accessibleProjects === null) return {};          // unrestricted
  if (!req.accessibleProjects.length) return { projectId: '__none__' }; // no projects
  return { projectId: { $in: req.accessibleProjects } };
}
