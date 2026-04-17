import { groqClient } from './groq.client.js';
import { buildClassifierPrompt } from './prompts/classifier.prompt.js';
import { logger } from '../utils/logger.js';

class ErrorClassifier {
  async classify(errorText) {
    try {
      const prompt = buildClassifierPrompt(errorText);
      return await groqClient.completeJSON(prompt, { maxTokens: 200 });
    } catch (error) {
      logger.error('Error classification failed', { error: error.message });
      return { errorType: 'unknown', confidence: 0, reason: 'Classification failed' };
    }
  }
}

export const errorClassifier = new ErrorClassifier();
