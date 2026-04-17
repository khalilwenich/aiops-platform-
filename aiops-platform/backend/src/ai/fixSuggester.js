import { groqClient } from './groq.client.js';
import { buildFixSuggesterPrompt } from './prompts/fixSuggester.prompt.js';
import { logger } from '../utils/logger.js';

class FixSuggester {
  async suggest(errorType, rootCause, context = {}) {
    try {
      const prompt = buildFixSuggesterPrompt(errorType, rootCause, context);
      const result = await groqClient.completeJSON(prompt, { maxTokens: 800 });
      return result.fixes || [];
    } catch (error) {
      logger.error('Fix suggestion failed', { error: error.message });
      return [];
    }
  }
}

export const fixSuggester = new FixSuggester();
