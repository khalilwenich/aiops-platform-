import mongoose from 'mongoose';

const failedJobSchema = new mongoose.Schema({
  jobId: String,
  jobName: String,
  stage: String,
}, { _id: false });

const pipelineSchema = new mongoose.Schema({
  pipelineId: { type: String, required: true, unique: true, index: true },
  projectId: { type: String, required: true, index: true },
  projectName: String,
  ref: String,
  status: {
    type: String,
    enum: ['running', 'failed', 'success', 'canceled'],
  },
  failedJobs: [failedJobSchema],
  triggeredBy: String,
  webUrl: String,
  createdAt: Date,
  finishedAt: Date,
  duration: Number,
}, { timestamps: true });

pipelineSchema.index({ projectId: 1, createdAt: -1 });

export const Pipeline = mongoose.model('Pipeline', pipelineSchema);
