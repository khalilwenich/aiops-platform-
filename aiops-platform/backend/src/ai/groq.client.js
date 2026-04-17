import Groq from 'groq-sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class GroqClient {
  constructor() {
    this.client = new Groq({ apiKey: config.groq.apiKey });
    this.model = config.groq.model;
  }

  async complete(prompt, options = {}) {
    const start = Date.now();
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1500,
        temperature: options.temperature ?? 0.2,
      });

      const text = response.choices[0].message.content;
      logger.info('Groq API call completed', {
        model: this.model,
        duration: Date.now() - start,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      });
      return text;
    } catch (error) {
      logger.error('Groq API error', {
        model: this.model,
        error: error.message,
        hint: 'Check GROQ_API_KEY in .env — free key at console.groq.com',
      });
      throw error;
    }
  }

  async completeJSON(prompt, options = {}) {
    const raw = await this.complete(prompt, options);

    // Strip markdown fences if model adds them
    let cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Extract first JSON object/array from response
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    let jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

    // Fix unescaped newlines/tabs inside JSON string values
    jsonStr = jsonStr.replace(/("(?:[^"\\]|\\.)*")/g, (match) =>
      match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    );

    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      logger.error('Failed to parse Groq JSON response', {
        raw: cleaned.substring(0, 300),
        error: parseError.message,
      });
      throw new Error(`Groq returned invalid JSON: ${parseError.message}`);
    }
  }
}

export const groqClient = new GroqClient();
