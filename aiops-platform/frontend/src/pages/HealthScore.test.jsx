import { describe, it, expect } from 'vitest';
import { buildHistory } from './HealthScore.jsx';

describe('buildHistory', () => {
  it('returns an empty array when no project has history', () => {
    expect(buildHistory([], {})).toEqual([]);
  });

  it('builds one point per week, keyed by project name', () => {
    const projects = [{ projectId: '1', projectName: 'api-backend' }];
    const historyByProject = {
      1: [
        { score: 80, computedAt: '2026-06-01' },
        { score: 70, computedAt: '2026-05-25' },
      ],
    };
    const result = buildHistory(projects, historyByProject);
    expect(result).toHaveLength(2);
    expect(result[0].week).toBe('W1');
    expect(result[1].week).toBe('W2');
    // entries are reversed (oldest first) so the most recent score lands last
    expect(result[1]['api-backend']).toBe(80);
    expect(result[0]['api-backend']).toBe(70);
  });
});
