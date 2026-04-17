import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class ClaudeClient {
  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropic.apiKey });
    this.model = config.anthropic.model;
  }

  async complete(prompt, options = {}) {
    const start = Date.now();
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 1500,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.2,
      });
      const text = response.content[0].text;
      logger.info('Claude API call completed', {
        duration: Date.now() - start,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });
      return text;
    } catch (error) {
      logger.error('Claude API error', { error: error.message });
      throw error;
    }
  }

  async completeJSON(prompt, options = {}) {
    const raw = await this.complete(prompt, options);
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      logger.error('Failed to parse Claude JSON response', {
        raw: cleaned.substring(0, 200),
        error: parseError.message,
      });
      throw new Error(`Claude returned invalid JSON: ${parseError.message}`);
    }
  }
}

export const claudeClient = new ClaudeClient();
