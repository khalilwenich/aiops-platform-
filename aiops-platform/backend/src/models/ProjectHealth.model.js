import mongoose from 'mongoose';

const breakdownItemSchema = new mongoose.Schema({
  score:  { type: Number },
  weight: { type: Number },
  value:  { type: String },
}, { _id: false });

const projectHealthSchema = new mongoose.Schema({
  projectId:   { type: String, required: true },
  projectName: { type: String, required: true },
  score:       { type: Number, min: 0, max: 100 },
  grade:       { type: String, enum: ['A','B','C','D','F'] },
  trend:       { type: String, enum: ['up','down','stable'] },
  trendValue:  { type: Number },
  breakdown: {
    pipelineSuccessRate: breakdownItemSchema,
    codeCoverage:        breakdownItemSchema,
    criticalVulns:       breakdownItemSchema,
    codeSmells:          breakdownItemSchema,
    avgMTTR:             breakdownItemSchema,
    lastFailureAge:      breakdownItemSchema,
  },
  weekHistory: [{ week: String, score: Number }],
  computedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

projectHealthSchema.index({ projectId: 1, computedAt: -1 });

export const ProjectHealth = mongoose.model('ProjectHealth', projectHealthSchema);
