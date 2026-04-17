import mongoose from 'mongoose';

const suggestedFixSchema = new mongoose.Schema({
  priority: { type: String, enum: ['high', 'medium', 'low'] },
  description: String,
  command: String,
  codeHint: String,
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  pipelineId: { type: String, required: true, index: true },
  projectId: { type: String, required: true },
  errorType: {
    type: String,
    enum: ['build_failure', 'test_failure', 'dependency_issue', 'security_vulnerability', 'unknown'],
  },
  rootCause: String,
  summary: String,
  confidence: { type: Number, min: 0, max: 1 },
  riskLevel: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
  suggestedFixes: [suggestedFixSchema],
  affectedFiles: [String],
  processingTime: Number,
  resolved: { type: Boolean, default: false },
  resolvedAt: Date,
  mttr: Number,
  rawData: {
    logsSample: [String],
    sonarIssuesCount: Number,
    vulnCount: Number,
  },
}, { timestamps: true });

export const Analysis = mongoose.model('Analysis', analysisSchema);
