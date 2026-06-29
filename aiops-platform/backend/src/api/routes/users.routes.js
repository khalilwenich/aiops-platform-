import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  list, create, update, resetPassword, changeOwnPassword,
  getOwnProfile, updateOwnProfile,
} from '../controllers/users.controller.js';

const router = Router();

router.get('/me',                  authenticate, getOwnProfile);
router.patch('/me',                authenticate, updateOwnProfile);
router.post('/me/change-password', authenticate, changeOwnPassword);

router.get('/',                    authenticate, authorize('admin'), list);
router.post('/',                   authenticate, authorize('admin'), create);
router.patch('/:id',               authenticate, authorize('admin'), update);
router.post('/:id/reset-password', authenticate, authorize('admin'), resetPassword);

export default router;
