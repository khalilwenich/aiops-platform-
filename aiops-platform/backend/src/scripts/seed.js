/**
 * Seed script — creates the initial admin user.
 * Run once: node src/scripts/seed.js
 */
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

await connectDatabase();

const existing = await User.findOne({ email: 'admin@aiops.local' });
if (existing) {
  logger.info('Admin user already exists');
  process.exit(0);
}

const user = new User({
  email: 'admin@aiops.local',
  passwordHash: 'Admin@123456',   // hashed by pre-save hook
  name: 'Administrator',
  role: 'admin',
  isActive: true,
});

await user.save();
logger.info('Admin user created', { email: user.email, password: 'Admin@123456' });
process.exit(0);
