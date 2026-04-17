import { groqClient } from './groq.client.js';
import { buildRootCausePrompt } from './prompts/rootCause.prompt.js';
import { logger } from '../utils/logger.js';

class RootCauseAnalyzer {
  async analyze(normalizedData) {
    const prompt = buildRootCausePrompt(normalizedData);
    const start = Date.now();
    logger.info('Starting root cause analysis', {
      projectId: normalizedData.pipelineContext?.projectId,
      pipelineId: normalizedData.pipelineContext?.id,
    });
    let result;
    try {
      result = await groqClient.completeJSON(prompt);
    } catch (error) {
      logger.error('Root cause analysis failed — check GROQ_API_KEY', { error: error.message });
      result = {
        errorType: 'unknown',
        rootCause: 'AI analysis unavailable. Check GROQ_API_KEY in .env',
        summary: 'Could not connect to Groq API. Get a free key at console.groq.com',
        confidence: 0,
        riskLevel: 'medium',
        affectedFiles: [],
        suggestedFixes: [{
          priority: 'high',
          description: 'Add Groq API key to backend/.env',
          command: 'echo "GROQ_API_KEY=gsk_xxxx" >> .env',
          codeHint: '',
        }],
        relatedCommit: null,
      };
    }

    result.processingTime = Date.now() - start;
    logger.info('Root cause analysis completed', {
      errorType: result.errorType,
      confidence: result.confidence,
      processingTime: result.processingTime,
    });
    return result;
  }
}

export const rootCauseAnalyzer = new RootCauseAnalyzer();
