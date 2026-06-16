import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { getAllEntries, getEntryById, searchEntries, getStats, deleteEntry } from '../controllers/knowledgeBase.controller.js';

const router = Router();

router.get('/',        authenticate, getAllEntries);
router.get('/stats',   authenticate, getStats);
router.get('/search',  authenticate, searchEntries);
router.get('/:id',     authenticate, getEntryById);
router.delete('/:id',  authenticate, authorize('admin'), deleteEntry);

export default router;
