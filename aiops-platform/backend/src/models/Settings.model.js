import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  notifications: {
    pipeline: {
      failed: { type: Boolean, default: true },
      recovered: { type: Boolean, default: true },
      success: { type: Boolean, default: false },
      manual: { type: Boolean, default: true },
    },
    thresholds: {
      failureRate: { type: Number, default: 50 },
      mttr: { type: Number, default: 60 },
      confidence: { type: Number, default: 70 },
    },
    security: {
      critical: { type: Boolean, default: true },
      high: { type: Boolean, default: true },
      medium: { type: Boolean, default: false },
      qualityGate: { type: Boolean, default: true },
    },
    channels: {
      email: { enabled: { type: Boolean, default: false }, address: { type: String, default: '' } },
      slack: { enabled: { type: Boolean, default: false }, webhookUrl: { type: String, default: '' } },
    },
  },
  integrations: {
    gitlab: {
      url: { type: String, default: '' },
      token: { type: String, default: '' },
      secret: { type: String, default: '' },
      branch: { type: String, default: 'main' },
    },
    sonarqube: {
      url: { type: String, default: '' },
      token: { type: String, default: '' },
      project: { type: String, default: '' },
    },
    trivy: {
      source: { type: String, default: 'artifacts' },
      filename: { type: String, default: 'trivy-report.json' },
      severity: { type: String, default: 'HIGH' },
    },
    groq: {
      key: { type: String, default: '' },
      model: { type: String, default: 'llama-3.3-70b-versatile' },
      maxTokens: { type: Number, default: 1500 },
      temperature: { type: Number, default: 0.3 },
    },
  },
  ai: {
    behavior: {
      autoFailed: { type: Boolean, default: true },
      autoSuccess: { type: Boolean, default: false },
      reAnalyze: { type: Boolean, default: true },
      threshold: { type: Number, default: 60 },
    },
    errorTypes: {
      build: { type: Boolean, default: true },
      test: { type: Boolean, default: true },
      dep: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
      config: { type: Boolean, default: true },
      perf: { type: Boolean, default: true },
    },
    contextEnabled: { type: Boolean, default: false },
    contextText: { type: String, default: '' },
    fixes: {
      cli: { type: Boolean, default: true },
      code: { type: Boolean, default: true },
      autoResolve: { type: Boolean, default: false },
      maxFixes: { type: Number, default: 3 },
    },
  },
  platform: {
    retention: {
      pipelines: { type: Number, default: 90 },
      analyses: { type: Number, default: 90 },
      vulns: { type: Number, default: 180 },
    },
    maintenance: { type: Boolean, default: false },
  },
}, { timestamps: true });

settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export const Settings = mongoose.model('Settings', settingsSchema);
