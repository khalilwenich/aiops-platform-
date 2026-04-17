import axios from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from './logger.js';

export function createHttpClient(baseURL, token) {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return axiosRetry.isNetworkError(error) ||
        axiosRetry.isRetryableError(error) ||
        error.response?.status === 429 ||
        (error.response?.status >= 500 && error.response?.status <= 599);
    },
    onRetry: (retryCount, error) => {
      logger.warn(`HTTP request retry attempt ${retryCount}`, {
        url: error.config?.url,
        error: error.message
      });
    }
  });

  client.interceptors.request.use((reqConfig) => {
    if (token) {
      reqConfig.headers['Authorization'] = `Bearer ${token}`;
    }
    return reqConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      logger.error('HTTP request failed', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message
      });
      return Promise.reject(error);
    }
  );

  return client;
}

export default createHttpClient;
