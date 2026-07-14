import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getAll, getById, create, update, remove,
  addMember, removeMember, getMyTeams,
} from '../controllers/team.controller.js';

const router = Router();

router.get('/me',             authenticate, getMyTeams);
router.get('/',               authenticate, authorize('admin'), getAll);
router.get('/:id',            authenticate, authorize('admin'), getById);
router.post('/',              authenticate, authorize('admin'), create);
router.patch('/:id',          authenticate, authorize('admin'), update);
router.delete('/:id',         authenticate, authorize('admin'), remove);
router.post('/:id/members',   authenticate, authorize('admin'), addMember);
router.delete('/:id/members/:userId', authenticate, authorize('admin'), removeMember);

export default router;
