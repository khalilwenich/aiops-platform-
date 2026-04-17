import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { redisClient, bullmqConnection } from './config/redis.js';
import { logger } from './utils/logger.js';
import { setIO } from './socket.js';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setIO(io);

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

async function startServer() {
  try {
    // Register process handlers first so any worker import error is caught
    await connectDatabase();
    await redisClient.connect().catch(() => {});

    // Import workers INSIDE startServer so errors are properly caught
    await import('./queues/workers/pipelineAnalysis.worker.js');
    await import('./queues/workers/logCollection.worker.js');
    await import('./queues/workers/notification.worker.js');

    server.listen(config.port, () => {
      logger.info(`AIOps backend running on port ${config.port}`, {
        env: config.nodeEnv,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await redisClient.quit();
      await bullmqConnection.quit();
      logger.info('Redis connections closed');
    } catch (err) {
      logger.error('Error closing Redis', { error: err.message });
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

startServer();
