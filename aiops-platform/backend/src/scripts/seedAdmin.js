import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { config } from '../config/index.js';

dotenv.config();

async function seed() {
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'khalil.benyahiawenich@esprit.tn' });
  if (existing) {
    console.log('Admin user already exists');
    process.exit(0);
  }

  const admin = new User({
    email: 'khalil.benyahiawenich@esprit.tn',
    passwordHash: 'Esprit2026!',
    name: 'Khalil Benyahia',
    role: 'admin',
    isActive: true,
  });

  await admin.save();
  console.log('Admin user created:');
  console.log('  Email   : khalil.benyahiawenich@esprit.tn');
  console.log('  Password: Esprit2026!');
  console.log('  Role    : admin');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
