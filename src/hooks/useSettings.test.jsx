import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsProvider, useRecentReads } from './useSettings';

const RECENT_KEY = 'bible_recent';

describe('useRecentReads', () => {
  const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;

  beforeEach(() => {
    localStorage.clear();
  });

  it('deduplicates entries and moves the latest open to the top', () => {
    const { result } = renderHook(() => useRecentReads(), { wrapper });

    act(() => {
      result.current.addRecent(1, 1);
      result.current.addRecent(2, 1);
      result.current.addRecent(1, 1);
    });

    expect(result.current.recent).toHaveLength(2);
    expect(result.current.recent[0].book).toBe(1);
    expect(result.current.recent[0].chapter).toBe(1);
  });

  it('keeps only the latest 5 entries', () => {
    const { result } = renderHook(() => useRecentReads(), { wrapper });

    act(() => {
      for (let i = 1; i <= 12; i += 1) {
        result.current.addRecent(i, 1);
      }
    });

    expect(result.current.recent).toHaveLength(5);
    expect(result.current.recent[0].book).toBe(12);
    expect(result.current.recent[4].book).toBe(8);

    const persisted = JSON.parse(localStorage.getItem(RECENT_KEY));
    expect(persisted).toHaveLength(5);
  });
});
