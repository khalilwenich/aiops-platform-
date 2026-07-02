import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { OnCall } from '../../models/OnCall.model.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// GET current on-call person
router.get('/current', authenticate, async (req, res, next) => {
  try {
    const entry = await OnCall.getCurrentOnCall();
    res.json({ onCall: entry || null });
  } catch (error) {
    next(error);
  }
});

// GET planning schedule (next 30 days)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const from = new Date(req.query.from || Date.now());
    const to   = new Date(req.query.to   || Date.now() + 30 * 24 * 60 * 60 * 1000);
    const entries = await OnCall.find({ endsAt: { $gte: from }, startsAt: { $lte: to } })
      .populate('userId', 'name email role')
      .sort({ startsAt: 1 })
      .lean();
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

// POST create a new on-call slot (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { userId, startsAt, endsAt, note } = req.body;
    if (!userId || !startsAt || !endsAt) {
      return res.status(400).json({ error: 'userId, startsAt and endsAt are required' });
    }
    const entry = await OnCall.create({ userId, startsAt: new Date(startsAt), endsAt: new Date(endsAt), note });
    await entry.populate('userId', 'name email role');
    logger.info('On-call slot created', { by: req.user.email, userId, startsAt, endsAt });
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

// DELETE a slot (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await OnCall.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
