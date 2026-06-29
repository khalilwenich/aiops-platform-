import crypto from 'crypto';
import { User } from '../../models/User.model.js';
import { logger } from '../../utils/logger.js';

function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url'); // 12 chars, URL-safe
}

export async function list(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { email, name, role = 'viewer' } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    if (!['admin', 'analyst', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const tempPassword = generateTempPassword();
    const user = new User({
      email: email.toLowerCase(),
      name,
      role,
      passwordHash: tempPassword,
      mustChangePassword: true,
      createdBy: req.user.id,
    });
    await user.save();

    logger.info('User created by admin', { createdBy: req.user.email, newUser: user.email, role });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      tempPassword,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (role) {
      if (!['admin', 'analyst', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      user.role = role;
    }
    if (typeof isActive === 'boolean') {
      if (user._id.toString() === req.user.id && !isActive) {
        return res.status(400).json({ error: 'You cannot deactivate your own account' });
      }
      user.isActive = isActive;
    }

    await user.save();
    logger.info('User updated by admin', { updatedBy: req.user.email, targetUser: user.email, role, isActive });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tempPassword = generateTempPassword();
    user.passwordHash = tempPassword;
    user.mustChangePassword = true;
    await user.save();

    logger.info('Password reset by admin', { resetBy: req.user.email, targetUser: user.email });

    res.json({ tempPassword });
  } catch (error) {
    next(error);
  }
}

export async function getOwnProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title,
        department: user.department,
        phone: user.phone,
        preferences: user.preferences,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOwnProfile(req, res, next) {
  try {
    const { name, title, department, phone, preferences } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof title === 'string') user.title = title;
    if (typeof department === 'string') user.department = department;
    if (typeof phone === 'string') user.phone = phone;
    if (preferences && typeof preferences === 'object') {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title,
        department: user.department,
        phone: user.phone,
        preferences: user.preferences,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function changeOwnPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    user.mustChangePassword = false;
    await user.save();

    logger.info('User changed own password', { email: user.email });

    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
}
