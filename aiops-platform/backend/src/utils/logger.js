import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage();

const { combine, timestamp, colorize, simple, json, errors } = winston.format;

const addRequestId = winston.format((info) => {
  const store = asyncLocalStorage.getStore();
  if (store && store.requestId) {
    info.requestId = store.requestId;
  }
  return info;
})();

const devFormat = combine(
  errors({ stack: true }),
  addRequestId,
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize({ all: true }),
  simple()
);

const prodFormat = combine(
  errors({ stack: true }),
  addRequestId,
  timestamp(),
  json()
);

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console()
  ],
  exceptionHandlers: [
    new winston.transports.Console()
  ],
  rejectionHandlers: [
    new winston.transports.Console()
  ]
});

export default logger;
