import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  actor:     { type: String },
  action:    { type: String },
  message:   { type: String },
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  incidentId:  { type: String, required: true, unique: true },
  title:       { type: String, required: true },
  projectId:   { type: String, required: true, index: true },
  projectName: { type: String },
  pipelineId:  { type: String },
  severity:    { type: String, enum: ['critical','high','medium','low'] },
  status:      { type: String, enum: ['open','investigating','resolved'], default: 'open' },
  detectedAt:  { type: Date, default: Date.now },
  resolvedAt:  { type: Date },
  mttr:        { type: Number },
  assignedTo:  { type: String },
  timeline:    [timelineEntrySchema],
  postMortem:  { type: String },
  analysis:    { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis' },
}, { timestamps: true });

export const Incident = mongoose.model('Incident', incidentSchema);
