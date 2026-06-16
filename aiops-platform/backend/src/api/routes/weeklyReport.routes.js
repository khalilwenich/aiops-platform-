import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getCurrentReport, getReport, listReports } from '../controllers/weeklyReport.controller.js';

const router = Router();

router.get('/',           authenticate, listReports);
router.get('/current',    authenticate, getCurrentReport);
router.get('/:weekOffset', authenticate, getReport);

export default router;
