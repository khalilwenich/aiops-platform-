import { describe, it, expect } from 'vitest';
import { timeSince } from './Incidents.jsx';

describe('timeSince', () => {
  it('formats a date a few minutes ago in minutes', () => {
    const date = new Date(Date.now() - 5 * 60000);
    expect(timeSince(date)).toBe('5 minutes ago');
  });

  it('formats a date a few hours ago in hours', () => {
    const date = new Date(Date.now() - 3 * 3600000);
    expect(timeSince(date)).toBe('3 hours ago');
  });

  it('formats a date a few days ago in days', () => {
    const date = new Date(Date.now() - 2 * 86400000);
    expect(timeSince(date)).toBe('2 days ago');
  });
});
