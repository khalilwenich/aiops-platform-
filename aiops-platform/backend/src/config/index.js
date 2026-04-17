import dotenv from 'dotenv';
dotenv.config();

export const config = Object.freeze({
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/aiops'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  gitlab: {
    baseUrl: process.env.GITLAB_URL || 'https://gitlab.com',
    token: process.env.GITLAB_TOKEN,
    webhookSecret: process.env.GITLAB_WEBHOOK_SECRET
  },
  sonarqube: {
    baseUrl: process.env.SONARQUBE_URL,
    token: process.env.SONARQUBE_TOKEN
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
  },
  rateLimit: {
    windowMs: 60 * 1000,
    max: 100
  }
});
