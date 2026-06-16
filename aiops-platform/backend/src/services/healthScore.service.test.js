import { describe, it, expect } from 'vitest';
import { healthScoreService } from './healthScore.service.js';

describe('healthScoreService.scorePipelineRate', () => {
  it('returns 50 with "No data" when there are no pipelines', () => {
    const result = healthScoreService.scorePipelineRate([]);
    expect(result.score).toBe(50);
    expect(result.value).toBe('No data');
  });

  it('computes the success percentage from pipeline statuses', () => {
    const pipelines = [
      { status: 'success' },
      { status: 'success' },
      { status: 'failed' },
      { status: 'success' },
    ];
    const result = healthScoreService.scorePipelineRate(pipelines);
    expect(result.score).toBe(75);
    expect(result.value).toBe('75%');
  });
});

describe('healthScoreService.scoreVulns', () => {
  it('returns a perfect score when there are no open vulnerabilities', () => {
    const result = healthScoreService.scoreVulns([]);
    expect(result.score).toBe(100);
  });

  it('penalizes critical vulnerabilities more than high ones', () => {
    const vulns = [
      { severity: 'CRITICAL' },
      { severity: 'HIGH' },
      { severity: 'HIGH' },
    ];
    const result = healthScoreService.scoreVulns(vulns);
    expect(result.score).toBe(60); // 100 - (1*20 + 2*10)
    expect(result.value).toBe('1 critical, 2 high');
  });

  it('never goes below zero even with many vulnerabilities', () => {
    const vulns = Array.from({ length: 10 }, () => ({ severity: 'CRITICAL' }));
    const result = healthScoreService.scoreVulns(vulns);
    expect(result.score).toBe(0);
  });
});

describe('healthScoreService.scoreLastFailure', () => {
  it('returns 100 when there are no failures', () => {
    const result = healthScoreService.scoreLastFailure([{ status: 'success', createdAt: new Date() }]);
    expect(result.score).toBe(100);
    expect(result.value).toBe('No failures');
  });

  it('scores recent failures lower than old ones', () => {
    const recentFailure = healthScoreService.scoreLastFailure([
      { status: 'failed', createdAt: new Date() },
    ]);
    const oldFailure = healthScoreService.scoreLastFailure([
      { status: 'failed', createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    ]);
    expect(recentFailure.score).toBeLessThan(oldFailure.score);
    expect(oldFailure.score).toBe(100);
  });
});

describe('healthScoreService.scoreToGrade', () => {
  it.each([
    [95, 'A'],
    [80, 'B'],
    [65, 'C'],
    [50, 'D'],
    [20, 'F'],
  ])('maps score %i to grade %s', (score, expected) => {
    expect(healthScoreService.scoreToGrade(score)).toBe(expected);
  });
});
