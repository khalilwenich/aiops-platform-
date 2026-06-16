import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
  errorSignature: { type: String, required: true, unique: true, index: true },
  errorType: {
    type: String,
    enum: ['build_failure','test_failure','dependency_issue','security_vulnerability','configuration_error','unknown'],
  },
  title:       { type: String, required: true },
  rootCause:   { type: String, required: true },
  solution:    { type: String, required: true },
  command:     { type: String, default: null },
  codeHint:    { type: String, default: null },
  tags:        [String],
  usedCount:   { type: Number, default: 1 },
  successRate: { type: Number, default: 100, min: 0, max: 100 },
  projectIds:  [String],
  lastUsed:    { type: Date, default: Date.now },
  createdBy:   { type: String },
}, { timestamps: true });

knowledgeBaseSchema.index({ errorType: 1, usedCount: -1 });

export const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
