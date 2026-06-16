import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { getAll, getById, updateStatus, addComment, generatePostMortem } from '../controllers/incident.controller.js';

const router = Router();

router.get('/',                        authenticate, getAll);
router.get('/:id',                     authenticate, getById);
router.patch('/:id/status',            authenticate, updateStatus);
router.post('/:id/comment',            authenticate, addComment);
router.post('/:id/postmortem',         authenticate, authorize('admin','analyst'), generatePostMortem);

export default router;
