import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './utils/logger.js';
import webhookRoutes from './api/routes/webhook.routes.js';
import pipelineRoutes from './api/routes/pipeline.routes.js';
import analysisRoutes from './api/routes/analysis.routes.js';
import healthRoutes from './api/routes/health.routes.js';
import vulnerabilityRoutes  from './api/routes/vulnerability.routes.js';
import knowledgeRoutes      from './api/routes/knowledgeBase.routes.js';
import healthScoreRoutes    from './api/routes/healthScore.routes.js';
import incidentRoutes       from './api/routes/incident.routes.js';
import weeklyReportRoutes   from './api/routes/weeklyReport.routes.js';
import { errorHandler } from './api/middlewares/errorHandler.middleware.js';
import { User } from './models/User.model.js';
import { generateTokens, authenticate } from './api/middlewares/auth.middleware.js';
import { authLimiter } from './api/middlewares/rateLimiter.middleware.js';
import { metricsMiddleware, metricsHandler } from './api/middlewares/metrics.middleware.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Auth routes ────────────────────────────────────────────────────────────

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = generateTokens(user);
    logger.info('User logged in', { email: user.email, role: user.role });

    res.json({
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/refresh', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

// ─── API routes ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/webhooks', webhookRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/knowledge',      knowledgeRoutes);
app.use('/api/health-score',   healthScoreRoutes);
app.use('/api/incidents',      incidentRoutes);
app.use('/api/reports',        weeklyReportRoutes);

// ─── 404 ────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler (must be last) ────────────────────────────────────

app.use(errorHandler);

export default app;
