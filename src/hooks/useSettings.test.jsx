import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRecentReads } from './useSettings';

const RECENT_KEY = 'bible_recent';

describe('useRecentReads', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deduplicates entries and moves the latest open to the top', () => {
    const { result } = renderHook(() => useRecentReads());

    act(() => {
      result.current.addRecent(1, 1);
      result.current.addRecent(2, 1);
      result.current.addRecent(1, 1);
    });

    expect(result.current.recent).toHaveLength(2);
    expect(result.current.recent[0].book).toBe(1);
    expect(result.current.recent[0].chapter).toBe(1);
  });

  it('keeps only the latest 10 entries', () => {
    const { result } = renderHook(() => useRecentReads());

    act(() => {
      for (let i = 1; i <= 12; i += 1) {
        result.current.addRecent(i, 1);
      }
    });

    expect(result.current.recent).toHaveLength(10);
    expect(result.current.recent[0].book).toBe(12);
    expect(result.current.recent[9].book).toBe(3);

    const persisted = JSON.parse(localStorage.getItem(RECENT_KEY));
    expect(persisted).toHaveLength(10);
  });
});
