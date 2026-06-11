import { describe, it, expect } from 'vitest';
import { getListeningStreak } from './streaks';

const dayKey = (offsetDays) => {
  const d = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

describe('getListeningStreak', () => {
  it('returns 0 for empty or missing input', () => {
    expect(getListeningStreak([])).toBe(0);
    expect(getListeningStreak(undefined)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(getListeningStreak([dayKey(2), dayKey(1), dayKey(0)])).toBe(3);
  });

  it('keeps the streak alive if last listen was yesterday', () => {
    expect(getListeningStreak([dayKey(2), dayKey(1)])).toBe(2);
  });

  it('returns 0 when the last listen was two or more days ago', () => {
    expect(getListeningStreak([dayKey(3), dayKey(2)])).toBe(0);
  });

  it('ignores days before a gap', () => {
    expect(getListeningStreak([dayKey(5), dayKey(4), dayKey(1), dayKey(0)])).toBe(2);
  });
});
