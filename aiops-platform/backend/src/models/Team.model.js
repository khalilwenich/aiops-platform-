import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  projectIds: [{ type: String }],
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['lead', 'member'], default: 'member' },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

teamSchema.index({ 'members.userId': 1 });

// Returns projectIds the given userId can access, or null if admin (unrestricted).
teamSchema.statics.getAccessibleProjects = async function (userId, userRole) {
  if (userRole === 'admin') return null;
  const teams = await this.find({ 'members.userId': userId }).select('projectIds').lean();
  if (!teams.length) return null; // no team assigned → unrestricted (backward compat)
  const ids = [...new Set(teams.flatMap(t => t.projectIds))];
  return ids;
};

export const Team = mongoose.model('Team', teamSchema);
