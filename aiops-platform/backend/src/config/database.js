import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

async function connectDatabase() {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      await mongoose.connect(config.mongodb.uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info('MongoDB connected successfully');
      return;
    } catch (error) {
      attempts++;
      const delay = INITIAL_DELAY * Math.pow(2, attempts - 1);
      logger.error(`MongoDB connection attempt ${attempts}/${MAX_RETRIES} failed`, {
        error: error.message,
        retryIn: delay
      });
      if (attempts >= MAX_RETRIES) {
        logger.error('MongoDB max connection attempts reached. Exiting.');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Closing MongoDB connection...`);
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');
}

process.on('SIGINT', () => gracefulShutdown('SIGINT').then(() => process.exit(0)));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM').then(() => process.exit(0)));

export { connectDatabase };
