import { describe, it, expect } from 'vitest';
import { knowledgeBaseService } from './knowledgeBase.service.js';

describe('knowledgeBaseService.generateSignature', () => {
  it('is deterministic for the same errorType and rootCause', () => {
    const sig1 = knowledgeBaseService.generateSignature('build_failure', 'Docker socket unavailable');
    const sig2 = knowledgeBaseService.generateSignature('build_failure', 'Docker socket unavailable');
    expect(sig1).toBe(sig2);
  });

  it('is case-insensitive and trims whitespace', () => {
    const sig1 = knowledgeBaseService.generateSignature('build_failure', '  Docker Socket Unavailable  ');
    const sig2 = knowledgeBaseService.generateSignature('build_failure', 'docker socket unavailable');
    expect(sig1).toBe(sig2);
  });

  it('differs when the errorType differs', () => {
    const sig1 = knowledgeBaseService.generateSignature('build_failure', 'Docker socket unavailable');
    const sig2 = knowledgeBaseService.generateSignature('test_failure', 'Docker socket unavailable');
    expect(sig1).not.toBe(sig2);
  });
});

describe('knowledgeBaseService.extractTags', () => {
  it('always includes the errorType as a tag', () => {
    const tags = knowledgeBaseService.extractTags({ errorType: 'dependency_issue', rootCause: '' });
    expect(tags).toContain('dependency_issue');
  });

  it('detects known keywords in the root cause', () => {
    const tags = knowledgeBaseService.extractTags({
      errorType: 'dependency_issue',
      rootCause: 'npm ERESOLVE peer dependency conflict while running docker build',
    });
    expect(tags).toContain('npm');
    expect(tags).toContain('docker');
    expect(tags).not.toContain('python');
  });
});

describe('knowledgeBaseService.extractSignatures', () => {
  it('returns two signatures derived from different log snippet lengths', () => {
    const signatures = knowledgeBaseService.extractSignatures(
      'build_failure',
      'a very long log line that repeats the same failure over and over again'
    );
    expect(signatures).toHaveLength(2);
    expect(signatures[0]).not.toBe(signatures[1]);
  });
});
