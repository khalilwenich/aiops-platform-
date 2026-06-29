import axios from 'axios';
import mongoose from 'mongoose';
import { Settings } from '../../models/Settings.model.js';
import { Analysis } from '../../models/Analysis.model.js';
import { Vulnerability } from '../../models/Vulnerability.model.js';
import { redisClient } from '../../config/redis.js';
import { pipelineQueue } from '../../queues/queues.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

const SECTIONS = ['notifications', 'integrations', 'ai', 'platform'];
const SECRET_PATHS = {
  integrations: ['gitlab.token', 'gitlab.secret', 'sonarqube.token', 'groq.key'],
};

function mask(value) {
  if (!value) return '';
  return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
}

function maskSecrets(section, data) {
  const paths = SECRET_PATHS[section];
  if (!paths) return data;
  const clone = JSON.parse(JSON.stringify(data));
  for (const path of paths) {
    const [group, key] = path.split('.');
    if (clone[group]?.[key]) clone[group][key] = mask(clone[group][key]);
  }
  return clone;
}

function mergeSecrets(section, existing, incoming) {
  const paths = SECRET_PATHS[section];
  if (!paths) return incoming;
  const merged = JSON.parse(JSON.stringify(incoming));
  for (const path of paths) {
    const [group, key] = path.split('.');
    // Blank/masked value from the form means "leave unchanged"
    const typed = merged[group]?.[key];
    if (!typed || typed.startsWith('••••')) {
      if (merged[group] && existing[group]) merged[group][key] = existing[group][key];
    }
  }
  return merged;
}

export async function getSettings(req, res, next) {
  try {
    const doc = await Settings.getSingleton();
    const settings = doc.toObject();
    settings.integrations = maskSecrets('integrations', settings.integrations);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSection(req, res, next) {
  try {
    const { section } = req.params;
    if (!SECTIONS.includes(section)) {
      return res.status(400).json({ error: 'Unknown settings section' });
    }

    const doc = await Settings.getSingleton();
    const existing = doc.toObject()[section];
    const merged = mergeSecrets(section, existing, req.body);
    doc.set(section, { ...existing, ...merged });
    doc.markModified(section);
    await doc.save();

    logger.info('Settings section updated', { section, updatedBy: req.user.email });

    const settings = doc.toObject();
    settings.integrations = maskSecrets('integrations', settings.integrations);
    res.json({ settings: settings[section] });
  } catch (error) {
    next(error);
  }
}

export async function testIntegration(req, res, next) {
  try {
    const { service } = req.params;
    const start = Date.now();

    if (service === 'gitlab') {
      const { url, token } = req.body;
      if (!url) return res.json({ success: false, message: 'GitLab URL is required' });
      await axios.get(`${url.replace(/\/$/, '')}/api/v4/version`, {
        headers: token ? { 'PRIVATE-TOKEN': token } : {},
        timeout: 5000,
      });
      return res.json({ success: true, latencyMs: Date.now() - start });
    }

    if (service === 'sonarqube') {
      const { url } = req.body;
      if (!url) return res.json({ success: false, message: 'SonarQube URL is required' });
      const response = await axios.get(`${url.replace(/\/$/, '')}/api/system/status`, { timeout: 5000 });
      const up = response.data?.status === 'UP';
      return res.json({ success: up, latencyMs: Date.now() - start, message: up ? undefined : `Status: ${response.data?.status}` });
    }

    if (service === 'groq') {
      const { key } = req.body;
      if (!key) return res.json({ success: false, message: 'API key is required' });
      await axios.get('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 5000,
      });
      return res.json({ success: true, latencyMs: Date.now() - start });
    }

    return res.status(400).json({ error: 'Unknown service' });
  } catch (error) {
    logger.warn('Integration test failed', { service: req.params.service, error: error.message });
    res.json({ success: false, message: error.response?.data?.message || error.message });
  }
}

async function pingUrl(url, headers) {
  const start = Date.now();
  await axios.get(url, { headers, timeout: 4000 });
  return Date.now() - start;
}

export async function getPlatformStatus(req, res, next) {
  try {
    const doc = await Settings.getSingleton();
    const integ = doc.toObject().integrations;

    const gitlabUrl = integ.gitlab.url || config.gitlab.baseUrl;
    const gitlabToken = integ.gitlab.token || config.gitlab.token;
    const sonarUrl = integ.sonarqube.url || config.sonarqube.baseUrl;
    const groqKey = integ.groq.key || config.groq.apiKey;

    const services = [];

    const mongoStart = Date.now();
    const mongoUp = mongoose.connection.readyState === 1;
    services.push({ name: 'MongoDB', status: mongoUp ? 'Connected' : 'Down', latencyMs: mongoUp ? Date.now() - mongoStart : null });

    try {
      const redisStart = Date.now();
      await redisClient.ping();
      services.push({ name: 'Redis', status: 'Connected', latencyMs: Date.now() - redisStart });
    } catch {
      services.push({ name: 'Redis', status: 'Down', latencyMs: null });
    }

    if (groqKey) {
      try {
        const latencyMs = await pingUrl('https://api.groq.com/openai/v1/models', { Authorization: `Bearer ${groqKey}` });
        services.push({ name: 'Groq API', status: 'Operational', latencyMs });
      } catch {
        services.push({ name: 'Groq API', status: 'Down', latencyMs: null });
      }
    } else {
      services.push({ name: 'Groq API', status: 'Not configured', latencyMs: null });
    }

    if (gitlabUrl) {
      try {
        const latencyMs = await pingUrl(`${gitlabUrl.replace(/\/$/, '')}/api/v4/version`, gitlabToken ? { 'PRIVATE-TOKEN': gitlabToken } : {});
        services.push({ name: 'GitLab', status: 'Connected', latencyMs });
      } catch {
        services.push({ name: 'GitLab', status: 'Down', latencyMs: null });
      }
    } else {
      services.push({ name: 'GitLab', status: 'Not configured', latencyMs: null });
    }

    if (sonarUrl) {
      try {
        const latencyMs = await pingUrl(`${sonarUrl.replace(/\/$/, '')}/api/system/status`);
        services.push({ name: 'SonarQube', status: 'Connected', latencyMs });
      } catch {
        services.push({ name: 'SonarQube', status: 'Down', latencyMs: null });
      }
    } else {
      services.push({ name: 'SonarQube', status: 'Not configured', latencyMs: null });
    }

    const activeJobs = await pipelineQueue.getActiveCount();
    services.push({ name: 'BullMQ', status: 'Running', activeJobs });

    res.json({
      services,
      platformInfo: {
        nodeEnv: config.nodeEnv,
        nodeVersion: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function clearCache(req, res, next) {
  try {
    await redisClient.flushdb();
    logger.info('Redis cache cleared', { by: req.user.email });
    res.json({ message: 'Redis cache cleared' });
  } catch (error) {
    next(error);
  }
}

export async function purgeOldAnalyses(req, res, next) {
  try {
    const doc = await Settings.getSingleton();
    const retentionDays = doc.platform.retention.analyses;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const { deletedCount } = await Analysis.deleteMany({ createdAt: { $lt: cutoff } });
    logger.info('Old analyses purged', { by: req.user.email, deletedCount, retentionDays });
    res.json({ message: `${deletedCount} analyses purged`, deletedCount });
  } catch (error) {
    next(error);
  }
}

export async function exportData(req, res, next) {
  try {
    const [analyses, vulnerabilities] = await Promise.all([
      Analysis.find().sort({ createdAt: -1 }).limit(1000).lean(),
      Vulnerability.find().sort({ createdAt: -1 }).limit(1000).lean(),
    ]);

    res.setHeader('Content-Disposition', 'attachment; filename="aiops-export.json"');
    res.json({ exportedAt: new Date().toISOString(), analyses, vulnerabilities });
  } catch (error) {
    next(error);
  }
}

export async function testSlackWebhook(req, res, next) {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl) return res.json({ success: false, message: 'Webhook URL is required' });

    await axios.post(webhookUrl, { text: 'AIOps: test notification from Settings page' }, { timeout: 5000 });
    res.json({ success: true });
  } catch (error) {
    logger.warn('Slack webhook test failed', { error: error.message });
    res.json({ success: false, message: error.response?.data || error.message });
  }
}
