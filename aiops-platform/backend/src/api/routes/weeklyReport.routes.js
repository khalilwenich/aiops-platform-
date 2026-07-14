import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { resolveTeamAccess } from '../middlewares/teamAccess.middleware.js';
import { getCurrentReport, getReport, listReports } from '../controllers/weeklyReport.controller.js';

const router = Router();

router.get('/',            authenticate, listReports);
router.get('/current',     authenticate, resolveTeamAccess, getCurrentReport);
router.get('/:weekOffset', authenticate, resolveTeamAccess, getReport);

export default router;
