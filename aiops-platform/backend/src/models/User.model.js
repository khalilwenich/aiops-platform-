import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  name: String,
  role: {
    type: String,
    enum: ['admin', 'analyst', 'viewer'],
    default: 'viewer',
  },
  lastLoginAt: Date,
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
